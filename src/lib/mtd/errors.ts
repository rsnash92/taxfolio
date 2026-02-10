import type { HmrcApiError } from '@/types/mtd';

/**
 * HMRC API error codes mapped to user-friendly messages
 */
export const HMRC_ERROR_MESSAGES: Record<string, string> = {
  // Format errors
  FORMAT_NINO: 'The National Insurance number format is invalid.',
  FORMAT_TAX_YEAR: 'The tax year format is invalid. Please use format YYYY-YY (e.g., 2025-26).',
  FORMAT_BUSINESS_ID: 'The business ID format is invalid.',
  FORMAT_VALUE: 'One of the values submitted has an invalid format.',
  FORMAT_PERIOD_START_DATE: 'The period start date format is invalid. Please use YYYY-MM-DD.',
  FORMAT_PERIOD_END_DATE: 'The period end date format is invalid. Please use YYYY-MM-DD.',
  FORMAT_CALCULATION_ID: 'The calculation ID format is invalid.',

  // Rule errors
  RULE_TAX_YEAR_NOT_SUPPORTED: 'The specified tax year is not yet supported for MTD submissions.',
  RULE_TAX_YEAR_RANGE_INVALID: 'The tax year range is invalid.',
  RULE_TAX_YEAR_NOT_ENDED: 'The tax year has not yet ended. You cannot make a final declaration.',
  RULE_INCORRECT_OR_EMPTY_BODY_SUBMITTED: 'The request body is empty or contains invalid data.',
  RULE_BOTH_EXPENSES_SUPPLIED:
    'You cannot submit both itemised expenses and consolidated expenses. Please choose one option.',
  RULE_OBLIGATIONS_NOT_MET:
    'You have not met all your quarterly obligations for this tax year. Please submit your quarterly updates first.',
  RULE_NO_INCOME_SUBMISSIONS_EXIST:
    'No income submissions exist for this period. Please add your income data first.',
  RULE_ALREADY_SUBMITTED:
    'A submission for this period has already been made. You can amend it instead.',
  RULE_PERIOD_NOT_IN_TAX_YEAR: 'The specified period is not within the tax year.',
  RULE_OVERLAPPING_PERIOD: 'The period overlaps with an existing submission.',
  RULE_MISALIGNED_PERIOD: 'The period dates do not align with your quarterly obligations.',
  RULE_NOT_CONTIGUOUS_PERIOD: 'The period is not contiguous with the previous period.',
  RULE_DUPLICATE_SUBMISSION: 'A duplicate submission was detected.',
  RULE_CLASS4_OVER_16: 'Class 4 NICs are only applicable if you were under 66 at the start of the tax year.',
  RULE_CLASS4_PENSION_AGE: 'Class 4 NICs exemption applies due to reaching state pension age.',
  RULE_FINAL_DECLARATION_RECEIVED: 'A final declaration has already been submitted for this tax year.',
  RULE_TAX_YEAR_FINALISED: 'The tax year has been finalised and cannot be amended.',
  RULE_NO_ACCOUNTING_PERIOD: 'No accounting period is set up for this business.',
  RULE_SUBMISSION_FAILED: 'The submission failed. Please try again.',
  RULE_INCORRECT_GOV_TEST_SCENARIO: 'The test scenario header is invalid (sandbox only).',
  RULE_INSOLVENT_TRADER: 'Submissions cannot be made for an insolvent trader.',
  RULE_BUSINESS_INCOME_PERIOD_RESTRICTION:
    'You cannot submit income for this period due to restrictions on your account.',

  // Resource errors
  MATCHING_RESOURCE_NOT_FOUND:
    'No matching record found. Please check your business is registered for MTD.',
  NO_BUSINESS_FOUND: 'No business has been found for the provided details.',
  BUSINESS_NOT_FOUND: 'The specified business was not found.',
  PERIOD_NOT_FOUND: 'The specified period was not found.',
  CALCULATION_NOT_FOUND: 'The calculation could not be found.',

  // Authorization errors
  CLIENT_OR_AGENT_NOT_AUTHORISED:
    'You are not authorised to access this resource. Please reconnect your HMRC account.',
  AGENT_NOT_SUBSCRIBED:
    'The agent is not subscribed to Agent Services. Please contact your agent.',
  AGENT_NOT_AUTHORISED:
    'The agent is not authorised to act on your behalf. Please authorise them through HMRC.',
  CLIENT_NOT_SUBSCRIBED:
    'You are not subscribed to MTD for Income Tax. Please sign up through HMRC.',
  INVALID_CREDENTIALS: 'Your HMRC credentials are invalid or have expired. Please reconnect.',
  INVALID_BEARER_TOKEN:
    'Your session has expired. Please reconnect your HMRC account.',
  BEARER_TOKEN_EXPIRED:
    'Your HMRC session has expired. Please reconnect your account.',

  // Server errors
  INTERNAL_SERVER_ERROR:
    'HMRC is experiencing technical issues. Please try again later.',
  SERVICE_UNAVAILABLE:
    'The HMRC service is temporarily unavailable. Please try again later.',
  SERVER_ERROR:
    'An unexpected error occurred on the HMRC server. Please try again later.',
  GATEWAY_TIMEOUT:
    'The request to HMRC timed out. Please try again.',

  // MTD specific errors
  NOT_FOUND: 'The requested resource was not found.',
  FORBIDDEN: 'Access to this resource is forbidden.',
  GONE: 'This resource is no longer available.',
  TOO_MANY_REQUESTS:
    'Too many requests have been made. Please wait a moment and try again.',
  ACCEPT_HEADER_INVALID:
    'The Accept header is invalid. This is a technical issue - please contact support.',
  UNKNOWN_ERROR: 'An unknown error occurred. Please try again or contact support.',
};

