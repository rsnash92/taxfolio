import type {
  HmrcObligationsResponse,
  MtdBusiness,
  OAuthTokens,
  SelfEmploymentPeriodData,
  UkPropertyPeriodData,
  PeriodDates,
  TaxCalculationResult,
  HmrcApiError,
  FraudPreventionHeaders,
  TaxYear,
} from '@/types/mtd';
import { httpStatusToErrorCode, getErrorMessage } from './errors';
import { getApiVersion, usesCumulativePeriodSummaries } from './quarters';

// Environment configuration
const HMRC_CLIENT_ID = process.env.HMRC_CLIENT_ID!;
const HMRC_CLIENT_SECRET = process.env.HMRC_CLIENT_SECRET!;
const HMRC_API_BASE_URL =
  process.env.HMRC_API_BASE_URL || 'https://test-api.service.hmrc.gov.uk';
const HMRC_AUTH_URL =
  process.env.HMRC_AUTH_URL || 'https://test-api.service.hmrc.gov.uk/oauth/authorize';
const HMRC_TOKEN_URL =
  process.env.HMRC_TOKEN_URL || 'https://test-api.service.hmrc.gov.uk/oauth/token';
const HMRC_ENVIRONMENT = process.env.HMRC_ENVIRONMENT || 'sandbox';

// API versions
const OBLIGATIONS_API_VERSION = '3.0';
const BUSINESS_DETAILS_API_VERSION = '2.0';
const CALCULATIONS_API_VERSION = '5.0';

/**
 * MTD API Service - handles all communication with HMRC MTD APIs
 */
export class MtdApiService {
  private accessToken: string;
  private fraudHeaders?: FraudPreventionHeaders;

  constructor(accessToken: string, fraudHeaders?: FraudPreventionHeaders) {
    this.accessToken = accessToken;
    this.fraudHeaders = fraudHeaders;
  }

  /**
   * Build headers for HMRC API requests
   */
  private buildHeaders(apiVersion: string, testScenario?: string): HeadersInit {
    const headers: HeadersInit = {
      Authorization: `Bearer ${this.accessToken}`,
      Accept: `application/vnd.hmrc.${apiVersion}+json`,
      'Content-Type': 'application/json',
    };

    // Add sandbox test scenario header in sandbox mode
    if (HMRC_ENVIRONMENT === 'sandbox' && testScenario) {
      headers['Gov-Test-Scenario'] = testScenario;
    }

    // Add fraud prevention headers if available (required for production)
    if (this.fraudHeaders) {
      Object.assign(headers, this.fraudHeaders);
    }

    return headers;
  }

  /**
   * Make an API request to HMRC
   */
  private async request<T>(
    method: string,
    path: string,
    apiVersion: string,
    body?: object,
    testScenario?: string
  ): Promise<T> {
    const url = `${HMRC_API_BASE_URL}${path}`;
    const headers = this.buildHeaders(apiVersion, testScenario);

    const options: RequestInit = {
      method,
      headers,
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);

    // Handle non-JSON responses
    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      if (!response.ok) {
        const errorCode = httpStatusToErrorCode(response.status);
        throw {
          code: errorCode,
          message: getErrorMessage(errorCode),
        } as HmrcApiError;
      }
      return {} as T;
    }

    const data = await response.json();

    if (!response.ok) {
      throw data as HmrcApiError;
    }

