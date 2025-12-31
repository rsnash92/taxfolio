import { createClient } from '@/lib/supabase/server'
import { CollectedData, MonthlyData, CategoryBreakdown, TransactionRecord } from './types'

/**
 * Collect all data needed for the year-end report
 */
export async function collectYearEndData(
  userId: string,
  taxYear: string,
  includePreviousYear: boolean = true
): Promise<CollectedData> {
  const supabase = await createClient()

  // Get transactions for tax year with categories
  const { data: transactions } = await supabase
    .from('transactions')
    .select(`
      id,
      date,
      description,
      amount,
      review_status,
      category:categories!transactions_category_id_fkey(code, name, type)
    `)
    .eq('user_id', userId)
    .eq('tax_year', taxYear)
    .eq('review_status', 'confirmed')
    .eq('is_personal', false)
    .order('date', { ascending: true })

  // Transform transactions
  const txList: TransactionRecord[] = (transactions || []).map(tx => ({
    id: tx.id,
    date: tx.date,
    description: tx.description,
    amount: Math.abs(tx.amount),
    type: (tx.category as { type?: string })?.type === 'income' ? 'income' : 'expense',
    category: (tx.category as { name?: string })?.name || 'Uncategorised',
    review_status: tx.review_status,
  }))

  // Get mileage trips
  const { data: mileageTrips } = await supabase
    .from('mileage_trips')
    .select('id, date, miles, deduction, purpose')
    .eq('user_id', userId)
    .eq('tax_year', taxYear)

  // Get use of home
  const { data: useOfHome } = await supabase
    .from('use_of_home')
    .select('annual_allowance, method')
    .eq('user_id', userId)
    .eq('tax_year', taxYear)
    .single()

  // Get previous year data for comparison
  let previousYearData: CollectedData | null = null

  if (includePreviousYear) {
    const previousTaxYear = getPreviousTaxYear(taxYear)

    const { data: prevTransactions } = await supabase
      .from('transactions')
      .select(`
        id,
        date,
        description,
        amount,
        review_status,
        category:categories!transactions_category_id_fkey(code, name, type)
      `)
      .eq('user_id', userId)
      .eq('tax_year', previousTaxYear)
      .eq('review_status', 'confirmed')
      .eq('is_personal', false)

    if (prevTransactions && prevTransactions.length > 0) {
      const prevTxList: TransactionRecord[] = prevTransactions.map(tx => ({
        id: tx.id,
        date: tx.date,
        description: tx.description,
        amount: Math.abs(tx.amount),
        type: (tx.category as { type?: string })?.type === 'income' ? 'income' : 'expense',
        category: (tx.category as { name?: string })?.name || 'Uncategorised',
        review_status: tx.review_status,
      }))

      const { data: prevMileage } = await supabase
        .from('mileage_trips')
        .select('id, date, miles, deduction, purpose')
        .eq('user_id', userId)
        .eq('tax_year', previousTaxYear)

      const { data: prevUseOfHome } = await supabase
        .from('use_of_home')
        .select('annual_allowance, method')
        .eq('user_id', userId)
        .eq('tax_year', previousTaxYear)
        .single()

      previousYearData = {
        taxYear: previousTaxYear,
        transactions: prevTxList,
        mileageTrips: (prevMileage || []).map(m => ({
          id: m.id,
          date: m.date,
          miles: m.miles,
          deduction: m.deduction,
          purpose: m.purpose,
        })),
        useOfHome: prevUseOfHome ? {
          annual_allowance: prevUseOfHome.annual_allowance,
          method: prevUseOfHome.method,
        } : null,
        previousYearData: null,
      }
    }
  }

  return {
    taxYear,
    transactions: txList,
    mileageTrips: (mileageTrips || []).map(m => ({
      id: m.id,
      date: m.date,
      miles: m.miles,
      deduction: m.deduction,
      purpose: m.purpose,
    })),
    useOfHome: useOfHome ? {
      annual_allowance: useOfHome.annual_allowance,
      method: useOfHome.method,
    } : null,
    previousYearData,
  }
}

/**
 * Get the previous tax year
 */
function getPreviousTaxYear(taxYear: string): string {
  const [startYear] = taxYear.split('-').map(Number)
  return `${startYear - 1}-${startYear.toString().slice(-2)}`
}

/**
 * Group transactions by month (tax year order: Apr-Mar)
 */
export function groupByMonth(transactions: TransactionRecord[], taxYear: string): MonthlyData[] {
  const [startYear] = taxYear.split('-').map(Number)

  // Initialize all 12 months with correct year
  const monthData: Record<string, { income: number; expenses: number }> = {}

  // Apr-Dec of start year
  for (let m = 4; m <= 12; m++) {
    const key = `${startYear}-${m.toString().padStart(2, '0')}`
    monthData[key] = { income: 0, expenses: 0 }
  }
  // Jan-Mar of end year
  for (let m = 1; m <= 3; m++) {
    const key = `${startYear + 1}-${m.toString().padStart(2, '0')}`
    monthData[key] = { income: 0, expenses: 0 }
  }

  // Populate with data
  transactions.forEach(tx => {
    const month = tx.date.substring(0, 7) // YYYY-MM
    if (monthData[month]) {
      if (tx.type === 'income') {
        monthData[month].income += tx.amount
      } else {
        monthData[month].expenses += tx.amount
      }
    }
  })

  // Convert to array in tax year order
  const monthNames = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar']
  const result: MonthlyData[] = []

  // Apr-Dec
  for (let m = 4; m <= 12; m++) {
    const key = `${startYear}-${m.toString().padStart(2, '0')}`
    const data = monthData[key] || { income: 0, expenses: 0 }
    result.push({
      month: key,
      monthName: monthNames[m - 4],
      income: Math.round(data.income * 100) / 100,
      expenses: Math.round(data.expenses * 100) / 100,
      profit: Math.round((data.income - data.expenses) * 100) / 100,
    })
  }
  // Jan-Mar
  for (let m = 1; m <= 3; m++) {
    const key = `${startYear + 1}-${m.toString().padStart(2, '0')}`
    const data = monthData[key] || { income: 0, expenses: 0 }
    result.push({
      month: key,
      monthName: monthNames[m + 8],
      income: Math.round(data.income * 100) / 100,
      expenses: Math.round(data.expenses * 100) / 100,
      profit: Math.round((data.income - data.expenses) * 100) / 100,
    })
  }

  return result
}

/**
 * Group transactions by category
 */
export function groupByCategory(
  transactions: TransactionRecord[],
  type: 'income' | 'expense'
): CategoryBreakdown[] {
  const filtered = transactions.filter(t => t.type === type)
  const total = filtered.reduce((sum, t) => sum + t.amount, 0)

  const categories: Record<string, { amount: number; count: number }> = {}

  filtered.forEach(tx => {
    const category = tx.category || 'Uncategorised'
    if (!categories[category]) {
      categories[category] = { amount: 0, count: 0 }
    }
    categories[category].amount += tx.amount
    categories[category].count += 1
  })

  return Object.entries(categories)
    .map(([category, data]) => ({
      category,
      amount: Math.round(data.amount * 100) / 100,
      percentage: total > 0 ? Math.round((data.amount / total) * 100) : 0,
      count: data.count,
    }))
    .sort((a, b) => b.amount - a.amount)
}
