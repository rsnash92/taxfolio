import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createApiService, refreshToken, needsRefresh } from '@/lib/mtd/api-service';
import { extractFraudHeadersFromRequest, addServerSideFraudHeaders } from '@/lib/mtd/fraud-headers';
import { parseHmrcError } from '@/lib/mtd/errors';
import type { HmrcApiError, OAuthTokens } from '@/types/mtd';

/**
 * GET /api/mtd/businesses
 * List all businesses registered for MTD for the user
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

    // Get user's NINO from their profile
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

    // Get stored tokens (using existing hmrc_tokens table)
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

        // Update stored tokens
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

    // Extract fraud prevention headers
    const clientFraudHeaders = extractFraudHeadersFromRequest(request.headers) || {};
    if (!clientFraudHeaders['Gov-Client-User-IDs']) {
      clientFraudHeaders['Gov-Client-User-IDs'] = `taxfolio=${encodeURIComponent(user.id)}`;
    }
    const fraudHeaders = addServerSideFraudHeaders(request.headers, clientFraudHeaders);

    // Create API service and fetch businesses
    const apiService = createApiService(accessToken, fraudHeaders);

    try {
      const result = await apiService.listBusinesses(userProfile.nino);
      return NextResponse.json(result);
    } catch (apiError) {
      // Handle "no businesses found" gracefully - return empty array
      if ((apiError as HmrcApiError).code === 'NO_BUSINESS_FOUND' ||
          (apiError as HmrcApiError).code === 'MATCHING_RESOURCE_NOT_FOUND') {
        return NextResponse.json({ businesses: [] });
      }
      throw apiError;
    }
  } catch (error) {
    console.error('Businesses fetch error:', error);

    // Handle HMRC API errors
    if ((error as HmrcApiError).code) {
      const parsed = parseHmrcError(error as HmrcApiError);
      return NextResponse.json(
        { error: parsed.message, code: parsed.code, details: parsed.details },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch businesses' },
      { status: 500 }
    );
  }
}
