import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSpotifyAuthUrl } from '@/lib/spotify';
import { checkAccess } from '@/lib/auth-check';

/**
 * GET /api/spotify/authorize
 *
 * Redirects the admin to Spotify's OAuth consent page.
 * After authorization, Spotify redirects back to /api/spotify/callback.
 */
export async function GET(req: NextRequest) {
  await checkAccess('admin', '/');

  const redirectUri =
    process.env.SPOTIFY_REDIRECT_URI ||
    'http://127.0.0.1:3000/api/spotify/callback';

  // Generate a random state for CSRF protection
  const state = crypto.randomUUID();
  const cookieStore = await cookies();
  cookieStore.set('spotify_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 300, // 5 minutes
    path: '/',
  });

  const authUrl = getSpotifyAuthUrl(redirectUri, state);
  return NextResponse.redirect(authUrl);
}
