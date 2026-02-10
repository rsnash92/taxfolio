import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createApiService, refreshToken, needsRefresh } from '@/lib/mtd/api-service';
import { extractFraudHeadersFromRequest } from '@/lib/mtd/fraud-headers';
import { parseHmrcError } from '@/lib/mtd/errors';
import type { HmrcApiError, OAuthTokens, UkPropertyPeriodData, PeriodDates, TaxYear } from '@/types/mtd';

/**
 * Helper to get authenticated API service
 */
async function getAuthenticatedService(supabase: Awaited<ReturnType<typeof createClient>>, userId: string, request: NextRequest) {
  const { data: tokenData, error: tokenError } = await supabase
    .from('hmrc_tokens')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (tokenError || !tokenData) {
    throw new Error('Not connected to HMRC');
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
    const newTokens = await refreshToken(tokens.refreshToken);
    accessToken = newTokens.accessToken;

    await supabase.from('hmrc_tokens').update({
      access_token: newTokens.accessToken,
      refresh_token: newTokens.refreshToken,
      expires_at: new Date(newTokens.expiresAt).toISOString(),
      updated_at: new Date().toISOString(),
    }).eq('user_id', userId);
  }

  const fraudHeaders = extractFraudHeadersFromRequest(request.headers);
  return createApiService(accessToken, fraudHeaders);
}

/**
 * POST /api/mtd/property/period
 * Create UK property period summary (TY before 2025-26)
 * Body: { businessId, taxYear, periodDates, data }
 */
export async function POST(request: NextRequest) {
  try {
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

    const body = await request.json();
    const { businessId, taxYear, periodDates, data } = body as {
      businessId: string;
      taxYear: TaxYear;
      periodDates: PeriodDates;
      data: UkPropertyPeriodData;
    };

    if (!businessId || !taxYear || !periodDates || !data) {
      return NextResponse.json(
        { error: 'businessId, taxYear, periodDates, and data are required' },
        { status: 400 }
      );
    }

    // Validate: cannot have both consolidated and itemised expenses
    if (data.expenses?.consolidatedExpenses !== undefined) {
      const hasItemised = Object.keys(data.expenses).some(
        (k) => k !== 'consolidatedExpenses' && data.expenses![k as keyof typeof data.expenses] !== undefined
      );
      if (hasItemised) {
        return NextResponse.json(
          { error: 'Cannot submit both consolidated and itemised expenses' },
          { status: 400 }
        );
      }
    }

    const apiService = await getAuthenticatedService(supabase, user.id, request);
    const result = await apiService.createUkPropertyPeriodSummary(
      userProfile.nino,
      businessId,
      taxYear,
      periodDates,
      data
    );

    // Store submission record
    await supabase.from('mtd_submissions').insert({
      user_id: user.id,
      business_id: businessId,
      business_type: 'uk-property',
      tax_year: taxYear,
      submission_type: 'period',
      submission_id: result.submissionId,
      period_start: periodDates.periodStartDate,
      period_end: periodDates.periodEndDate,
      data: data,
      submitted_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      submissionId: result.submissionId,
      submittedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Property period POST error:', error);

    if ((error as HmrcApiError).code) {
      const parsed = parseHmrcError(error as HmrcApiError);
      return NextResponse.json(
        { error: parsed.message, code: parsed.code, details: parsed.details },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to submit data' },
      { status: 500 }
    );
  }
}
