/**
 * Spotify API utilities.
 *
 * Uses OAuth Authorization Code flow with automatic token refresh.
 * Connect once via the web UI, then tokens auto-refresh forever.
 */

export interface SpotifyTrack {
  title: string;
  artist: string;
  albumArt: string | null;
  spotifyUrl: string;
}

interface SpotifyTrackObject {
  name: string;
  artists: { name: string }[];
  album: {
    images: { url: string; height: number; width: number }[];
  };
  external_urls: {
    spotify: string;
  };
}

interface SpotifyPlaylistItem {
  // New API (2026) uses "item", old API uses "track"
  item?: SpotifyTrackObject | null;
  track?: SpotifyTrackObject | null;
}

// ─── Auth helpers ──────────────────────────────────────────────

const SPOTIFY_SCOPES = "playlist-read-private playlist-read-collaborative";

function getCredentials() {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("Missing SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET");
  }
  return { clientId, clientSecret };
}

function basicAuth() {
  const { clientId, clientSecret } = getCredentials();
  return (
    "Basic " + Buffer.from(`${clientId}:${clientSecret}`).toString("base64")
  );
}

export function getSpotifyAuthUrl(redirectUri: string, state: string): string {
  const { clientId } = getCredentials();
  const params = new URLSearchParams({
    response_type: "code",
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
  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: basicAuth(),
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `Spotify token exchange failed (${response.status}): ${text}`
    );
  }

  const data = await response.json();
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
  };
}

/**
 * Use a refresh token to get a new access token.
 * Refresh tokens don't expire unless revoked.
 */
export async function refreshAccessToken(
  refreshToken: string
): Promise<{ accessToken: string; expiresIn: number }> {
  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: basicAuth(),
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `Spotify token refresh failed (${response.status}): ${text}`
    );
  }

  const data = await response.json();
  return {
    accessToken: data.access_token,
    expiresIn: data.expires_in,
  };
}

// ─── URL helpers ───────────────────────────────────────────────

export function extractPlaylistId(input: string): string {
  const uriMatch = input.match(/spotify:playlist:([a-zA-Z0-9]+)/);
  if (uriMatch) return uriMatch[1];

  const urlMatch = input.match(/open\.spotify\.com\/playlist\/([a-zA-Z0-9]+)/);
  if (urlMatch) return urlMatch[1];

  if (/^[a-zA-Z0-9]{22}$/.test(input)) return input;

  throw new Error(
    `Could not extract playlist ID from: "${input}"\n` +
      "Expected a Spotify playlist URL, URI, or 22-character ID."
  );
}

// ─── Playlist fetching ─────────────────────────────────────────

/**
 * Fetch all tracks from a Spotify playlist.
 * Handles the 2026 API format (items at top level) and pagination.
 */
export async function fetchPlaylistTracks(
  playlistInput: string,
  accessToken: string
): Promise<{ name: string; tracks: SpotifyTrack[] }> {
  const playlistId = extractPlaylistId(playlistInput);
  const tracks: SpotifyTrack[] = [];
  const headers = { Authorization: `Bearer ${accessToken}` };

  // Fetch the full playlist object — the new Spotify API (2026) puts items
  // at the top level instead of under tracks.items
  const response = await fetch(
    `https://api.spotify.com/v1/playlists/${playlistId}/items`,
    { headers }
  );

  if (!response.ok) {
    const text = await response.text();
    if (response.status === 401 || response.status === 403) {
      throw new Error("SPOTIFY_AUTH_EXPIRED");
    }
    throw new Error(`Spotify API error (${response.status}): ${text}`);
  }

  const playlist = await response.json();
  const playlistName = playlist.name;

  // Handle both API formats:
  //   New (2026): items[] at top level
  //   Old: tracks.items[] nested under tracks object
  let items: SpotifyPlaylistItem[] = [];
  let nextUrl: string | null = null;

  if (Array.isArray(playlist.items)) {
    items = playlist.items;
    nextUrl = playlist.next ?? null;
  } else if (playlist.tracks?.items) {
    items = playlist.tracks.items;
    nextUrl = playlist.tracks.next ?? null;
  } else {
    console.error("[Spotify] No items found in playlist response");
    return { name: playlistName, tracks: [] };
  }

  for (const item of items) {
    const parsed = parseTrackItem(item);
    if (parsed) tracks.push(parsed);
  }

  // Paginate
  while (nextUrl) {
    const pageResponse: Response = await fetch(nextUrl, { headers });
    if (!pageResponse.ok) break;

    const page = await pageResponse.json();
    for (const item of page.items ?? []) {
      const parsed = parseTrackItem(item);
      if (parsed) tracks.push(parsed);
    }
    nextUrl = page.next ?? null;
  }

  console.log(`[Spotify] Playlist "${playlistName}" — ${tracks.length} tracks`);
  return { name: playlistName, tracks };
}

function parseTrackItem(item: SpotifyPlaylistItem): SpotifyTrack | null {
  // New API uses "item", old API uses "track"
  const trackData = item.item ?? item.track;
  if (!trackData) return null;

  const albumImages = trackData.album?.images ?? [];
  const albumArt =
    albumImages.find((img) => img.height === 300)?.url ??
    albumImages[0]?.url ??
    null;

  return {
    title: trackData.name,
    artist: trackData.artists.map((a) => a.name).join(", "),
    albumArt,
    spotifyUrl: trackData.external_urls.spotify,
  };
}