/**
 * Get a user-friendly error message from an HMRC error code
 */
export function getErrorMessage(code: string): string {
  return HMRC_ERROR_MESSAGES[code] || HMRC_ERROR_MESSAGES['UNKNOWN_ERROR'];
}

/**
 * Parse an HMRC API error response and return a user-friendly error
 */
export function parseHmrcError(error: HmrcApiError): {
  code: string;
  message: string;
  details?: string[];
} {
  const mainCode = error.code || 'UNKNOWN_ERROR';
  const mainMessage = getErrorMessage(mainCode);

  // If there are nested errors, extract their messages
  const details = error.errors?.map((e) => {
    const detailMessage = getErrorMessage(e.code);
    if (e.path) {
      return `${detailMessage} (Field: ${e.path})`;
    }
    return detailMessage;
  });

  return {
    code: mainCode,
    message: mainMessage,
    details: details?.length ? details : undefined,
  };
}

/**
 * Check if an error is retryable
 */
export function isRetryableError(code: string): boolean {
  const retryableCodes = [
    'INTERNAL_SERVER_ERROR',
    'SERVICE_UNAVAILABLE',
    'SERVER_ERROR',
    'GATEWAY_TIMEOUT',
    'TOO_MANY_REQUESTS',
  ];
  return retryableCodes.includes(code);
}

/**
 * Check if an error requires re-authentication
 */
export function requiresReauth(code: string): boolean {
  const reauthCodes = [
    'CLIENT_OR_AGENT_NOT_AUTHORISED',
    'INVALID_CREDENTIALS',
    'INVALID_BEARER_TOKEN',
    'BEARER_TOKEN_EXPIRED',
  ];
  return reauthCodes.includes(code);
}

/**
 * Format error for display in UI
 */
export function formatErrorForDisplay(error: HmrcApiError): string {
  const parsed = parseHmrcError(error);

  if (parsed.details && parsed.details.length > 0) {
    return `${parsed.message}\n\nDetails:\n${parsed.details.map((d) => `• ${d}`).join('\n')}`;
  }

  return parsed.message;
}

/**
 * Create a standardized error object for API responses
 */
export function createApiError(
  code: string,
  customMessage?: string
): { error: { code: string; message: string } } {
  return {
    error: {
      code,
      message: customMessage || getErrorMessage(code),
    },
  };
}

/**
 * HTTP status code to error code mapping
 */
export function httpStatusToErrorCode(status: number): string {
  switch (status) {
    case 400:
      return 'FORMAT_VALUE';
    case 401:
      return 'INVALID_BEARER_TOKEN';
    case 403:
      return 'CLIENT_OR_AGENT_NOT_AUTHORISED';
    case 404:
      return 'NOT_FOUND';
    case 406:
      return 'ACCEPT_HEADER_INVALID';
    case 409:
      return 'RULE_DUPLICATE_SUBMISSION';
    case 410:
      return 'GONE';
    case 429:
      return 'TOO_MANY_REQUESTS';
    case 500:
      return 'INTERNAL_SERVER_ERROR';
    case 502:
      return 'SERVER_ERROR';
    case 503:
      return 'SERVICE_UNAVAILABLE';
    case 504:
      return 'GATEWAY_TIMEOUT';
    default:
      return 'UNKNOWN_ERROR';
  }
}
