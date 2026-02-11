import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createApiService, refreshToken, needsRefresh } from '@/lib/mtd/api-service';
import { extractFraudHeadersFromRequest } from '@/lib/mtd/fraud-headers';
import { parseHmrcError } from '@/lib/mtd/errors';
import type { HmrcApiError, OAuthTokens } from '@/types/mtd';

/**
 * GET /api/mtd/accounts/balance
 * Fetch SA balance and transactions from HMRC
 * Query params: fromDate, toDate, onlyOpenItems, includeEstimatedCharges
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
    const fromDate = searchParams.get('fromDate') || undefined;
    const toDate = searchParams.get('toDate') || undefined;
    const onlyOpenItems = searchParams.get('onlyOpenItems') === 'true';
    const includeEstimatedCharges = searchParams.get('includeEstimatedCharges') === 'true';

    const fraudHeaders = extractFraudHeadersFromRequest(request.headers);
    const apiService = createApiService(accessToken, fraudHeaders);

    try {
      const result = await apiService.getBalanceAndTransactions(userProfile.nino, {
        fromDate,
        toDate,
        onlyOpenItems: onlyOpenItems || undefined,
        includeEstimatedCharges: includeEstimatedCharges || undefined,
      });
      return NextResponse.json(result);
    } catch (apiError) {
      if ((apiError as HmrcApiError).code === 'MATCHING_RESOURCE_NOT_FOUND') {
        return NextResponse.json({
          balanceDetails: {
            payableAmount: 0,
            pendingChargeDueAmount: 0,
            overdueAmount: 0,
            totalBalance: 0,
            totalCredit: 0,
            availableCredit: 0,
            allocatedCredit: 0,
            unallocatedCredit: 0,
          },
          documentDetails: [],
        });
      }
      throw apiError;
    }
  } catch (error) {
    console.error('SA Accounts balance fetch error:', error);
    if ((error as HmrcApiError).code) {
      const parsed = parseHmrcError(error as HmrcApiError);
      return NextResponse.json(
        { error: parsed.message, code: parsed.code, details: parsed.details },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to fetch account balance' },
      { status: 500 }
    );
  }
}
