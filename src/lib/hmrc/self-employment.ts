import { hmrcRequest } from './client'
import { SelfEmploymentPeriod, SelfEmploymentAnnualSummary } from './types'

/**
 * Get all self-employment businesses for a user
 */
export async function getSelfEmploymentBusinesses(
  userId: string,
  nino: string
): Promise<{ businesses: { businessId: string; tradingName?: string }[] }> {
  return hmrcRequest(userId, `/individuals/business/self-employment/${nino}`)
}

/**
 * Create a self-employment business
 */
export async function createSelfEmploymentBusiness(
  userId: string,
  nino: string,
  data: {
    accountingPeriodStartDate: string
    accountingPeriodEndDate: string
    tradingName: string
    addressLineOne: string
    addressLineTwo?: string
    addressLineThree?: string
    addressLineFour?: string
    postalCode?: string
    countryCode: string
    commencementDate: string
  }
): Promise<{ businessId: string }> {
  return hmrcRequest(userId, `/individuals/business/self-employment/${nino}`, {
    method: 'POST',
    body: data,
  })
}

/**
 * Submit self-employment period summary (quarterly update)
 */
export async function submitSelfEmploymentPeriod(
  userId: string,
  nino: string,
  businessId: string,
  taxYear: string,
  period: SelfEmploymentPeriod
): Promise<{ periodId: string }> {
  return hmrcRequest(
    userId,
    `/individuals/business/self-employment/${nino}/${businessId}/period/${taxYear}`,
    {
      method: 'POST',
      body: period,
    }
  )
}

/**
 * Update self-employment period
 */
export async function updateSelfEmploymentPeriod(
  userId: string,
  nino: string,
  businessId: string,
  taxYear: string,
  periodId: string,
  period: Partial<SelfEmploymentPeriod>
): Promise<void> {
  return hmrcRequest(
    userId,
    `/individuals/business/self-employment/${nino}/${businessId}/period/${taxYear}/${periodId}`,
    {
      method: 'PUT',
      body: period,
    }
  )
}

/**
 * Get self-employment periods
 */
export async function getSelfEmploymentPeriods(
  userId: string,
  nino: string,
  businessId: string,
  taxYear: string
): Promise<{ periods: SelfEmploymentPeriod[] }> {
  return hmrcRequest(
    userId,
    `/individuals/business/self-employment/${nino}/${businessId}/period/${taxYear}`
  )
}

/**
 * Submit annual summary (end of year adjustments and allowances)
 */
export async function submitAnnualSummary(
  userId: string,
  nino: string,
  businessId: string,
  taxYear: string,
  summary: SelfEmploymentAnnualSummary
): Promise<void> {
  return hmrcRequest(
    userId,
    `/individuals/business/self-employment/${nino}/${businessId}/annual/${taxYear}`,
    {
      method: 'PUT',
      body: summary,
    }
  )
}

/**
 * Get annual summary
 */
export async function getAnnualSummary(
  userId: string,
  nino: string,
  businessId: string,
  taxYear: string
): Promise<SelfEmploymentAnnualSummary> {
  return hmrcRequest(
    userId,
    `/individuals/business/self-employment/${nino}/${businessId}/annual/${taxYear}`
  )
}
