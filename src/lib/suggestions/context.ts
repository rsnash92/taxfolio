import { createClient } from '@/lib/supabase/server'
import { UserFinancialContext } from './types'

interface TransactionData {
  amount: number
  type: string
  category: { code: string; name: string; type: string } | null
}

interface MileageData {
  miles: number
  deduction: number
}

/**
 * Build financial context for suggestions analysis
 */
export async function buildFinancialContext(
  userId: string,
  taxYear: string
): Promise<UserFinancialContext> {
  const supabase = await createClient()

  // Get user profile
  const { data: profile } = await supabase
    .from('users')
    .select('user_type')
    .eq('id', userId)
    .single()

  // Get transactions with categories
  const { data: transactions } = await supabase
    .from('transactions')
    .select(`
      amount,
      category:categories!transactions_category_id_fkey(code, name, type)
    `)
    .eq('user_id', userId)
    .eq('tax_year', taxYear)
    .eq('review_status', 'confirmed')
    .eq('is_personal', false)

  const txList = (transactions as TransactionData[] | null) || []

  // Calculate totals
  let totalIncome = 0
  let totalExpenses = 0
  const expensesByCategory: Record<string, number> = {}

  for (const tx of txList) {
    const category = tx.category
    if (!category) continue

    const amount = Math.abs(tx.amount)
    if (category.type === 'income') {
      totalIncome += amount
    } else if (category.type === 'expense') {
      totalExpenses += amount
      const categoryName = category.name.toLowerCase()
      expensesByCategory[categoryName] = (expensesByCategory[categoryName] || 0) + amount
    }
  }

  const taxableProfit = Math.max(0, totalIncome - totalExpenses)

  // Get use of home
  const { data: useOfHome } = await supabase
    .from('use_of_home')
    .select('annual_allowance')
    .eq('user_id', userId)
    .eq('tax_year', taxYear)
    .single()

  // Get mileage
  const { data: mileage } = await supabase
    .from('mileage_trips')
    .select('miles, deduction')
    .eq('user_id', userId)
    .eq('tax_year', taxYear)

  const mileageList = (mileage as MileageData[] | null) || []
  const totalMiles = mileageList.reduce((sum, m) => sum + (m.miles || 0), 0)
  const mileageAmount = mileageList.reduce((sum, m) => sum + (m.deduction || 0), 0)

  // Check bank connection
  const { data: bankConn } = await supabase
    .from('bank_connections')
    .select('id')
    .eq('user_id', userId)
    .eq('status', 'active')
    .limit(1)

  // Calculate marginal tax rate
  const marginalTaxRate = getMarginalTaxRate(taxableProfit)

  return {
    taxYear,
    totalIncome,
    totalExpenses,
    taxableProfit,
    marginalTaxRate,
    hasUseOfHome: (useOfHome?.annual_allowance || 0) > 0,
    useOfHomeAmount: useOfHome?.annual_allowance || 0,
    hasMileage: totalMiles > 0,
    mileageAmount,
    totalMiles,
    transactionCount: txList.length,
    expensesByCategory,
    bankConnected: (bankConn?.length || 0) > 0,
    businessType: (profile?.user_type as 'sole_trader' | 'landlord' | 'both') || 'sole_trader',
  }
}

/**
 * Get marginal tax rate based on profit
 */
function getMarginalTaxRate(taxableProfit: number): number {
  const personalAllowance = 12570
  const basicRateLimit = 50270
  const higherRateLimit = 125140

  const taxableIncome = Math.max(0, taxableProfit - personalAllowance)

  if (taxableIncome === 0) return 0
  if (taxableProfit <= basicRateLimit) return 0.20
  if (taxableProfit <= higherRateLimit) return 0.40
  return 0.45
}
