import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { exchangeCode } from '@/lib/mtd/api-service';

const REDIRECT_URI =
  process.env.NEXT_PUBLIC_APP_URL + '/api/mtd/auth/callback';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// Use service role client - the callback is a redirect from HMRC so the user's
// session cookies may not be available, and RLS would block the operations
function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * GET /api/mtd/auth/callback
 * Handles OAuth callback from HMRC
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  // Handle OAuth errors
  if (error) {
    console.error('HMRC OAuth error:', error, errorDescription);
    return NextResponse.redirect(
      `${APP_URL}/mtd?error=${encodeURIComponent(errorDescription || error)}`
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      `${APP_URL}/mtd?error=${encodeURIComponent('Missing authorization code or state')}`
    );
  }

  try {
    // Decode and validate state
    const stateData = JSON.parse(Buffer.from(state, 'base64').toString('utf-8'));
    const { userId, nonce, timestamp } = stateData;

    // Check state hasn't expired (10 minutes)
    if (Date.now() - timestamp > 10 * 60 * 1000) {
      return NextResponse.redirect(
        `${APP_URL}/mtd?error=${encodeURIComponent('Authorization session expired')}`
      );
    }

    const supabase = createServiceClient();

    // Verify state nonce in database
    const { data: authState, error: stateError } = await supabase
      .from('mtd_auth_states')
      .select('*')
      .eq('user_id', userId)
      .eq('state_nonce', nonce)
      .single();

    if (stateError || !authState) {
      console.error('[MTD Callback] State verification failed:', stateError);
      return NextResponse.redirect(
        `${APP_URL}/mtd?error=${encodeURIComponent('Invalid authorization state')}`
      );
    }

    // Delete the used state
    await supabase
      .from('mtd_auth_states')
      .delete()
      .eq('user_id', userId)
      .eq('state_nonce', nonce);

    // Exchange code for tokens
    console.log('[MTD Callback] Exchanging code for tokens, userId:', userId);
    const tokens = await exchangeCode(code, REDIRECT_URI);
    console.log('[MTD Callback] Got tokens, scope:', tokens.scope, 'expiresAt:', tokens.expiresAt);

    // Store tokens securely in database (using service role to bypass RLS)
    const { error: upsertError } = await supabase.from('hmrc_tokens').upsert(
      {
        user_id: userId,
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
        expires_at: new Date(tokens.expiresAt).toISOString(),
        token_type: tokens.tokenType,
        scope: tokens.scope,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'user_id',
      }
    );

    if (upsertError) {
      console.error('[MTD Callback] Failed to store tokens:', upsertError);
      return NextResponse.redirect(
        `${APP_URL}/mtd?error=${encodeURIComponent('Failed to save HMRC connection: ' + upsertError.message)}`
      );
    }

    console.log('[MTD Callback] Tokens stored successfully for user:', userId);

    // Determine redirect based on onboarding context
    const onboardingContext = request.cookies.get('onboarding-context')?.value;
    let redirectUrl: string;
    if (onboardingContext === 'hmrc') {
      redirectUrl = `${APP_URL}/onboarding?hmrc_connected=true`;
    } else {
      redirectUrl = `${APP_URL}/mtd?connected=true`;
    }

    const response = NextResponse.redirect(redirectUrl);
    if (onboardingContext) {
      response.cookies.delete('onboarding-context');
    }
    return response;
  } catch (error) {
    console.error('MTD callback error:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to complete authorization';
    return NextResponse.redirect(
      `${APP_URL}/mtd?error=${encodeURIComponent(errorMessage)}`
    );
  }
}