    return data as T;
  }

  // ============ OBLIGATIONS ============

  /**
   * Get filing obligations for a taxpayer
   * Uses the Obligations API v3.0 endpoint
   * This is the entry point - drives the whole UI
   */
  async getObligations(
    nino: string,
    params?: { taxYear?: string; status?: 'Open' | 'Fulfilled' }
  ): Promise<HmrcObligationsResponse> {
    // Use the v3.0 Obligations API endpoint
    let path = `/obligations/details/${nino}/income-and-expenditure`;

    const queryParams = new URLSearchParams();

    // v3.0 API uses fromDate/toDate instead of taxYear
    if (params?.taxYear) {
      // Convert tax year (e.g., "2025-26") to date range
      const [startYear] = params.taxYear.split('-').map(Number);
      queryParams.append('fromDate', `${startYear}-04-06`);
      queryParams.append('toDate', `${startYear + 1}-04-05`);
    }

    if (params?.status) {
      // v3.0 uses lowercase status values
      queryParams.append('status', params.status.toLowerCase());
    }

    if (queryParams.toString()) {
      path += `?${queryParams.toString()}`;
    }

    // Use OPEN scenario in sandbox to get test obligations
    const testScenario = HMRC_ENVIRONMENT === 'sandbox' ? 'OPEN' : undefined;

    return this.request<HmrcObligationsResponse>(
      'GET',
      path,
      OBLIGATIONS_API_VERSION,
      undefined,
      testScenario
    );
  }

  // ============ BUSINESSES ============

  /**
   * List all businesses for a taxpayer
   */
  async listBusinesses(nino: string): Promise<{ businesses: MtdBusiness[] }> {
    // Use STATEFUL in sandbox to get businesses created via test-support API
    const testScenario = HMRC_ENVIRONMENT === 'sandbox' ? 'STATEFUL' : undefined;
    return this.request<{ businesses: MtdBusiness[] }>(
      'GET',
      `/individuals/business/details/${nino}/list`,
      BUSINESS_DETAILS_API_VERSION,
      undefined,
      testScenario
    );
  }

  /**
   * Get details for a specific business
   */
  async getBusinessDetails(
    nino: string,
    businessId: string
  ): Promise<MtdBusiness> {
    const testScenario = HMRC_ENVIRONMENT === 'sandbox' ? 'STATEFUL' : undefined;
    return this.request<MtdBusiness>(
      'GET',
      `/individuals/business/details/${nino}/${businessId}`,
      BUSINESS_DETAILS_API_VERSION,
      undefined,
      testScenario
    );
  }

  // ============ SELF-EMPLOYMENT SUBMISSIONS ============

  /**
   * Create or amend self-employment cumulative period summary (TY 2025-26 onwards)
   */
  async createAmendSelfEmploymentCumulative(
    nino: string,
    businessId: string,
    taxYear: TaxYear,
    data: SelfEmploymentPeriodData
  ): Promise<void> {
    const apiVersion = getApiVersion(taxYear, 'self-employment');
    const testScenario = HMRC_ENVIRONMENT === 'sandbox' ? 'STATEFUL' : undefined;
    await this.request<void>(
      'PUT',
      `/individuals/business/self-employment/${nino}/${businessId}/cumulative/${taxYear}`,
      apiVersion,
      data,
      testScenario
    );
  }

  /**
   * Retrieve self-employment cumulative period summary (TY 2025-26 onwards)
   */
  async retrieveSelfEmploymentCumulative(
    nino: string,
    businessId: string,
    taxYear: TaxYear
  ): Promise<SelfEmploymentPeriodData> {
    const apiVersion = getApiVersion(taxYear, 'self-employment');
    const testScenario = HMRC_ENVIRONMENT === 'sandbox' ? 'STATEFUL' : undefined;
    return this.request<SelfEmploymentPeriodData>(
      'GET',
      `/individuals/business/self-employment/${nino}/${businessId}/cumulative/${taxYear}`,
      apiVersion,
      undefined,
      testScenario
    );
  }

  /**
   * Create self-employment period summary (TY before 2025-26)
   */
  async createSelfEmploymentPeriodSummary(
    nino: string,
    businessId: string,
    taxYear: TaxYear,
    periodDates: PeriodDates,
    data: SelfEmploymentPeriodData
  ): Promise<{ periodId: string }> {
    const apiVersion = getApiVersion(taxYear, 'self-employment');
    const testScenario = HMRC_ENVIRONMENT === 'sandbox' ? 'STATEFUL' : undefined;
    return this.request<{ periodId: string }>(
      'POST',
      `/individuals/business/self-employment/${nino}/${businessId}/period/${taxYear}`,
      apiVersion,
      {
        periodFromDate: periodDates.periodStartDate,
        periodToDate: periodDates.periodEndDate,
        ...data,
      },
      testScenario
    );
  }

  /**
   * Amend self-employment period summary (TY before 2025-26)
   */
  async amendSelfEmploymentPeriodSummary(
    nino: string,
    businessId: string,
    taxYear: TaxYear,
    periodId: string,
    data: SelfEmploymentPeriodData
  ): Promise<void> {
    const apiVersion = getApiVersion(taxYear, 'self-employment');
    const testScenario = HMRC_ENVIRONMENT === 'sandbox' ? 'STATEFUL' : undefined;
    await this.request<void>(
      'PUT',
      `/individuals/business/self-employment/${nino}/${businessId}/period/${taxYear}/${periodId}`,
      apiVersion,
      data,
      testScenario
    );
  }

  /**
   * List self-employment period summaries (TY before 2025-26)
   */
  async listSelfEmploymentPeriodSummaries(
    nino: string,
    businessId: string,
    taxYear: TaxYear
  ): Promise<{ periods: Array<{ periodId: string } & PeriodDates> }> {
    const apiVersion = getApiVersion(taxYear, 'self-employment');
    const testScenario = HMRC_ENVIRONMENT === 'sandbox' ? 'STATEFUL' : undefined;
    return this.request<{
      periods: Array<{ periodId: string } & PeriodDates>;
    }>(
      'GET',
      `/individuals/business/self-employment/${nino}/${businessId}/period/${taxYear}`,
      apiVersion,
      undefined,
      testScenario
    );
  }

  // ============ UK PROPERTY SUBMISSIONS ============

  /**
   * Create or amend UK property cumulative period summary (TY 2025-26 onwards)
   */
  async createAmendUkPropertyCumulative(
    nino: string,
    businessId: string,
    taxYear: TaxYear,
    data: UkPropertyPeriodData
  ): Promise<void> {
    const apiVersion = getApiVersion(taxYear, 'property');
    const testScenario = HMRC_ENVIRONMENT === 'sandbox' ? 'STATEFUL' : undefined;
    await this.request<void>(
      'PUT',
      `/individuals/business/property/uk/${nino}/${businessId}/cumulative/${taxYear}`,
      apiVersion,
      data,
      testScenario
    );
  }

  /**
   * Retrieve UK property cumulative period summary (TY 2025-26 onwards)
   */
  async retrieveUkPropertyCumulative(
    nino: string,
    businessId: string,
    taxYear: TaxYear
  ): Promise<UkPropertyPeriodData> {
    const apiVersion = getApiVersion(taxYear, 'property');
    const testScenario = HMRC_ENVIRONMENT === 'sandbox' ? 'STATEFUL' : undefined;
    return this.request<UkPropertyPeriodData>(
      'GET',
      `/individuals/business/property/uk/${nino}/${businessId}/cumulative/${taxYear}`,
      apiVersion,
      undefined,
      testScenario
    );
  }

  /**
   * Create UK property period summary (TY before 2025-26)
   */
  async createUkPropertyPeriodSummary(
    nino: string,
    businessId: string,
    taxYear: TaxYear,
    periodDates: PeriodDates,
    data: UkPropertyPeriodData
  ): Promise<{ submissionId: string }> {
    const apiVersion = getApiVersion(taxYear, 'property');
    const testScenario = HMRC_ENVIRONMENT === 'sandbox' ? 'STATEFUL' : undefined;
    return this.request<{ submissionId: string }>(
      'POST',
      `/individuals/business/property/${nino}/${businessId}/period/${taxYear}`,
      apiVersion,
      {
        fromDate: periodDates.periodStartDate,
        toDate: periodDates.periodEndDate,
        ...data,
      },
      testScenario
    );
  }

  /**
   * Retrieve UK property period summary (TY before 2025-26)
   */
  async retrieveUkPropertyPeriodSummary(
    nino: string,
    businessId: string,
    taxYear: TaxYear,
    submissionId: string
  ): Promise<UkPropertyPeriodData> {
    const apiVersion = getApiVersion(taxYear, 'property');
    const testScenario = HMRC_ENVIRONMENT === 'sandbox' ? 'STATEFUL' : undefined;
    return this.request<UkPropertyPeriodData>(
      'GET',
      `/individuals/business/property/uk/${nino}/${businessId}/period/${taxYear}/${submissionId}`,
      apiVersion,
      undefined,
      testScenario
    );
  }

  /**
   * Amend UK property period summary (TY before 2025-26)
   */
  async amendUkPropertyPeriodSummary(
    nino: string,
    businessId: string,
    taxYear: TaxYear,
    submissionId: string,
    data: UkPropertyPeriodData
  ): Promise<void> {
    const apiVersion = getApiVersion(taxYear, 'property');
    const testScenario = HMRC_ENVIRONMENT === 'sandbox' ? 'STATEFUL' : undefined;
    await this.request<void>(
      'PUT',
      `/individuals/business/property/uk/${nino}/${businessId}/period/${taxYear}/${submissionId}`,
      apiVersion,
      data,
      testScenario
    );
  }

  // ============ TAX CALCULATIONS ============

  /**
   * Trigger a tax calculation
   */
  async triggerCalculation(
    nino: string,
    taxYear: TaxYear,
    finalDeclaration = false
  ): Promise<{ calculationId: string }> {
    const testScenario = HMRC_ENVIRONMENT === 'sandbox' ? 'STATEFUL' : undefined;
    return this.request<{ calculationId: string }>(
      'POST',
      `/individuals/calculations/self-assessment/${nino}/${taxYear}`,
      CALCULATIONS_API_VERSION,
      { finalDeclaration },
      testScenario
    );
  }

  /**
   * Get tax calculation result
   */
  async getCalculation(
    nino: string,
    taxYear: TaxYear,
    calculationId: string
  ): Promise<TaxCalculationResult> {
    const testScenario = HMRC_ENVIRONMENT === 'sandbox' ? 'STATEFUL' : undefined;
    return this.request<TaxCalculationResult>(
      'GET',
      `/individuals/calculations/self-assessment/${nino}/${taxYear}/${calculationId}`,
      CALCULATIONS_API_VERSION,
      undefined,
      testScenario
    );
  }

  // ============ SUBMISSION HELPER ============

  /**
   * Submit period data based on tax year and business type
   * Automatically routes to correct API endpoint
   */
  async submitPeriodData(
    nino: string,
    businessId: string,
    businessType: 'self-employment' | 'uk-property',
    taxYear: TaxYear,
    periodDates: PeriodDates,
    data: SelfEmploymentPeriodData | UkPropertyPeriodData
  ): Promise<{ success: boolean; reference?: string }> {
    const useCumulative = usesCumulativePeriodSummaries(taxYear);

    try {
      if (businessType === 'self-employment') {
        if (useCumulative) {
          await this.createAmendSelfEmploymentCumulative(
            nino,
            businessId,
            taxYear,
            data as SelfEmploymentPeriodData
          );
        } else {
          const result = await this.createSelfEmploymentPeriodSummary(
            nino,
            businessId,
            taxYear,
            periodDates,
            data as SelfEmploymentPeriodData
          );
          return { success: true, reference: result.periodId };
        }
      } else {
        if (useCumulative) {
          await this.createAmendUkPropertyCumulative(
            nino,
            businessId,
            taxYear,
            data as UkPropertyPeriodData
          );
        } else {
          const result = await this.createUkPropertyPeriodSummary(
            nino,
            businessId,
            taxYear,
            periodDates,
            data as UkPropertyPeriodData
          );
          return { success: true, reference: result.submissionId };
        }
      }

      return { success: true };
    } catch (error) {
      throw error;
    }
  }
}

