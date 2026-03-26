import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { exchangeCodeForToken } from '@/lib/spotify';

/**
 * GET /api/spotify/callback
 *
 * Handles the OAuth callback from Spotify. Exchanges the authorization code
 * for tokens and stores both the access token and refresh token in httpOnly
 * cookies. The refresh token persists so you only need to connect once.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  // Use the same origin as the redirect URI to avoid localhost/127.0.0.1 mismatch
  const redirectUri =
    process.env.SPOTIFY_REDIRECT_URI ||
    'http://127.0.0.1:3000/api/spotify/callback';
  const baseUrl = new URL(redirectUri).origin;

  const cookieStore = await cookies();
  const storedState = cookieStore.get('spotify_oauth_state')?.value;

  // Clean up the state cookie
  cookieStore.delete('spotify_oauth_state');

  if (error) {
    console.error('[Spotify OAuth] Error from Spotify:', error);
    return NextResponse.redirect(new URL('/admin?spotify_error=denied', baseUrl));
  }

  if (!state || state !== storedState) {
    console.error('[Spotify OAuth] State mismatch');
    return NextResponse.redirect(new URL('/admin?spotify_error=state_mismatch', baseUrl));
  }

  if (!code) {
    return NextResponse.redirect(new URL('/admin?spotify_error=no_code', baseUrl));
  }

  try {
    const { accessToken, refreshToken, expiresIn } = await exchangeCodeForToken(
      code,
      redirectUri
    );

    // Store access token (short-lived, 1 hour)
    cookieStore.set('spotify_access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: expiresIn,
      path: '/',
    });

    // Store refresh token (long-lived, persists across sessions)
    cookieStore.set('spotify_refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365, // 1 year
      path: '/',
    });

    console.log('[Spotify OAuth] ✓ Tokens stored, redirecting to admin');
    return NextResponse.redirect(new URL('/admin?spotify_connected=true', baseUrl));
  } catch (err: any) {
    console.error('[Spotify OAuth] Token exchange failed:', err.message);
    return NextResponse.redirect(new URL('/admin?spotify_error=token_exchange', baseUrl));
  }
}
