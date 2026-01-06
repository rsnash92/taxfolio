import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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

// UK 2024-25 Tax rates
const PERSONAL_ALLOWANCE = 12570
const BASIC_RATE_LIMIT = 37700

function calculateIncomeTax(taxableIncome: number): number {
  if (taxableIncome <= 0) return 0

  let tax = 0
  let remaining = taxableIncome

  let personalAllowance = PERSONAL_ALLOWANCE
  if (taxableIncome > 100000) {
    personalAllowance = Math.max(0, PERSONAL_ALLOWANCE - (taxableIncome - 100000) / 2)
  }

  remaining = Math.max(0, taxableIncome - personalAllowance)

  const basicRateAmount = Math.min(remaining, BASIC_RATE_LIMIT)
  tax += basicRateAmount * 0.20
  remaining -= basicRateAmount

  const higherRateAmount = Math.min(remaining, 125140 - BASIC_RATE_LIMIT - personalAllowance)
  tax += Math.max(0, higherRateAmount) * 0.40
  remaining -= Math.max(0, higherRateAmount)

  if (remaining > 0) {
    tax += remaining * 0.45
  }

  return Math.round(tax * 100) / 100
}

function calculateNI(profit: number): number {
  let ni = 0

  // Class 2: £3.45/week if profits > £12,570
  if (profit > 12570) {
    ni += 3.45 * 52
  }

  // Class 4: 6% on £12,570-£50,270, 2% above
  if (profit > 12570) {
    const lowerBand = Math.min(profit - 12570, 50270 - 12570)
    ni += lowerBand * 0.06

    if (profit > 50270) {
      ni += (profit - 50270) * 0.02
    }
  }

  return Math.round(ni * 100) / 100
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

    // Fetch all transactions for the user in this tax year
    const { data: transactions } = await supabase
      .from('transactions')
      .select(`
        amount,
        review_status,
        category:categories!transactions_category_id_fkey(type)
      `)
      .eq('user_id', user.id)
      .eq('tax_year', taxYear)

    let totalIncome = 0
    let totalExpenses = 0
    let pendingCount = 0
    let confirmedCount = 0

    for (const tx of transactions || []) {
      if (tx.review_status === 'pending') pendingCount++
      if (tx.review_status === 'confirmed') confirmedCount++

      // Count confirmed transactions for totals
      if (tx.review_status === 'confirmed' && tx.category) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const category = (tx.category as any)
        const cat = Array.isArray(category) ? category[0] : category

        if (cat?.type === 'income') {
          totalIncome += Math.abs(tx.amount)
        } else if (cat?.type === 'expense') {
          totalExpenses += Math.abs(tx.amount)
        }
      }
    }

    const netProfit = totalIncome - totalExpenses
    const incomeTax = calculateIncomeTax(netProfit)
    const ni = calculateNI(netProfit)
    const estimatedTax = incomeTax + ni

    return NextResponse.json({
      tax_year: taxYear,
      income: Math.round(totalIncome * 100) / 100,
      expenses: Math.round(totalExpenses * 100) / 100,
      profit: Math.round(netProfit * 100) / 100,
      estimated_tax: Math.round(estimatedTax * 100) / 100,
      income_tax: incomeTax,
      national_insurance: Math.round(ni * 100) / 100,
      pending_count: pendingCount,
      confirmed_count: confirmedCount,
      total_transactions: transactions?.length || 0,
    })
  } catch (error) {
    console.error('Error fetching onboarding summary:', error)
    return NextResponse.json(
      { error: 'Failed to fetch summary' },
      { status: 500 }
    )
  }
}
