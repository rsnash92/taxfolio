import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { calculateEstimatedTax } from '@/lib/tax/calculator'
import { getCategoryLabel } from '@/lib/category-labels'

interface TransactionRow {
  id: string
  date: string
  amount: number
  description: string
  merchant_name: string | null
  review_status: string
  category: { code: string; name: string; type: string } | null
}

function getCurrentTaxYear(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const day = now.getDate()
  if (month > 4 || (month === 4 && day >= 6)) {
    return `${year}-${(year + 1).toString().slice(-2)}`
  }
  return `${year - 1}-${year.toString().slice(-2)}`
}

function getPreviousTaxYear(taxYear: string): string {
  const startYear = parseInt(taxYear.split('-')[0])
  return `${startYear - 1}-${startYear.toString().slice(-2)}`
}

/**
 * GET /api/insights/summary
 * Returns all computed insights for the insights page
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const taxYear = request.nextUrl.searchParams.get('taxYear') || getCurrentTaxYear()
  const prevTaxYear = getPreviousTaxYear(taxYear)

  // Fetch current and previous year transactions in parallel
  const [currentResult, prevResult, bankResult, hmrcResult] = await Promise.all([
    supabase
      .from('transactions')
      .select('id, date, amount, description, merchant_name, review_status, category:categories!transactions_category_id_fkey(code, name, type)')
      .eq('tax_year', taxYear),
    supabase
      .from('transactions')
      .select('amount, review_status, category:categories!transactions_category_id_fkey(code, type)')
      .eq('tax_year', prevTaxYear),
    supabase
      .from('bank_connections')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle(),
    supabase
      .from('hmrc_tokens')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle(),
  ])

  const transactions = (currentResult.data as unknown as TransactionRow[]) || []
  const prevTransactions = (prevResult.data as unknown as { amount: number; review_status: string; category: { code: string; type: string } | null }[]) || []

  // --- Tax Summary ---
  let totalIncome = 0
  let totalExpenses = 0
  for (const tx of transactions) {
    if (tx.review_status !== 'confirmed') continue
    const cat = tx.category
    if (!cat) continue
    if (cat.type === 'income') totalIncome += Math.abs(tx.amount)
    else if (cat.type === 'expense') totalExpenses += Math.abs(tx.amount)
  }

  const taxBreakdown = calculateEstimatedTax(totalIncome, totalExpenses)

  // Previous year for comparison
  let prevIncome = 0
  let prevExpenses = 0
  for (const tx of prevTransactions) {
    if (tx.review_status !== 'confirmed') continue
    const cat = tx.category
    if (!cat) continue
    if (cat.type === 'income') prevIncome += Math.abs(tx.amount)
    else if (cat.type === 'expense') prevExpenses += Math.abs(tx.amount)
  }
  const prevTaxBreakdown = (prevIncome > 0 || prevExpenses > 0)
    ? calculateEstimatedTax(prevIncome, prevExpenses)
    : null

  // --- Category Breakdown ---
  const categoryBreakdown: Record<string, { code: string; label: string; type: string; amount: number; count: number }> = {}
  for (const tx of transactions) {
    if (tx.review_status !== 'confirmed') continue
    const cat = tx.category
    if (!cat || cat.type === 'personal') continue
    if (!categoryBreakdown[cat.code]) {
      categoryBreakdown[cat.code] = {
        code: cat.code,
        label: getCategoryLabel(cat.code),
        type: cat.type,
        amount: 0,
        count: 0,
      }
    }
    categoryBreakdown[cat.code].amount += Math.abs(tx.amount)
    categoryBreakdown[cat.code].count++
  }

  const expenseCategories = Object.values(categoryBreakdown)
    .filter((c) => c.type === 'expense')
    .sort((a, b) => b.amount - a.amount)

  const incomeCategories = Object.values(categoryBreakdown)
    .filter((c) => c.type === 'income')
    .sort((a, b) => b.amount - a.amount)

  // --- Monthly Trends ---
  const startYear = parseInt(taxYear.split('-')[0])
  const monthlyData: { month: string; income: number; expenses: number }[] = []
  const monthNames = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar']

  for (let i = 0; i < 12; i++) {
    const mIdx = (3 + i) % 12 // April=3, May=4, ..., March=2
    const year = mIdx >= 3 ? startYear : startYear + 1
    monthlyData.push({ month: `${monthNames[i]} ${year.toString().slice(-2)}`, income: 0, expenses: 0 })
  }

  for (const tx of transactions) {
    if (tx.review_status !== 'confirmed') continue
    const cat = tx.category
    if (!cat || cat.type === 'personal') continue

    const d = new Date(tx.date)
    const m = d.getMonth() // 0-indexed
    // Map calendar month to tax year month index (Apr=0, May=1, ..., Mar=11)
    const taxMonthIdx = m >= 3 ? m - 3 : m + 9

    if (taxMonthIdx >= 0 && taxMonthIdx < 12) {
      if (cat.type === 'income') monthlyData[taxMonthIdx].income += Math.abs(tx.amount)
      else if (cat.type === 'expense') monthlyData[taxMonthIdx].expenses += Math.abs(tx.amount)
    }
  }

  // --- Business vs Personal ---
  let businessCount = 0, personalCount = 0
  let businessAmount = 0, personalAmount = 0

  for (const tx of transactions) {
    const cat = tx.category
    if (tx.review_status === 'confirmed' && cat) {
      if (cat.code === 'personal' || cat.code === 'transfer') {
        personalCount++
        personalAmount += Math.abs(tx.amount)
      } else {
        businessCount++
        businessAmount += Math.abs(tx.amount)
      }
    }
  }

  // --- Anomalies ---
  const anomalies: { type: string; description: string; transactionId?: string; amount?: number }[] = []

  // Large transactions (> 3x category average)
  const catAverages: Record<string, { total: number; count: number }> = {}
  for (const tx of transactions) {
    if (tx.review_status !== 'confirmed' || !tx.category) continue
    const code = tx.category.code
    if (!catAverages[code]) catAverages[code] = { total: 0, count: 0 }
    catAverages[code].total += Math.abs(tx.amount)
    catAverages[code].count++
  }

  for (const tx of transactions) {
    if (tx.review_status !== 'confirmed' || !tx.category) continue
    const avg = catAverages[tx.category.code]
    if (!avg || avg.count < 3) continue
    const mean = avg.total / avg.count
    const amt = Math.abs(tx.amount)
    if (amt > mean * 3 && amt > 50) {
      anomalies.push({
        type: 'large_transaction',
        description: `£${amt.toFixed(2)} to ${tx.merchant_name || tx.description} is ${Math.round(amt / mean)}x your average ${getCategoryLabel(tx.category.code)} transaction`,
        transactionId: tx.id,
        amount: amt,
      })
    }
  }

  // Uncategorised high-value
  for (const tx of transactions) {
    if (tx.review_status === 'confirmed') continue
    const amt = Math.abs(tx.amount)
    if (amt > 100) {
      anomalies.push({
        type: 'uncategorised_high_value',
        description: `£${amt.toFixed(2)} payment${tx.merchant_name ? ` to ${tx.merchant_name}` : ''} not categorised — could this be a business expense?`,
        transactionId: tx.id,
        amount: amt,
      })
    }
  }

  // Limit anomalies
  anomalies.sort((a, b) => (b.amount || 0) - (a.amount || 0))
  const topAnomalies = anomalies.slice(0, 5)

  // --- MTD Readiness ---
  // Current quarter
  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentDay = now.getDate()
  let currentQuarter = 1
  if (currentMonth > 1 && currentMonth < 4) currentQuarter = 4
  else if (currentMonth === 1 && currentDay > 5) currentQuarter = 4
  else if (currentMonth >= 4 && currentMonth < 7) currentQuarter = 1
  else if (currentMonth === 4 && currentDay < 6) currentQuarter = 4
  else if (currentMonth >= 7 && currentMonth < 10) currentQuarter = 2
  else if (currentMonth >= 10) currentQuarter = 3

  const confirmedThisYear = transactions.filter((t) => t.review_status === 'confirmed').length
  const totalThisYear = transactions.length
  const categorisationScore = totalThisYear > 0 ? confirmedThisYear / totalThisYear : 0
  const hmrcConnected = !!hmrcResult.data
  const bankConnected = !!bankResult.data

  const readinessScore = Math.round(
    (categorisationScore * 70) + (hmrcConnected ? 15 : 0) + (bankConnected ? 15 : 0)
  )

  const personalAllowance = 12570
  const taxableAfterAllowance = Math.max(0, taxBreakdown.taxableProfit - personalAllowance)

  return NextResponse.json({
    taxYear,
    tax: {
      totalIncome: Math.round(totalIncome * 100) / 100,
      totalExpenses: Math.round(totalExpenses * 100) / 100,
      taxableProfit: taxBreakdown.taxableProfit,
      personalAllowance,
      taxableAfterAllowance,
      incomeTax: taxBreakdown.incomeTax,
      class2NIC: taxBreakdown.class2NI,
      class4NIC: taxBreakdown.class4NI,
      totalTaxDue: taxBreakdown.totalTaxDue,
      effectiveRate: taxBreakdown.effectiveTaxRate,
      prevYearTax: prevTaxBreakdown?.totalTaxDue ?? null,
      prevYearIncome: prevIncome > 0 ? Math.round(prevIncome * 100) / 100 : null,
    },
    expenseCategories,
    incomeCategories,
    monthlyTrends: monthlyData,
    businessVsPersonal: {
      businessCount,
      personalCount,
      businessAmount: Math.round(businessAmount * 100) / 100,
      personalAmount: Math.round(personalAmount * 100) / 100,
    },
    anomalies: topAnomalies,
    readiness: {
      score: readinessScore,
      currentQuarter,
      categorised: confirmedThisYear,
      total: totalThisYear,
      hmrcConnected,
      bankConnected,
    },
    hasData: transactions.length > 0,
  })
}
