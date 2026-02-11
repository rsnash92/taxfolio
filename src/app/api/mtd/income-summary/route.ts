import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createApiService, refreshToken, needsRefresh } from '@/lib/mtd/api-service';
import { extractFraudHeadersFromRequest } from '@/lib/mtd/fraud-headers';
import { parseHmrcError } from '@/lib/mtd/errors';
import type { HmrcApiError, OAuthTokens, TaxYear } from '@/types/mtd';

/**
 * GET /api/mtd/income-summary
 * Fetch business income source summary from HMRC
 * Query params: taxYear (required), typeOfBusiness (required), businessId (required)
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
    const typeOfBusiness = searchParams.get('typeOfBusiness') as 'self-employment' | 'uk-property' | 'foreign-property';
    const businessId = searchParams.get('businessId');

    if (!taxYear || !typeOfBusiness || !businessId) {
      return NextResponse.json(
        { error: 'taxYear, typeOfBusiness, and businessId query parameters are required' },
        { status: 400 }
      );
    }

    const fraudHeaders = extractFraudHeadersFromRequest(request.headers);
    const apiService = createApiService(accessToken, fraudHeaders);

    try {
      const result = await apiService.getBusinessIncomeSummary(
        userProfile.nino,
        typeOfBusiness,
        taxYear,
        businessId
      );
      return NextResponse.json(result);
    } catch (apiError) {
      if ((apiError as HmrcApiError).code === 'MATCHING_RESOURCE_NOT_FOUND' ||
          (apiError as HmrcApiError).code === 'RULE_NO_INCOME_SUBMISSIONS_EXIST') {
        return NextResponse.json({
          total: { income: 0, expenses: 0 },
          profit: { net: 0, taxable: 0 },
          loss: { net: 0, taxable: 0 },
        });
      }
      throw apiError;
    }
  } catch (error) {
    console.error('Income summary fetch error:', error);
    if ((error as HmrcApiError).code) {
      const parsed = parseHmrcError(error as HmrcApiError);
      return NextResponse.json(
        { error: parsed.message, code: parsed.code, details: parsed.details },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to fetch income summary' },
      { status: 500 }
    );
  }
}
