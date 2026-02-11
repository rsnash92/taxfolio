import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createApiService, refreshToken, needsRefresh } from '@/lib/mtd/api-service';
import { extractFraudHeadersFromRequest, addServerSideFraudHeaders } from '@/lib/mtd/fraud-headers';
import { parseHmrcError } from '@/lib/mtd/errors';
import type { HmrcApiError, OAuthTokens, TaxYear } from '@/types/mtd';

/**
 * GET /api/mtd/calculation/[calculationId]
 * Retrieve a tax calculation result
 * Query params: taxYear
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ calculationId: string }> }
) {
  try {
    const { calculationId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userProfile } = await supabase
      .from('users')
      .select('nino')
      .eq('id', user.id)
      .single();

    if (!userProfile?.nino) {
      return NextResponse.json(
        { error: 'National Insurance number not found' },
        { status: 400 }
      );
    }

    // Get stored tokens
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

    // Check if token needs refresh
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

        await supabase.from('hmrc_tokens').update({
          access_token: newTokens.accessToken,
          refresh_token: newTokens.refreshToken,
          expires_at: new Date(newTokens.expiresAt).toISOString(),
          updated_at: new Date().toISOString(),
        }).eq('user_id', user.id);
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        return NextResponse.json(
          { error: 'Session expired. Please reconnect to HMRC.' },
          { status: 401 }
        );
      }
    }

    const searchParams = request.nextUrl.searchParams;
    const taxYear = searchParams.get('taxYear') as TaxYear;

    if (!taxYear) {
      return NextResponse.json(
        { error: 'taxYear is required' },
        { status: 400 }
      );
    }

    const clientFraudHeaders = extractFraudHeadersFromRequest(request.headers) || {};
    if (!clientFraudHeaders['Gov-Client-User-IDs']) {
      clientFraudHeaders['Gov-Client-User-IDs'] = `taxfolio=${encodeURIComponent(user.id)}`;
    }
    const fraudHeaders = addServerSideFraudHeaders(request.headers, clientFraudHeaders);
    const apiService = createApiService(accessToken, fraudHeaders);

    const calculation = await apiService.getCalculation(
      userProfile.nino,
      taxYear,
      calculationId
    );

    return NextResponse.json(calculation);
  } catch (error) {
    console.error('Calculation retrieval error:', error);

    if ((error as HmrcApiError).code) {
      const parsed = parseHmrcError(error as HmrcApiError);
      return NextResponse.json(
        { error: parsed.message, code: parsed.code, details: parsed.details },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to retrieve calculation' },
      { status: 500 }
    );
  }
}
