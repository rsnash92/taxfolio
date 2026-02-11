import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthUrl } from '@/lib/mtd/api-service';

const REDIRECT_URI =
  process.env.NEXT_PUBLIC_APP_URL + '/api/mtd/auth/callback';

/**
 * GET /api/mtd/auth/authorize
 * Redirects user to HMRC OAuth authorization page
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Generate a state token to prevent CSRF attacks
    // Include user ID and a random nonce
    const nonce = crypto.randomUUID();
    const state = Buffer.from(
      JSON.stringify({
        userId: user.id,
        nonce,
        timestamp: Date.now(),
      })
    ).toString('base64');

    // Store the state in the database for verification
    const { error: stateError } = await supabase.from('mtd_auth_states').upsert({
      user_id: user.id,
      state_nonce: nonce,
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 min expiry
    });

    if (stateError) {
      console.error('[MTD Auth] Failed to store auth state:', stateError);
      return NextResponse.json(
        { error: 'Failed to initiate authorization: ' + stateError.message },
        { status: 500 }
      );
    }

    // Build the HMRC authorization URL
    const authUrl = getAuthUrl(REDIRECT_URI, state);

    // Redirect to HMRC
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('MTD auth error:', error);
    return NextResponse.json(
      { error: 'Failed to initiate authorization' },
      { status: 500 }
    );
  }
}
