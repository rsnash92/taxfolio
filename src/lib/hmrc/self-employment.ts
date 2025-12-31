import { hmrcRequest } from './client'
import { SelfEmploymentPeriod, SelfEmploymentAnnualSummary } from './types'

interface BusinessDetails {
  businessId: string
  typeOfBusiness: 'self-employment' | 'uk-property' | 'foreign-property'
  tradingName?: string
  accountingPeriods?: { start: string; end: string }[]
}

interface ListBusinessesResponse {
  listOfBusinesses: BusinessDetails[]
}

/**
 * List all businesses for a user (MTD ITSA Business Details API)
 */
export async function listAllBusinesses(
  userId: string,
  nino: string
): Promise<ListBusinessesResponse> {
  return hmrcRequest(userId, `/individuals/business/details/${nino}/list`, {
    govTestScenario: 'STATEFUL',
  })
}

/**
 * Get all self-employment businesses for a user
 */
export async function getSelfEmploymentBusinesses(
  userId: string,
  nino: string
): Promise<{ businesses: { businessId: string; tradingName?: string }[] }> {
  try {
    const response = await listAllBusinesses(userId, nino)
    const selfEmploymentBusinesses = response.listOfBusinesses
      ?.filter((b) => b.typeOfBusiness === 'self-employment')
      .map((b) => ({ businessId: b.businessId, tradingName: b.tradingName }))
    return { businesses: selfEmploymentBusinesses || [] }
  } catch {
    // Fallback to old endpoint for compatibility
    return hmrcRequest(userId, `/individuals/business/self-employment/${nino}`)
  }
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
    govTestScenario: 'STATEFUL',
  })
}

interface CumulativePeriodSummary {
  periodDates: {
    periodStartDate: string
    periodEndDate: string
  }
  periodIncome?: {
    turnover?: number
    other?: number
  }
  periodExpenses?: {
    consolidatedExpenses?: number
    costOfGoods?: number
    paymentsToSubcontractors?: number
    wagesAndStaffCosts?: number
    carVanTravelExpenses?: number
    premisesRunningCosts?: number
    maintenanceCosts?: number
    adminCosts?: number
    businessEntertainmentCosts?: number
    advertisingCosts?: number
    interestOnBankOtherLoans?: number
    financeCharges?: number
    irrecoverableDebts?: number
    professionalFees?: number
    depreciation?: number
    otherExpenses?: number
  }
}

/**
 * Submit self-employment cumulative period summary (quarterly update)
 * Uses the MTD ITSA Self-Employment Business API
 */
export async function submitSelfEmploymentPeriod(
  userId: string,
  nino: string,
  businessId: string,
  taxYear: string,
  period: SelfEmploymentPeriod
): Promise<{ periodId: string }> {
  // Convert to cumulative period summary format
  const cumulativeSummary: CumulativePeriodSummary = {
    periodDates: {
      periodStartDate: period.from,
      periodEndDate: period.to,
    },
    periodIncome: {
      turnover: period.incomes?.turnover || 0,
      other: period.incomes?.other,
    },
    periodExpenses: period.expenses
      ? {
          otherExpenses: period.expenses.otherExpenses?.amount,
        }
      : undefined,
  }

  return hmrcRequest(
    userId,
    `/individuals/business/self-employment/${nino}/${businessId}/cumulative/${taxYear}`,
    {
      method: 'PUT',
      body: cumulativeSummary,
      govTestScenario: 'STATEFUL',
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
