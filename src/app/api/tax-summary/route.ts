import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { calculateMileageAllowance } from '@/lib/mileage'
import type { MileageTrip } from '@/types/database'

// UK 2024-25 Tax rates
const PERSONAL_ALLOWANCE = 12570
const BASIC_RATE_LIMIT = 37700
const HIGHER_RATE_LIMIT = 125140

// Calculate Income Tax
function calculateIncomeTax(taxableIncome: number): number {
  if (taxableIncome <= 0) return 0

  let tax = 0
  let remaining = taxableIncome

  // Personal allowance reduction for high earners
  let personalAllowance = PERSONAL_ALLOWANCE
  if (taxableIncome > 100000) {
    personalAllowance = Math.max(0, PERSONAL_ALLOWANCE - (taxableIncome - 100000) / 2)
  }

  remaining = Math.max(0, taxableIncome - personalAllowance)

  // Basic rate (20%)
  const basicRateAmount = Math.min(remaining, BASIC_RATE_LIMIT)
  tax += basicRateAmount * 0.20
  remaining -= basicRateAmount

  // Higher rate (40%)
  const higherRateAmount = Math.min(remaining, HIGHER_RATE_LIMIT - BASIC_RATE_LIMIT - personalAllowance)
  tax += Math.max(0, higherRateAmount) * 0.40
  remaining -= Math.max(0, higherRateAmount)

  // Additional rate (45%)
  if (remaining > 0) {
    tax += remaining * 0.45
  }

  return Math.round(tax * 100) / 100
}

