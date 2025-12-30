import { createClient } from '@/lib/supabase/server'
import type { Property, PropertyBreakdown, PropertyTaxSummary, SA105Data } from '@/types/database'

const PROPERTY_ALLOWANCE = 1000

interface TransactionWithCategory {
  amount: number
  property_id: string | null
  category: {
    code: string
    type: string
  } | null
}

interface FinanceCostRow {
  property_id: string
  mortgage_interest: number
  other_finance_costs: number
}

export async function calculatePropertyTax(
  userId: string,
  taxYear: string
): Promise<PropertyTaxSummary> {
  const supabase = await createClient()

  // Get all active properties
  const { data: properties } = await supabase
    .from('properties')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)

  if (!properties || properties.length === 0) {
    return {
      totalRentalIncome: 0,
      totalAllowableExpenses: 0,
      expensesByCategory: {},
      profitBeforeFinanceCosts: 0,
      totalFinanceCosts: 0,
      financeCostTaxCredit: 0,
      propertyAllowance: PROPERTY_ALLOWANCE,
      usePropertyAllowance: false,
      taxableProfit: 0,
      properties: [],
    }
  }

  // Get property transactions (excluding personal)
  const { data: transactions } = await supabase
    .from('transactions')
    .select(`
      amount,
      property_id,
      category:categories!transactions_category_id_fkey(code, type)
    `)
    .eq('user_id', userId)
    .eq('tax_year', taxYear)
    .eq('review_status', 'confirmed')
    .not('property_id', 'is', null)

  // Get finance costs
  const { data: financeCosts } = await supabase
    .from('property_finance_costs')
    .select('property_id, mortgage_interest, other_finance_costs')
    .eq('user_id', userId)
    .eq('tax_year', taxYear)

  // Calculate totals
  let totalRentalIncome = 0
  let totalAllowableExpenses = 0
  let totalFinanceCosts = 0
  const expensesByCategory: Record<string, number> = {}
  const propertyBreakdowns: PropertyBreakdown[] = []

  for (const property of properties as Property[]) {
    const propertyTxs = (transactions as TransactionWithCategory[] | null)?.filter(
      (t) => t.property_id === property.id
    ) || []
    const propertyFinance = (financeCosts as FinanceCostRow[] | null)?.find(
      (f) => f.property_id === property.id
    )

    let propertyIncome = 0
    let propertyExpenses = 0

    for (const tx of propertyTxs) {
      const amount = Math.abs(tx.amount)
      const ownershipShare = (property.ownership_percentage || 100) / 100
      const adjustedAmount = amount * ownershipShare

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rawCategory = tx.category as any
      const category = Array.isArray(rawCategory) ? rawCategory[0] : rawCategory

      if (category?.type === 'income') {
        propertyIncome += adjustedAmount
        totalRentalIncome += adjustedAmount
      } else if (category?.type === 'expense') {
        propertyExpenses += adjustedAmount
        totalAllowableExpenses += adjustedAmount

        const catCode = category.code
        expensesByCategory[catCode] = (expensesByCategory[catCode] || 0) + adjustedAmount
      }
    }

    const propertyFinanceCost =
      (propertyFinance?.mortgage_interest || 0) + (propertyFinance?.other_finance_costs || 0)
    totalFinanceCosts += propertyFinanceCost

    propertyBreakdowns.push({
      propertyId: property.id,
      propertyName: property.name,
      income: propertyIncome,
      expenses: propertyExpenses,
      financeCosts: propertyFinanceCost,
      profit: propertyIncome - propertyExpenses,
    })
  }

  // Calculate profit before finance costs
  const profitBeforeFinanceCosts = totalRentalIncome - totalAllowableExpenses

  // Property allowance comparison
  // Use property allowance if:
  // 1. Total income <= £1,000 (fully covered), OR
  // 2. Property allowance deduction is better than actual expenses
  const usePropertyAllowance =
    totalRentalIncome <= PROPERTY_ALLOWANCE ||
    (totalRentalIncome > PROPERTY_ALLOWANCE && PROPERTY_ALLOWANCE > totalAllowableExpenses)

  // Taxable profit
  let taxableProfit: number
  if (totalRentalIncome <= PROPERTY_ALLOWANCE) {
    taxableProfit = 0 // Fully covered by allowance
  } else if (usePropertyAllowance) {
    taxableProfit = totalRentalIncome - PROPERTY_ALLOWANCE
  } else {
    taxableProfit = profitBeforeFinanceCosts
  }

  // Finance cost tax credit (20%)
  const financeCostTaxCredit = totalFinanceCosts * 0.2

  return {
    totalRentalIncome,
    totalAllowableExpenses,
    expensesByCategory,
    profitBeforeFinanceCosts,
    totalFinanceCosts,
    financeCostTaxCredit,
    propertyAllowance: PROPERTY_ALLOWANCE,
    usePropertyAllowance,
    taxableProfit: Math.max(0, taxableProfit),
    properties: propertyBreakdowns,
  }
}

export async function generateSA105(userId: string, taxYear: string): Promise<SA105Data> {
  const summary = await calculatePropertyTax(userId, taxYear)

  return {
    totalPropertyIncome: summary.totalRentalIncome,
    totalPropertyExpenses: summary.usePropertyAllowance
      ? summary.propertyAllowance
      : summary.totalAllowableExpenses,
    taxableProfit: summary.taxableProfit,
    financeCostsCurrentYear: summary.totalFinanceCosts,
    financeCostsBroughtForward: 0, // TODO: Track carried forward costs
    totalFinanceCosts: summary.totalFinanceCosts,
    financeCostTaxCredit: summary.financeCostTaxCredit,
    numberOfProperties: summary.properties.length,
    usePropertyAllowance: summary.usePropertyAllowance,
  }
}

export async function hasProperties(userId: string): Promise<boolean> {
  const supabase = await createClient()

  const { count } = await supabase
    .from('properties')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_active', true)

  return (count || 0) > 0
}
