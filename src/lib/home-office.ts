// HMRC flat rates for simplified expenses (2024-25)
export const SIMPLIFIED_RATES = {
  tier1: { minHours: 25, maxHours: 50, monthlyRate: 10 },
  tier2: { minHours: 51, maxHours: 100, monthlyRate: 18 },
  tier3: { minHours: 101, maxHours: Infinity, monthlyRate: 26 },
} as const

export interface SimplifiedInputs {
  hoursPerWeek: number
  weeksPerYear: number
}

export interface ActualCostsInputs {
  totalRooms: number
  businessRooms: number
  electricity: number
  gas: number
  water: number
  councilTax: number
  mortgageInterest: number
  rent: number
  insurance: number
  broadband: number
  repairs: number
  other: number
}

export interface SimplifiedBreakdown {
  hoursPerMonth: number
  tier: string
  monthlyRate: number
  months: number
}

export interface ActualBreakdown {
  totalCosts: number
  roomProportion: number
  businessProportion: number
}

export interface HomeOfficeResult {
  simplifiedAmount: number
  simplifiedBreakdown: SimplifiedBreakdown
  actualAmount: number
  actualBreakdown: ActualBreakdown
  recommendedMethod: 'simplified' | 'actual'
  difference: number
  finalAmount: number
}

/**
 * Calculate simplified expenses (flat rate method)
 * HMRC rates based on hours worked from home per month
 */
export function calculateSimplified(inputs: SimplifiedInputs): {
  amount: number
  breakdown: SimplifiedBreakdown
} {
  const { hoursPerWeek, weeksPerYear } = inputs

  // Calculate hours per month (average)
  const hoursPerMonth = (hoursPerWeek * weeksPerYear) / 12

  // Determine which tier
  let monthlyRate = 0
  let tier = 'Below threshold'

  if (hoursPerMonth >= 101) {
    monthlyRate = SIMPLIFIED_RATES.tier3.monthlyRate // £26
    tier = '101+ hours'
  } else if (hoursPerMonth >= 51) {
    monthlyRate = SIMPLIFIED_RATES.tier2.monthlyRate // £18
    tier = '51-100 hours'
  } else if (hoursPerMonth >= 25) {
    monthlyRate = SIMPLIFIED_RATES.tier1.monthlyRate // £10
    tier = '25-50 hours'
  }

  // Calculate annual amount
  const monthsWorked = Math.min(weeksPerYear / 4.33, 12) // Convert weeks to months, max 12
  const amount = monthlyRate * monthsWorked

  return {
    amount: Math.round(amount * 100) / 100,
    breakdown: {
      hoursPerMonth: Math.round(hoursPerMonth),
      tier,
      monthlyRate,
      months: Math.round(monthsWorked),
    },
  }
}

/**
 * Calculate actual costs (proportion method)
 * Business proportion of actual household costs
 */
export function calculateActualCosts(inputs: ActualCostsInputs): {
  amount: number
  breakdown: ActualBreakdown
} {
  const {
    totalRooms,
    businessRooms,
    electricity,
    gas,
    water,
    councilTax,
    mortgageInterest,
    rent,
    insurance,
    broadband,
    repairs,
    other,
  } = inputs

  // Total household costs (use mortgage interest OR rent, not both)
  const housingCost = Math.max(mortgageInterest, rent)
  const totalCosts =
    electricity +
    gas +
    water +
    councilTax +
    housingCost +
    insurance +
    broadband +
    repairs +
    other

  // Room proportion (business rooms / total rooms)
  const roomProportion = totalRooms > 0 ? businessRooms / totalRooms : 0

  // Business proportion (using simplified room-only calculation as per HMRC guidance)
  const businessProportion = roomProportion

  const amount = totalCosts * businessProportion

  return {
    amount: Math.round(amount * 100) / 100,
    breakdown: {
      totalCosts,
      roomProportion,
      businessProportion,
    },
  }
}

/**
 * Calculate both methods and recommend the better one
 */
export function calculateHomeOffice(
  simplified: SimplifiedInputs,
  actual: ActualCostsInputs
): HomeOfficeResult {
  const simplifiedResult = calculateSimplified(simplified)
  const actualResult = calculateActualCosts(actual)

  // Recommend the better method
  const recommendedMethod =
    actualResult.amount > simplifiedResult.amount ? 'actual' : 'simplified'
  const finalAmount = Math.max(simplifiedResult.amount, actualResult.amount)
  const difference = Math.abs(actualResult.amount - simplifiedResult.amount)

  return {
    simplifiedAmount: simplifiedResult.amount,
    simplifiedBreakdown: simplifiedResult.breakdown,
    actualAmount: actualResult.amount,
    actualBreakdown: actualResult.breakdown,
    recommendedMethod,
    difference: Math.round(difference * 100) / 100,
    finalAmount,
  }
}

/**
 * Format the result for SA103
 */
export function getHomeOfficeForSA103(
  amount: number,
  method: 'simplified' | 'actual'
): {
  amount: number
  description: string
  box: string
} {
  return {
    amount,
    description:
      method === 'simplified'
        ? 'Use of home (simplified expenses)'
        : 'Use of home (actual costs)',
    box: 'SA103 Box 20', // Other allowable business expenses
  }
}
