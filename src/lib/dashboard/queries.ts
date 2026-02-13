import { createClient } from '@/lib/supabase/server'
import { calculateEstimatedTax } from '@/lib/tax/calculator'
import type {
  DashboardData,
  YtdSummaryData,
  RecentTransactionData,
  NudgeData,
} from '@/types/dashboard'

interface TransactionRow {
  amount: number
  review_status: string
  category: { name: string; type: string } | null
}

interface RecentRow {
  id: string
  date: string
  description: string
  amount: number
  merchant_name: string | null
  review_status: string
  category_id: string | null
  ai_suggested_category_id: string | null
  category: { name: string; type: string } | null
  ai_suggested_category: { name: string; type: string } | null
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
 * Fetch all dashboard data for a user in a single call.
 * Runs server-side only (imports server Supabase client).
 */
export async function getDashboardData(userId: string, taxYearOverride?: string): Promise<DashboardData> {
  const supabase = await createClient()
  const taxYear = taxYearOverride || getCurrentTaxYear()
  const prevTaxYear = getPreviousTaxYear(taxYear)

  // Run queries in parallel
  const [
    transactionsResult,
    prevTransactionsResult,
    recentResult,
    bankResult,
    hmrcResult,
    nudgeResult,
  ] = await Promise.all([
    // YTD: current year confirmed transactions with categories
    supabase
      .from('transactions')
      .select('amount, review_status, category:categories!transactions_category_id_fkey(name, type)')
      .eq('tax_year', taxYear),

    // YTD: previous year for comparison
    supabase
      .from('transactions')
      .select('amount, review_status, category:categories!transactions_category_id_fkey(type)')
      .eq('tax_year', prevTaxYear),

    // Recent transactions (latest 8)
    supabase
      .from('transactions')
      .select('id, date, description, amount, merchant_name, review_status, category_id, ai_suggested_category_id, category:categories!transactions_category_id_fkey(name, type), ai_suggested_category:categories!transactions_ai_suggested_category_id_fkey(name, type)')
      .order('date', { ascending: false })
      .limit(8),

    // Bank connection status
    supabase
      .from('bank_connections')
      .select('id, last_synced_at')
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle(),

    // HMRC connection status
    supabase
      .from('hmrc_tokens')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle(),

    // Nudge: count pending/total for current tax year
    supabase
      .from('transactions')
      .select('id, review_status, ai_suggested_category_id')
      .eq('tax_year', taxYear),
  ])

  // --- YTD Summary ---
  const ytdSummary = computeYtdSummary(
    (transactionsResult.data as TransactionRow[] | null) || [],
    (prevTransactionsResult.data as { amount: number; review_status: string; category: { type: string } | null }[] | null) || [],
  )

  // --- Recent Transactions ---
  const recentTransactions = mapRecentTransactions(
    (recentResult.data as RecentRow[] | null) || [],
  )

  // --- Nudge ---
  const nudge = computeNudge(
    (nudgeResult.data as { id: string; review_status: string; ai_suggested_category_id: string | null }[] | null) || [],
  )

  return {
    ytdSummary,
    recentTransactions,
    nudge,
    hasBankConnection: !!bankResult.data,
    hasHmrcConnection: !!hmrcResult.data,
    lastSyncedAt: bankResult.data?.last_synced_at || null,
  }
}

function computeYtdSummary(
  transactions: TransactionRow[],
  prevTransactions: { amount: number; review_status: string; category: { type: string } | null }[],
): YtdSummaryData {
  let totalIncome = 0
  let totalExpenses = 0

  for (const tx of transactions) {
    if (tx.review_status !== 'confirmed') continue
    const cat = tx.category
    if (!cat) continue

    if (cat.type === 'income') {
      totalIncome += Math.abs(tx.amount)
    } else if (cat.type === 'expense') {
      totalExpenses += Math.abs(tx.amount)
    }
  }

  const { totalTaxDue } = calculateEstimatedTax(totalIncome, totalExpenses)

  // Previous year comparison
  let yoyChange: number | null = null
  let prevTax = 0
  let prevIncome = 0
  let prevExpenses = 0

  for (const tx of prevTransactions) {
    if (tx.review_status !== 'confirmed') continue
    const cat = tx.category
    if (!cat) continue

    if (cat.type === 'income') {
      prevIncome += Math.abs(tx.amount)
    } else if (cat.type === 'expense') {
      prevExpenses += Math.abs(tx.amount)
    }
  }

  if (prevIncome > 0 || prevExpenses > 0) {
    const prev = calculateEstimatedTax(prevIncome, prevExpenses)
    prevTax = prev.totalTaxDue
    yoyChange = totalTaxDue - prevTax
  }

  return {
    totalIncome: Math.round(totalIncome * 100) / 100,
    totalExpenses: Math.round(totalExpenses * 100) / 100,
    estimatedTax: totalTaxDue,
    yoyChange,
  }
}

function mapRecentTransactions(rows: RecentRow[]): RecentTransactionData[] {
  return rows.map((tx) => {
    const isIncome = tx.category?.type === 'income' || tx.amount > 0
    const hasCategory = !!tx.category_id
    const hasSuggestedCategory = !!tx.ai_suggested_category_id

    return {
      id: tx.id,
      merchant: tx.merchant_name || tx.description,
      amount: Math.abs(tx.amount),
      type: isIncome ? 'income' : 'expense',
      category: tx.category?.name || null,
      ai_suggested_category: tx.ai_suggested_category?.name || null,
      status: hasCategory || (hasSuggestedCategory && tx.review_status === 'confirmed')
        ? 'auto'
        : 'needs_review',
      date: tx.date,
    }
  })
}

function computeNudge(
  transactions: { id: string; review_status: string; ai_suggested_category_id: string | null }[],
): NudgeData | null {
  if (transactions.length === 0) return null

  const uncategorisedCount = transactions.filter((t) => t.review_status === 'pending').length
  const aiCategorised = transactions.filter((t) => t.ai_suggested_category_id !== null).length
  const aiCategorisedPercent = transactions.length > 0
    ? Math.round((aiCategorised / transactions.length) * 100)
    : 0

  if (uncategorisedCount === 0) return null

  return {
    uncategorisedCount,
    totalTransactions: transactions.length,
    aiCategorisedPercent,
  }
}
