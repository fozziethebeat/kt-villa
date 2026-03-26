import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { exchangeCodeForToken } from '@/lib/spotify';

/**
 * GET /api/spotify/callback
 *
 * Handles the OAuth callback from Spotify. Exchanges the authorization code
 * for an access token and stores it in an httpOnly cookie, then redirects
 * back to the admin page.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  const cookieStore = await cookies();
  const storedState = cookieStore.get('spotify_oauth_state')?.value;

  // Clean up the state cookie
  cookieStore.delete('spotify_oauth_state');

  // Handle errors from Spotify (e.g. user denied access)
  if (error) {
    console.error('[Spotify OAuth] Error from Spotify:', error);
    return NextResponse.redirect(
      new URL('/admin?spotify_error=denied', req.url)
    );
  }

  // Validate state to prevent CSRF
  if (!state || state !== storedState) {
    console.error('[Spotify OAuth] State mismatch');
    return NextResponse.redirect(
      new URL('/admin?spotify_error=state_mismatch', req.url)
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL('/admin?spotify_error=no_code', req.url)
    );
  }

  try {
    const redirectUri =
      process.env.SPOTIFY_REDIRECT_URI ||
      'http://127.0.0.1:3000/api/spotify/callback';

    const { accessToken, expiresIn } = await exchangeCodeForToken(
      code,
      redirectUri
    );

    // Store the access token in an httpOnly cookie
    cookieStore.set('spotify_access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: expiresIn, // Usually 3600 seconds (1 hour)
      path: '/',
    });

    console.log('[Spotify OAuth] ✓ Token stored, redirecting to admin');
    return NextResponse.redirect(
      new URL('/admin?spotify_connected=true', req.url)
    );
  } catch (err: any) {
    console.error('[Spotify OAuth] Token exchange failed:', err.message);
    return NextResponse.redirect(
      new URL('/admin?spotify_error=token_exchange', req.url)
    );
  }
}
