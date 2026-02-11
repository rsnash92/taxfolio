import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createApiService, refreshToken, needsRefresh } from '@/lib/mtd/api-service';
import { extractFraudHeadersFromRequest } from '@/lib/mtd/fraud-headers';
import { parseHmrcError } from '@/lib/mtd/errors';
import type { HmrcApiError, OAuthTokens, TaxYear } from '@/types/mtd';

/**
 * GET /api/mtd/itsa-status
 * Fetch ITSA status for the current user
 * Query params: taxYear (required), futureYears, history
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

    const { data: userProfile } = await supabase
      .from('users')
      .select('nino')
      .eq('id', user.id)
      .single();

    if (!userProfile?.nino) {
      return NextResponse.json(
        { error: 'National Insurance number not found. Please update your profile.' },
        { status: 400 }
      );
    }

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
      } catch {
        return NextResponse.json(
          { error: 'Session expired. Please reconnect to HMRC.' },
          { status: 401 }
        );
      }
    }

    const searchParams = request.nextUrl.searchParams;
    const taxYear = searchParams.get('taxYear') as TaxYear;
    const futureYears = searchParams.get('futureYears') === 'true';
    const history = searchParams.get('history') === 'true';

    if (!taxYear) {
      return NextResponse.json(
        { error: 'taxYear query parameter is required (e.g. 2025-26)' },
        { status: 400 }
      );
    }

    const fraudHeaders = extractFraudHeadersFromRequest(request.headers);
    const apiService = createApiService(accessToken, fraudHeaders);

    try {
      const result = await apiService.getItsaStatus(userProfile.nino, taxYear, {
        futureYears: futureYears || undefined,
        history: history || undefined,
      });
      return NextResponse.json(result);
    } catch (apiError) {
      const code = (apiError as HmrcApiError).code;
      if (code === 'MATCHING_RESOURCE_NOT_FOUND' || code === 'NOT_FOUND') {
        return NextResponse.json({
          itsaStatuses: [{
            taxYear,
            itsaStatusDetails: [{
              submittedOn: '',
              status: 'No Status',
              statusReason: 'No ITSA status found for this tax year',
            }],
          }],
        });
      }
      throw apiError;
    }
  } catch (error) {
    const hmrcError = error as HmrcApiError;
    console.error('ITSA status fetch error:', JSON.stringify({ code: hmrcError.code, message: hmrcError.message, errors: hmrcError.errors }, null, 2));
    if (hmrcError.code) {
      const parsed = parseHmrcError(hmrcError);
      return NextResponse.json(
        { error: parsed.message, code: parsed.code, hmrcCode: hmrcError.code, details: parsed.details },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch ITSA status' },
      { status: 500 }
    );
  }
}
