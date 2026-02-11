import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { refreshToken, needsRefresh } from '@/lib/mtd/api-service';
import { extractFraudHeadersFromRequest } from '@/lib/mtd/fraud-headers';
import type { OAuthTokens } from '@/types/mtd';

const HMRC_API_BASE_URL =
  process.env.HMRC_API_BASE_URL || 'https://test-api.service.hmrc.gov.uk';

/**
 * GET /api/mtd/test-fraud-headers
 * Validates fraud prevention headers against HMRC's Test Fraud Prevention Headers API.
 *
 * The client must send Gov-Client-* and Gov-Vendor-* headers on the request.
 * This route forwards them to HMRC's validation endpoint and returns the result.
 *
 * HMRC docs: https://developer.service.hmrc.gov.uk/api-documentation/docs/api/service/txm-fph-validator-api
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

    // Get stored HMRC tokens
    const { data: tokenData, error: tokenError } = await supabase
      .from('hmrc_tokens')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (tokenError || !tokenData) {
      return NextResponse.json(
        { error: 'Not connected to HMRC. Please authorize first.' },
        { status: 401 }
      );
    }

    // Refresh token if needed
    let accessToken = tokenData.access_token;
    const tokens: OAuthTokens = {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresAt: new Date(tokenData.expires_at).getTime(),
      expiresIn: 0,
      tokenType: tokenData.token_type,
      scope: tokenData.scope,
    };

    if (needsRefresh(tokens)) {
      try {
        const newTokens = await refreshToken(tokens.refreshToken);
        accessToken = newTokens.accessToken;

        await supabase
          .from('hmrc_tokens')
          .update({
            access_token: newTokens.accessToken,
            refresh_token: newTokens.refreshToken,
            expires_at: new Date(newTokens.expiresAt).toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id);
      } catch {
        return NextResponse.json(
          { error: 'Session expired. Please reconnect to HMRC.' },
          { status: 401 }
        );
      }
    }

    // Extract fraud prevention headers from the incoming request
    const fraudHeaders = extractFraudHeadersFromRequest(request.headers);

    if (!fraudHeaders) {
      return NextResponse.json(
        {
          error: 'No fraud prevention headers found on request. ' +
            'The client must send Gov-Client-* and Gov-Vendor-* headers.',
        },
        { status: 400 }
      );
    }

    // Call HMRC's Test Fraud Prevention Headers validation endpoint
    const validationUrl = `${HMRC_API_BASE_URL}/test/fraud-prevention-headers/validate`;

    const hmrcResponse = await fetch(validationUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.hmrc.1.0+json',
        ...fraudHeaders,
      },
    });

    const result = await hmrcResponse.json();

    return NextResponse.json({
      status: hmrcResponse.status,
      ok: hmrcResponse.ok,
      validation: result,
      headersSent: Object.keys(fraudHeaders),
    });
  } catch (error) {
    console.error('Fraud header validation error:', error);
    return NextResponse.json(
      { error: 'Failed to validate fraud prevention headers' },
      { status: 500 }
    );
  }
}
