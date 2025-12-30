import { hmrcRequest } from './client'
import { UKPropertyIncome } from './types'

/**
 * Get property business for a user
 */
export async function getPropertyBusiness(
  userId: string,
  nino: string
): Promise<{ businessId?: string }> {
  return hmrcRequest(userId, `/individuals/business/property/${nino}`)
}

/**
 * Create UK property business
 */
export async function createPropertyBusiness(
  userId: string,
  nino: string,
  data: {
    accountingPeriodStartDate: string
    accountingPeriodEndDate: string
  }
): Promise<{ businessId: string }> {
  return hmrcRequest(userId, `/individuals/business/property/uk/${nino}`, {
    method: 'POST',
    body: data,
  })
}

/**
 * Submit UK property period (quarterly)
 */
export async function submitPropertyPeriod(
  userId: string,
  nino: string,
  businessId: string,
  taxYear: string,
  period: UKPropertyIncome
): Promise<{ periodId: string }> {
  return hmrcRequest(
    userId,
    `/individuals/business/property/uk/${nino}/${businessId}/period/${taxYear}`,
    {
      method: 'POST',
      body: period,
    }
  )
}

/**
 * Get UK property periods
 */
export async function getPropertyPeriods(
  userId: string,
  nino: string,
  businessId: string,
  taxYear: string
): Promise<{ periods: UKPropertyIncome[] }> {
  return hmrcRequest(
    userId,
    `/individuals/business/property/uk/${nino}/${businessId}/period/${taxYear}`
  )
}

/**
 * Submit property annual summary
 */
export async function submitPropertyAnnualSummary(
  userId: string,
  nino: string,
  businessId: string,
  taxYear: string,
  summary: object
): Promise<void> {
  return hmrcRequest(
    userId,
    `/individuals/business/property/uk/${nino}/${businessId}/annual/${taxYear}`,
    {
      method: 'PUT',
      body: summary,
    }
  )
}