// Calculate National Insurance
function calculateNI(profit: number): { class2: number; class4: number } {
  // Class 2 NI: £3.45/week if profits > £12,570
  const class2 = profit > 12570 ? 3.45 * 52 : 0

  // Class 4 NI: 6% on £12,570-£50,270, 2% above
  let class4 = 0
  if (profit > 12570) {
    const lowerBand = Math.min(profit - 12570, 50270 - 12570)
    class4 += lowerBand * 0.06

    if (profit > 50270) {
      class4 += (profit - 50270) * 0.02
    }
  }

  return {
    class2: Math.round(class2 * 100) / 100,
    class4: Math.round(class4 * 100) / 100,
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const taxYear = searchParams.get('tax_year') || getCurrentTaxYear()

    // Fetch confirmed transactions with categories
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select(`
        amount,
        category:categories!transactions_category_id_fkey(code, name, type, hmrc_box)
      `)
      .eq('user_id', user.id)
      .eq('tax_year', taxYear)
      .eq('review_status', 'confirmed')

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Calculate totals by category
    interface CategoryTotal {
      name: string
      code: string
      hmrc_box: string | null
      amount: number
    }

    const incomeByCategory: Record<string, CategoryTotal> = {}
    const expensesByCategory: Record<string, CategoryTotal> = {}
    let totalIncome = 0
    let totalExpenses = 0

    for (const tx of transactions || []) {
      if (!tx.category) continue

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rawCategory = tx.category as any
      const category = (Array.isArray(rawCategory) ? rawCategory[0] : rawCategory) as { code: string; name: string; type: string; hmrc_box: string | null }
      if (!category) continue
      const amount = Math.abs(tx.amount)

      if (category.type === 'income') {
        // Income (negative amounts in Plaid)
        if (!incomeByCategory[category.code]) {
          incomeByCategory[category.code] = {
            name: category.name,
            code: category.code,
            hmrc_box: category.hmrc_box,
            amount: 0,
          }
        }
        incomeByCategory[category.code].amount += amount
        totalIncome += amount
      } else if (category.type === 'expense') {
        // Expenses (positive amounts in Plaid)
        if (!expensesByCategory[category.code]) {
          expensesByCategory[category.code] = {
            name: category.name,
            code: category.code,
            hmrc_box: category.hmrc_box,
            amount: 0,
          }
        }
        expensesByCategory[category.code].amount += amount
        totalExpenses += amount
      }
    }

    // Fetch mileage trips for this tax year
    const { data: mileageTrips } = await supabase
      .from('mileage_trips')
      .select('*')
      .eq('user_id', user.id)
      .eq('tax_year', taxYear)

    // Calculate mileage allowance
    const mileageSummary = calculateMileageAllowance((mileageTrips || []) as MileageTrip[])
    const mileageAllowance = mileageSummary.totalAllowance

    // Fetch use of home deduction
    const { data: useOfHome } = await supabase
      .from('use_of_home')
      .select('final_amount, calculation_method')
      .eq('user_id', user.id)
      .eq('tax_year', taxYear)
      .single()

    const homeOfficeDeduction = useOfHome?.final_amount || 0

    // Add mileage allowance and home office to expenses
    const totalExpensesWithMileage = totalExpenses + mileageAllowance + homeOfficeDeduction

    const netProfit = totalIncome - totalExpensesWithMileage
    const incomeTax = calculateIncomeTax(netProfit)
    const { class2, class4 } = calculateNI(netProfit)

    // Fetch property finance costs for Section 24 tax credit
    const { data: financeCosts } = await supabase
      .from('property_finance_costs')
      .select('mortgage_interest, other_finance_costs')
      .eq('user_id', user.id)
      .eq('tax_year', taxYear)

    // Calculate Section 24 tax credit (20% of finance costs)
    const totalFinanceCosts = (financeCosts || []).reduce((sum, fc) => {
      return sum + (fc.mortgage_interest || 0) + (fc.other_finance_costs || 0)
    }, 0)
    const section24Credit = totalFinanceCosts * 0.2

    // Get transaction counts
    const { count: totalCount } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('tax_year', taxYear)

    const { count: pendingCount } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('tax_year', taxYear)
      .eq('review_status', 'pending')

    const { count: confirmedCount } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('tax_year', taxYear)
      .eq('review_status', 'confirmed')

    // Get personal category ID for counting excluded transactions
    const { data: personalCategory } = await supabase
      .from('categories')
      .select('id')
      .eq('code', 'personal')
      .single()

    const { count: personalCount } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('tax_year', taxYear)
      .eq('review_status', 'confirmed')
      .eq('category_id', personalCategory?.id || '')

    // Add mileage to expenses breakdown if there's any
    const expensesBreakdown = Object.values(expensesByCategory).map(c => ({
      ...c,
      amount: Math.round(c.amount * 100) / 100,
    }))

    if (mileageAllowance > 0) {
      expensesBreakdown.push({
        name: 'Mileage Allowance',
        code: 'expense_mileage',
        hmrc_box: 'SA103 Box 20',
        amount: Math.round(mileageAllowance * 100) / 100,
      })
    }

    if (homeOfficeDeduction > 0) {
      expensesBreakdown.push({
        name: `Use of Home (${useOfHome?.calculation_method === 'actual' ? 'Actual Costs' : 'Simplified'})`,
        code: 'expense_home_office',
        hmrc_box: 'SA103 Box 20',
        amount: Math.round(homeOfficeDeduction * 100) / 100,
      })
    }

    // Calculate final tax after Section 24 credit
    const incomeTaxAfterCredit = Math.max(0, incomeTax - section24Credit)
    const totalTax = Math.round((incomeTaxAfterCredit + class2 + class4) * 100) / 100

    return NextResponse.json({
      tax_year: taxYear,
      summary: {
        total_income: Math.round(totalIncome * 100) / 100,
        total_expenses: Math.round(totalExpensesWithMileage * 100) / 100,
        net_profit: Math.round(netProfit * 100) / 100,
        income_tax: incomeTax,
        section24_credit: Math.round(section24Credit * 100) / 100,
        income_tax_after_credit: Math.round(incomeTaxAfterCredit * 100) / 100,
        class2_ni: class2,
        class4_ni: class4,
        total_tax: totalTax,
      },
      income_breakdown: Object.values(incomeByCategory).map(c => ({
        ...c,
        amount: Math.round(c.amount * 100) / 100,
      })),
      expenses_breakdown: expensesBreakdown,
      mileage: {
        total_miles: mileageSummary.totalMiles,
        total_allowance: Math.round(mileageAllowance * 100) / 100,
        trip_count: mileageSummary.tripCount,
      },
      home_office: {
        deduction: Math.round(homeOfficeDeduction * 100) / 100,
        method: useOfHome?.calculation_method || null,
      },
      transaction_counts: {
        total: totalCount || 0,
        pending: pendingCount || 0,
        confirmed: confirmedCount || 0,
        personal_excluded: personalCount || 0,
        reviewed_percentage: totalCount
          ? Math.round(((confirmedCount || 0) / totalCount) * 100)
          : 0,
      },
    })
  } catch {
    return NextResponse.json(
      { error: 'Failed to calculate tax summary' },
      { status: 500 }
    )
  }
}

function getCurrentTaxYear(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const day = now.getDate()

  if (month > 4 || (month === 4 && day >= 6)) {
    return `${year}-${(year + 1).toString().slice(-2)}`
  } else {
    return `${year - 1}-${year.toString().slice(-2)}`
  }
}
