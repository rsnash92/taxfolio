import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { exchangeCode, getAccounts } from '@/lib/truelayer/client';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

/**
 * GET /api/truelayer/auth/callback
 * Handles OAuth callback from TrueLayer
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  // Handle errors from TrueLayer
  if (error) {
    console.error('[TrueLayer Callback] OAuth error:', error);
    return NextResponse.redirect(
      `${APP_URL}/mtd/quarterly?bank_error=auth_failed`
    );
  }

  // Verify state
  const storedState = request.cookies.get('truelayer_oauth_state')?.value;
  if (!state || state !== storedState) {
    console.error('[TrueLayer Callback] State mismatch');
    return NextResponse.redirect(
      `${APP_URL}/mtd/quarterly?bank_error=invalid_state`
    );
  }

  if (!code) {
    return NextResponse.redirect(
      `${APP_URL}/mtd/quarterly?bank_error=no_code`
    );
  }

  // Verify user is authenticated
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(`${APP_URL}/login`);
  }

  try {
    // Exchange code for tokens
    const tokens = await exchangeCode(code);

    if (tokens.error) {
      console.error('[TrueLayer Callback] Token exchange error:', tokens);
      return NextResponse.redirect(
        `${APP_URL}/mtd/quarterly?bank_error=token_failed`
      );
    }

    // Fetch accounts
    const accountsRes = await getAccounts(tokens.access_token);
    const accounts = accountsRes.results || [];

    // Persist bank connection to Supabase
    const bankName = accounts[0]?.provider?.display_name || 'Connected Bank';
    const tokenBlob = JSON.stringify({
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: Date.now() + (tokens.expires_in || 3600) * 1000,
    });

    const { data: bankConn, error: bankError } = await supabase
      .from('bank_connections')
      .upsert(
        {
          user_id: user.id,
          provider_item_id: `truelayer-${user.id}`,
          access_token_blob: tokenBlob,
          institution_name: bankName,
          institution_id: 'truelayer',
          status: 'active',
          last_synced_at: new Date().toISOString(),
        },
        { onConflict: 'provider_item_id' },
      )
      .select('id')
      .single();

    if (bankError) {
      console.error('[TrueLayer Callback] Bank connection upsert error:', bankError);
    }

    // Persist accounts to Supabase
    if (bankConn) {
      for (const a of accounts) {
        const { error: acctError } = await supabase.from('accounts').upsert(
          {
            user_id: user.id,
            bank_connection_id: bankConn.id,
            external_account_id: a.account_id,
            name: a.display_name || 'Account',
            type: a.account_type || 'TRANSACTION',
            is_business_account: false,
          },
          { onConflict: 'external_account_id' },
        );
        if (acctError) {
          console.error('[TrueLayer Callback] Account upsert error:', acctError);
        }
      }
    }

    // Determine redirect based on context cookie
    const wizardContext = request.cookies.get('mtd-wizard-context')?.value;
    const onboardingContext = request.cookies.get('onboarding-context')?.value;
    let redirectUrl: string;
    if (onboardingContext === 'bank') {
      redirectUrl = `${APP_URL}/onboarding?bank_connected=true`;
    } else if (wizardContext) {
      redirectUrl = `${APP_URL}/mtd/quarterly?bank_connected=true`;
    } else {
      redirectUrl = `${APP_URL}/dashboard?bank_connected=true`;
    }

    // Clear state and context cookies, then redirect
    const response = NextResponse.redirect(redirectUrl);
    response.cookies.delete('truelayer_oauth_state');
    if (onboardingContext) {
      response.cookies.delete('onboarding-context');
    }

    // Store bank connection data in cookie
    response.cookies.set(
      'bank_connection',
      JSON.stringify({
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: Date.now() + (tokens.expires_in || 3600) * 1000,
        accounts: accounts.map(
          (a: {
            account_id: string;
            display_name?: string;
            account_type?: string;
            provider?: { display_name?: string };
          }) => ({
            account_id: a.account_id,
            display_name: a.display_name || 'Account',
            account_type: a.account_type || 'TRANSACTION',
            provider_name: a.provider?.display_name || 'Bank',
          })
        ),
        bankName: accounts[0]?.provider?.display_name || 'Connected Bank',
      }),
      {
        httpOnly: false, // Allow client to read for transaction import
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60, // 1 hour
        path: '/',
      }
    );

    return response;
  } catch (err) {
    console.error('[TrueLayer Callback] Error:', err);
    return NextResponse.redirect(
      `${APP_URL}/mtd/quarterly?bank_error=connection_failed`
    );
  }
}