// ============ OAUTH HELPERS ============

/**
 * Get the HMRC OAuth authorization URL
 */
export function getAuthUrl(redirectUri: string, state: string): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: HMRC_CLIENT_ID,
    scope: 'read:self-assessment write:self-assessment',
    redirect_uri: redirectUri,
    state,
  });

  return `${HMRC_AUTH_URL}?${params.toString()}`;
}

/**
 * Exchange authorization code for access tokens
 */
export async function exchangeCode(
  code: string,
  redirectUri: string
): Promise<OAuthTokens> {
  const response = await fetch(HMRC_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: HMRC_CLIENT_ID,
      client_secret: HMRC_CLIENT_SECRET,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error_description || 'Failed to exchange code');
  }

  const data = await response.json();

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
    tokenType: data.token_type,
    scope: data.scope,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
}

/**
 * Refresh an expired access token
 */
export async function refreshToken(refreshToken: string): Promise<OAuthTokens> {
  const response = await fetch(HMRC_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: HMRC_CLIENT_ID,
      client_secret: HMRC_CLIENT_SECRET,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error_description || 'Failed to refresh token');
  }

  const data = await response.json();

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
    tokenType: data.token_type,
    scope: data.scope,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
}

/**
 * Check if tokens need refreshing (5 minute buffer)
 */
export function needsRefresh(tokens: OAuthTokens): boolean {
  const bufferMs = 5 * 60 * 1000; // 5 minutes
  return Date.now() + bufferMs >= tokens.expiresAt;
}

/**
 * Create an authenticated API service instance
 */
export function createApiService(
  accessToken: string,
  fraudHeaders?: FraudPreventionHeaders
): MtdApiService {
  return new MtdApiService(accessToken, fraudHeaders);
}
