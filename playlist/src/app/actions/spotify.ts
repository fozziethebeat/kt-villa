'use server';

import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { checkAccess } from '@/lib/auth-check';
import { revalidatePath } from 'next/cache';
import {
  fetchPlaylistTracks,
  extractPlaylistId,
  refreshAccessToken,
  type SpotifyTrack,
} from '@/lib/spotify';

export interface SpotifyImportResult {
  success: boolean;
  message: string;
  tracks?: SpotifyTrack[];
  playlistName?: string;
  created?: number;
  skipped?: number;
}

/**
 * Check if the user has Spotify credentials (either a valid access token
 * or a refresh token that can be used to get one).
 */
export async function hasSpotifyToken(): Promise<boolean> {
  const cookieStore = await cookies();
  return !!(
    cookieStore.get('spotify_access_token')?.value ||
    cookieStore.get('spotify_refresh_token')?.value
  );
}

/**
 * Get a valid Spotify access token, refreshing if needed.
 * Returns null if no tokens are available (user needs to connect).
 */
async function getValidAccessToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('spotify_access_token')?.value;
  const refreshToken = cookieStore.get('spotify_refresh_token')?.value;

  // If we have an access token, use it
  if (accessToken) return accessToken;

  // If we have a refresh token, get a new access token
  if (refreshToken) {
    try {
      const { accessToken: newToken, expiresIn } =
        await refreshAccessToken(refreshToken);

      // Store the new access token
      cookieStore.set('spotify_access_token', newToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: expiresIn,
        path: '/',
      });

      return newToken;
    } catch (error) {
      console.error('[Spotify] Token refresh failed:', error);
      // Refresh token is invalid — clear it so user sees "Connect" prompt
      cookieStore.delete('spotify_refresh_token');
      return null;
    }
  }

  return null;
}

/**
 * Preview tracks from a Spotify playlist without importing.
 */
export async function previewSpotifyPlaylist(
  playlistUrl: string
): Promise<SpotifyImportResult> {
  await checkAccess('admin', '/');

  const accessToken = await getValidAccessToken();
  if (!accessToken) {
    return { success: false, message: 'SPOTIFY_NOT_CONNECTED' };
  }

  try {
    extractPlaylistId(playlistUrl);
  } catch {
    return {
      success: false,
      message: 'Invalid Spotify playlist URL. Please paste a valid Spotify playlist link.',
    };
  }

  try {
    const { name, tracks } = await fetchPlaylistTracks(playlistUrl, accessToken);

    return {
      success: true,
      message: `Found ${tracks.length} tracks in "${name}"`,
      tracks,
      playlistName: name,
    };
  } catch (error: any) {
    if (error.message === 'SPOTIFY_AUTH_EXPIRED') {
      // Access token expired mid-request, try refresh
      const cookieStore = await cookies();
      const refreshToken = cookieStore.get('spotify_refresh_token')?.value;
      if (refreshToken) {
        try {
          const { accessToken: newToken, expiresIn } =
            await refreshAccessToken(refreshToken);
          cookieStore.set('spotify_access_token', newToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: expiresIn,
            path: '/',
          });
          // Retry with new token
          const { name, tracks } = await fetchPlaylistTracks(playlistUrl, newToken);
          return {
            success: true,
            message: `Found ${tracks.length} tracks in "${name}"`,
            tracks,
            playlistName: name,
          };
        } catch {
          // Refresh failed too
        }
      }
      return { success: false, message: 'SPOTIFY_NOT_CONNECTED' };
    }
    console.error('[Spotify Import] Preview failed:', error);
    return { success: false, message: `Failed to fetch playlist: ${error.message}` };
  }
}

/**
 * Import tracks from a Spotify playlist into the database.
 */
export async function importSpotifyPlaylist(
  playlistUrl: string
): Promise<SpotifyImportResult> {
  await checkAccess('admin', '/');

  const accessToken = await getValidAccessToken();
  if (!accessToken) {
    return { success: false, message: 'SPOTIFY_NOT_CONNECTED' };
  }

  try {
    const { name, tracks } = await fetchPlaylistTracks(playlistUrl, accessToken);

    if (tracks.length === 0) {
      return { success: false, message: 'No tracks found in this playlist.' };
    }

    const maxOrder = await prisma.song.aggregate({
      _max: { sortOrder: true },
    });
    let nextOrder = (maxOrder._max.sortOrder ?? -1) + 1;

    let created = 0;
    let skipped = 0;

    for (const track of tracks) {
      const existing = await prisma.song.findFirst({
        where: { title: track.title, artist: track.artist },
      });

      if (existing) {
        skipped++;
        continue;
      }

      await prisma.song.create({
        data: {
          title: track.title,
          artist: track.artist,
          albumArt: track.albumArt,
          spotifyUrl: track.spotifyUrl,
          sortOrder: nextOrder++,
        },
      });
      created++;
    }

    revalidatePath('/admin');
    revalidatePath('/');

    return {
      success: true,
      message: `Imported ${created} songs from "${name}"${skipped > 0 ? ` (${skipped} duplicates skipped)` : ''}`,
      created,
      skipped,
      playlistName: name,
    };
  } catch (error: any) {
    if (error.message === 'SPOTIFY_AUTH_EXPIRED') {
      return { success: false, message: 'SPOTIFY_NOT_CONNECTED' };
    }
    console.error('[Spotify Import] Failed:', error);
    return { success: false, message: `Import failed: ${error.message}` };
  }
}
