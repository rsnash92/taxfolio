// OAuth types
export interface HMRCTokens {
  access_token: string
  refresh_token: string
  token_type: string
  expires_in: number
  scope: string
}

export interface StoredHMRCTokens {
  id: string
  user_id: string
  access_token: string
  refresh_token: string
  token_type: string
  expires_at: string
  scope: string
  created_at: string
  updated_at: string
}

// Self-Employment types
export interface SelfEmploymentPeriod {
  periodId?: string
  from: string // YYYY-MM-DD
  to: string // YYYY-MM-DD
  incomes: {
    turnover: number
    other?: number
  }
  expenses?: {
    costOfGoods?: { amount: number }
    cisPaymentsToSubcontractors?: { amount: number }
    staffCosts?: { amount: number }
    travelCosts?: { amount: number }
    premisesRunningCosts?: { amount: number }
    maintenanceCosts?: { amount: number }
    adminCosts?: { amount: number }
    businessEntertainmentCosts?: { amount: number }
    advertisingCosts?: { amount: number }
    interestOnBankOtherLoans?: { amount: number }
    financeCharges?: { amount: number }
    irrecoverableDebts?: { amount: number }
    professionalFees?: { amount: number }
    depreciation?: { amount: number }
    otherExpenses?: { amount: number }
  }
}

export interface SelfEmploymentAnnualSummary {
  adjustments?: {
    includedNonTaxableProfits?: number
    basisAdjustment?: number
    overlapReliefUsed?: number
    accountingAdjustment?: number
    averagingAdjustment?: number
    outstandingBusinessIncome?: number
    balancingChargeBpra?: number
    balancingChargeOther?: number
    goodsAndServicesOwnUse?: number
  }
  allowances?: {
    annualInvestmentAllowance?: number
    businessPremisesRenovationAllowance?: number
    capitalAllowanceMainPool?: number
    capitalAllowanceSpecialRatePool?: number
    zeroEmissionsGoodsVehicleAllowance?: number
    enhancedCapitalAllowance?: number
    allowanceOnSales?: number
    capitalAllowanceSingleAssetPool?: number
    tradingIncomeAllowance?: number
    structuresAndBuildingsAllowance?: number
    electricChargePointAllowance?: number
  }
  nonFinancials?: {
    businessAccountingPeriod?: {
      startDate: string
      endDate: string
    }
    class4NicsExemptionReason?:
      | 'non-resident'
      | 'trustee'
      | 'diver'
      | 'ITTOIA-2005'
      | 'over-state-pension-age'
      | 'under-16'
  }
}

// Property types
export interface UKPropertyIncome {
  periodId?: string
  from: string
  to: string
  income?: {
    premiumsOfLeaseGrant?: number
    reversePremiums?: number
    periodAmount?: number
    taxDeducted?: number
    otherIncome?: number
    rentARoom?: { rentsReceived: number }
  }
  expenses?: {
    premisesRunningCosts?: number
    repairsAndMaintenance?: number
    financialCosts?: number
    professionalFees?: number
    costOfServices?: number
    other?: number
    consolidatedExpenses?: number
    residentialFinancialCost?: number
    residentialFinancialCostsCarriedForward?: number
    rentARoom?: { amountClaimed: number }
  }
}

// Obligations types
export interface Obligation {
  periodKey: string
  start: string
  end: string
  due: string
  status: 'Open' | 'Fulfilled'
  received?: string
}

export interface ObligationsResponse {
  obligations: {
    typeOfBusiness: string
    businessId: string
    obligationDetails: Obligation[]
  }[]
}

// Calculation types
export interface TaxCalculation {
  calculationId: string
  taxYear: string
  requestedBy: string
  calculationReason: string
  calculationTimestamp: string
  totalIncomeTaxAndNicsDue?: number
  totalTaxableIncome?: number
  incomeTaxDue?: number
  class2NicAmount?: number
  class4NicAmount?: number
}

// API Error type
export interface HMRCError {
  code: string
  message: string
  errors?: {
    code: string
    message: string
    path?: string
  }[]
}

// Test User type
export interface TestUser {
  userId: string
  password: string
  userFullName: string
  emailAddress: string
  nino: string
  mtdItId: string
}
