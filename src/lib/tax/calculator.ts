// Shared UK tax calculation utility
// Extracted from src/app/api/dashboard/pdf/route.ts to avoid duplication

export interface TaxBreakdown {
  netProfit: number
  taxableProfit: number
  incomeTax: number
  class2NI: number
  class4NI: number
  nationalInsurance: number
  totalTaxDue: number
  effectiveTaxRate: number
}

/**
 * Calculate estimated UK self-employment tax for a given income/expenses.
 * Uses 2024-25 tax bands and NI rates.
 */
export function calculateEstimatedTax(
  totalIncome: number,
  totalExpenses: number,
  mileageDeduction = 0,
  useOfHomeAmount = 0,
): TaxBreakdown {
  const netProfit = totalIncome - totalExpenses - mileageDeduction - useOfHomeAmount
  const taxableProfit = Math.max(0, netProfit)

  const personalAllowance = 12570
  const taxableIncome = Math.max(0, taxableProfit - personalAllowance)

  const incomeTax =
    Math.min(taxableIncome, 37700) * 0.2 +
    Math.max(0, Math.min(taxableIncome - 37700, 87440)) * 0.4 +
    Math.max(0, taxableIncome - 125140) * 0.45

  const class2NI = taxableProfit > personalAllowance ? 3.45 * 52 : 0
  const class4NI =
    Math.max(0, Math.min(taxableProfit, 50270) - personalAllowance) * 0.06 +
    Math.max(0, taxableProfit - 50270) * 0.02
  const nationalInsurance = class2NI + class4NI

  const totalTaxDue = Math.round((incomeTax + nationalInsurance) * 100) / 100
  const effectiveTaxRate = taxableProfit > 0 ? (totalTaxDue / taxableProfit) * 100 : 0

  return {
    netProfit,
    taxableProfit,
    incomeTax,
    class2NI,
    class4NI,
    nationalInsurance,
    totalTaxDue,
    effectiveTaxRate,
  }
}
