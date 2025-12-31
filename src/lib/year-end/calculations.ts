import { CollectedData, TaxCalculation } from './types'

// 2024-25 tax rates
const TAX_RATES = {
  personalAllowance: 12570,
  personalAllowanceTaper: 100000,
  basicRateLimit: 50270,
  higherRateLimit: 125140,
  basicRate: 0.20,
  higherRate: 0.40,
  additionalRate: 0.45,
  class2Weekly: 3.45,
  class2Threshold: 12570,
  class4LowerLimit: 12570,
  class4UpperLimit: 50270,
  class4LowerRate: 0.06,
  class4UpperRate: 0.02,
  paymentOnAccountThreshold: 1000,
}

/**
 * Calculate full tax breakdown
 */
export function calculateTax(data: CollectedData): TaxCalculation {
  const transactions = data.transactions

  // Calculate totals
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)

  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)

  // Add mileage deduction
  const mileageDeduction = data.mileageTrips
    .reduce((sum, t) => sum + (t.deduction || 0), 0)

  // Add use of home
  const useOfHomeDeduction = data.useOfHome?.annual_allowance || 0

  // Calculate taxable profit
  const taxableProfit = Math.max(0, totalIncome - totalExpenses - mileageDeduction - useOfHomeDeduction)

  // Calculate personal allowance (tapered if income > £100k)
  let personalAllowance = TAX_RATES.personalAllowance
  if (taxableProfit > TAX_RATES.personalAllowanceTaper) {
    const reduction = Math.floor((taxableProfit - TAX_RATES.personalAllowanceTaper) / 2)
    personalAllowance = Math.max(0, personalAllowance - reduction)
  }

  const personalAllowanceUsed = Math.min(personalAllowance, taxableProfit)
  const taxableIncome = Math.max(0, taxableProfit - personalAllowance)

  // Calculate Income Tax
  const incomeTax = calculateIncomeTax(taxableIncome)

  // Calculate National Insurance
  const nationalInsurance = calculateNationalInsurance(taxableProfit)

  // Total tax due
  const totalTaxDue = incomeTax.total + nationalInsurance.total

  // Payments on account
  const paymentsOnAccount = calculatePaymentsOnAccount(totalTaxDue)

  // Effective tax rate
  const effectiveTaxRate = taxableProfit > 0
    ? (totalTaxDue / taxableProfit) * 100
    : 0

  // Marginal rate
  const marginalRate = getMarginalRate(taxableProfit)

  return {
    taxableProfit: Math.round(taxableProfit * 100) / 100,
    personalAllowance,
    personalAllowanceUsed: Math.round(personalAllowanceUsed * 100) / 100,
    incomeTax,
    nationalInsurance,
    totalTaxDue: Math.round(totalTaxDue * 100) / 100,
    paymentsOnAccount,
    effectiveTaxRate: Math.round(effectiveTaxRate * 10) / 10,
    marginalRate,
  }
}

/**
 * Calculate Income Tax breakdown
 */
function calculateIncomeTax(taxableIncome: number): TaxCalculation['incomeTax'] {
  let remaining = taxableIncome

  // Basic rate (20%) - on income from £12,571 to £50,270
  const basicRateBand = TAX_RATES.basicRateLimit - TAX_RATES.personalAllowance
  const basicRateAmount = Math.min(Math.max(0, remaining), basicRateBand)
  const basicRateTax = basicRateAmount * TAX_RATES.basicRate
  remaining = Math.max(0, remaining - basicRateBand)

  // Higher rate (40%) - on income from £50,271 to £125,140
  const higherRateBand = TAX_RATES.higherRateLimit - TAX_RATES.basicRateLimit
  const higherRateAmount = Math.min(Math.max(0, remaining), higherRateBand)
  const higherRateTax = higherRateAmount * TAX_RATES.higherRate
  remaining = Math.max(0, remaining - higherRateBand)

  // Additional rate (45%) - on income over £125,140
  const additionalRateAmount = Math.max(0, remaining)
  const additionalRateTax = additionalRateAmount * TAX_RATES.additionalRate

  return {
    basicRate: {
      amount: Math.round(basicRateAmount * 100) / 100,
      tax: Math.round(basicRateTax * 100) / 100,
    },
    higherRate: {
      amount: Math.round(higherRateAmount * 100) / 100,
      tax: Math.round(higherRateTax * 100) / 100,
    },
    additionalRate: {
      amount: Math.round(additionalRateAmount * 100) / 100,
      tax: Math.round(additionalRateTax * 100) / 100,
    },
    total: Math.round((basicRateTax + higherRateTax + additionalRateTax) * 100) / 100,
  }
}

/**
 * Calculate National Insurance
 */
function calculateNationalInsurance(taxableProfit: number): TaxCalculation['nationalInsurance'] {
  // Class 2 (flat rate if above threshold)
  const class2 = taxableProfit > TAX_RATES.class2Threshold
    ? TAX_RATES.class2Weekly * 52
    : 0

  // Class 4 (6% on £12,570-£50,270)
  const class4LowerAmount = Math.max(
    0,
    Math.min(taxableProfit, TAX_RATES.class4UpperLimit) - TAX_RATES.class4LowerLimit
  )
  const class4Lower = class4LowerAmount * TAX_RATES.class4LowerRate

  // Class 4 (2% above £50,270)
  const class4UpperAmount = Math.max(0, taxableProfit - TAX_RATES.class4UpperLimit)
  const class4Upper = class4UpperAmount * TAX_RATES.class4UpperRate

  return {
    class2: Math.round(class2 * 100) / 100,
    class4Lower: Math.round(class4Lower * 100) / 100,
    class4Upper: Math.round(class4Upper * 100) / 100,
    total: Math.round((class2 + class4Lower + class4Upper) * 100) / 100,
  }
}

/**
 * Calculate payments on account
 */
function calculatePaymentsOnAccount(totalTaxDue: number): TaxCalculation['paymentsOnAccount'] {
  const required = totalTaxDue >= TAX_RATES.paymentOnAccountThreshold

  if (!required) {
    return { required: false, firstPayment: 0, secondPayment: 0, total: 0 }
  }

  const halfTax = totalTaxDue / 2

  return {
    required: true,
    firstPayment: Math.round(halfTax * 100) / 100,
    secondPayment: Math.round(halfTax * 100) / 100,
    total: Math.round(totalTaxDue * 100) / 100,
  }
}

/**
 * Get marginal tax rate
 */
function getMarginalRate(taxableProfit: number): number {
  if (taxableProfit <= TAX_RATES.personalAllowance) return 0
  if (taxableProfit <= TAX_RATES.basicRateLimit) return 20
  if (taxableProfit <= TAX_RATES.higherRateLimit) return 40
  return 45
}

/**
 * Simple tax estimate for year comparisons
 */
export function estimateTax(profit: number): number {
  const personalAllowance = 12570
  const taxableIncome = Math.max(0, profit - personalAllowance)

  // Simplified calculation
  const incomeTax = taxableIncome * 0.20
  const ni = profit > personalAllowance ? (profit - personalAllowance) * 0.06 + (3.45 * 52) : 0

  return Math.round((incomeTax + ni) * 100) / 100
}
