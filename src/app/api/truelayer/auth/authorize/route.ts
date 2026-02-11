import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { createClient } from '@/lib/supabase/server';
import { getAuthUrl } from '@/lib/truelayer/client';

/**
 * GET /api/truelayer/auth/authorize
 * Redirects user to TrueLayer Open Banking authorization page
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/login`
    );
  }

  const state = randomUUID();
  const authUrl = getAuthUrl(state);

  const response = NextResponse.redirect(authUrl);
  response.cookies.set('truelayer_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 10, // 10 minutes
    path: '/',
  });

  return response;
}
