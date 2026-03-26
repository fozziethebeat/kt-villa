/**
 * Spotify API utilities.
 *
 * Supports two auth flows:
 * - Client Credentials (server-to-server, public playlists only)
 * - Authorization Code (user login via OAuth, private playlists)
 */

// ─── Client Credentials (for CLI / public playlists) ───────────

export async function getClientCredentialsToken(): Promise<string> {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error('Missing SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET');
  }

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization:
        'Basic ' +
        Buffer.from(`${clientId}:${clientSecret}`).toString('base64'),
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Spotify auth failed (${response.status}): ${text}`);
  }

  const data = await response.json();
  return data.access_token;
}

export interface SpotifyTrack {
  title: string;
  artist: string;
  albumArt: string | null;
  spotifyUrl: string;
}

interface SpotifyPlaylistItem {
  track: {
    name: string;
    artists: { name: string }[];
    album: {
      images: { url: string; height: number; width: number }[];
    };
    external_urls: {
      spotify: string;
    };
  } | null;
}

// ─── URL / ID helpers ──────────────────────────────────────────

/**
 * Extract the playlist ID from various Spotify URL formats.
 * Supports:
 *   - https://open.spotify.com/playlist/726c1eB8UK67ytOo1BISbv?si=abc123
 *   - spotify:playlist:726c1eB8UK67ytOo1BISbv
 *   - 726c1eB8UK67ytOo1BISbv (raw ID)
 */
export function extractPlaylistId(input: string): string {
  const uriMatch = input.match(/spotify:playlist:([a-zA-Z0-9]+)/);
  if (uriMatch) return uriMatch[1];

  const urlMatch = input.match(
    /open\.spotify\.com\/playlist\/([a-zA-Z0-9]+)/
  );
  if (urlMatch) return urlMatch[1];

  if (/^[a-zA-Z0-9]{22}$/.test(input)) return input;

  throw new Error(
    `Could not extract playlist ID from: "${input}"\n` +
      'Expected a Spotify playlist URL, URI, or 22-character ID.'
  );
}

// ─── OAuth helpers ─────────────────────────────────────────────

const SPOTIFY_SCOPES = 'playlist-read-private playlist-read-collaborative';

export function getSpotifyAuthUrl(redirectUri: string, state: string): string {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  if (!clientId) throw new Error('Missing SPOTIFY_CLIENT_ID');

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    scope: SPOTIFY_SCOPES,
    redirect_uri: redirectUri,
    state,
  });

  return `https://accounts.spotify.com/authorize?${params.toString()}`;
}

export async function exchangeCodeForToken(
  code: string,
  redirectUri: string
): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error('Missing SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET');
  }

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization:
        'Basic ' +
        Buffer.from(`${clientId}:${clientSecret}`).toString('base64'),
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Spotify token exchange failed (${response.status}): ${text}`);
  }

  const data = await response.json();
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
  };
}

// ─── Playlist fetching ─────────────────────────────────────────

/**
 * Fetch all tracks from a Spotify playlist using a user access token.
 * Handles pagination automatically.
 */
export async function fetchPlaylistTracks(
  playlistInput: string,
  accessToken: string
): Promise<{ name: string; tracks: SpotifyTrack[] }> {
  const playlistId = extractPlaylistId(playlistInput);
  const tracks: SpotifyTrack[] = [];
  const headers = { Authorization: `Bearer ${accessToken}` };

  // Step 1: Get playlist name
  const metaResponse = await fetch(
    `https://api.spotify.com/v1/playlists/${playlistId}?fields=name`,
    { headers }
  );

  if (!metaResponse.ok) {
    const text = await metaResponse.text();
    if (metaResponse.status === 401) {
      throw new Error('SPOTIFY_AUTH_EXPIRED');
    }
    throw new Error(
      `Spotify API error (${metaResponse.status}): ${text}`
    );
  }

  const meta = await metaResponse.json();
  const playlistName = meta.name;

  // Step 2: Fetch tracks via dedicated tracks endpoint (works for private playlists)
  let url: string | null =
    `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=100`;

  while (url) {
    const response: Response = await fetch(url, { headers });

    if (!response.ok) {
      const text = await response.text();
      if (response.status === 401) {
        throw new Error('SPOTIFY_AUTH_EXPIRED');
      }
      console.error(`[Spotify] Tracks fetch failed (${response.status}): ${text}`);
      break;
    }

    const page: { items?: SpotifyPlaylistItem[]; next: string | null; total: number } = await response.json();
    console.log(`[Spotify] Fetched page — ${page.items?.length} items, total: ${page.total}`);

    if (page.items) {
      for (const item of page.items) {
        const parsed = parseTrackItem(item);
        if (parsed) tracks.push(parsed);
      }
    }

    url = page.next;
  }

  console.log(`[Spotify] Playlist "${playlistName}" — parsed ${tracks.length} tracks`);
  return { name: playlistName, tracks };
}

function parseTrackItem(item: SpotifyPlaylistItem): SpotifyTrack | null {
  if (!item.track) return null;

  const albumImages = item.track.album.images;
  const albumArt =
    albumImages.find((img) => img.height === 300)?.url ??
    albumImages[0]?.url ??
    null;

  return {
    title: item.track.name,
    artist: item.track.artists.map((a) => a.name).join(', '),
    albumArt,
    spotifyUrl: item.track.external_urls.spotify,
  };
}
