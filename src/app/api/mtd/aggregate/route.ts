import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  CATEGORY_CODE_TO_HMRC_EXPENSE,
  CATEGORY_CODE_TO_HMRC_INCOME,
} from '@/lib/category-labels'

export interface TransactionSummary {
  id: string
  date: string
  description: string
  merchantName: string | null
  amount: number
  categoryCode: string
  categoryName: string
}

export interface AggregatedBucket {
  income: { turnover: number; other: number }
  expenses: Record<string, number>
  transactionsByHmrcField: Record<string, TransactionSummary[]>
}

export interface AggregateResponse {
  thisQuarter: AggregatedBucket
  cumulative: AggregatedBucket
  totals: {
    thisQuarterIncome: number
    thisQuarterExpenses: number
    cumulativeIncome: number
    cumulativeExpenses: number
  }
  warnings: {
    uncategorisedCount: number
    unconfirmedAiCount: number
    personalCount: number
  }
  previousSubmission: {
    submittedAt: string
    correlationId?: string
    data: Record<string, unknown>
  } | null
  turnover: number
}

function createEmptyBucket(): AggregatedBucket {
  return {
    income: { turnover: 0, other: 0 },
    expenses: {},
    transactionsByHmrcField: {},
  }
}

function addTransaction(
  bucket: AggregatedBucket,
  tx: TransactionSummary,
  categoryCode: string
) {
  // Check if it's an income or expense category
  const incomeField = CATEGORY_CODE_TO_HMRC_INCOME[categoryCode]
  const expenseField = CATEGORY_CODE_TO_HMRC_EXPENSE[categoryCode]

  if (incomeField) {
    // Income: positive amounts are income
    const amount = Math.abs(tx.amount)
    if (incomeField === 'turnover') {
      bucket.income.turnover += amount
    } else {
      bucket.income.other += amount
    }
    const field = incomeField
    if (!bucket.transactionsByHmrcField[field]) {
      bucket.transactionsByHmrcField[field] = []
    }
    bucket.transactionsByHmrcField[field].push(tx)
  } else if (expenseField) {
    // Expenses: negative amounts are expenses, use absolute value
    const amount = Math.abs(tx.amount)
    bucket.expenses[expenseField] = (bucket.expenses[expenseField] || 0) + amount
    if (!bucket.transactionsByHmrcField[expenseField]) {
      bucket.transactionsByHmrcField[expenseField] = []
    }
    bucket.transactionsByHmrcField[expenseField].push(tx)
  }
}

/**
 * GET /api/mtd/aggregate
 * Aggregate categorised transactions into HMRC boxes for quarterly review
 * Query params: businessType, periodStart, periodEnd, taxYear
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const periodStart = searchParams.get('periodStart')
    const periodEnd = searchParams.get('periodEnd')
    const taxYear = searchParams.get('taxYear')

    if (!periodStart || !periodEnd || !taxYear) {
      return NextResponse.json(
        { error: 'periodStart, periodEnd, and taxYear are required' },
        { status: 400 }
      )
    }

    // Determine tax year start (e.g., 2025-26 → 2025-04-06)
    const yearStart = parseInt(taxYear.split('-')[0])
    const taxYearStartDate = `${yearStart}-04-06`

    // Fetch all transactions from tax year start through period end
    // with category joins
    const { data: transactions, error: txError } = await supabase
      .from('transactions')
      .select(`
        id,
        date,
        description,
        merchant_name,
        amount,
        category_id,
        ai_suggested_category_id,
        ai_confidence,
        review_status,
        category:categories!category_id(code, name, type)
      `)
      .eq('user_id', user.id)
      .gte('date', taxYearStartDate)
      .lte('date', periodEnd)
      .order('date', { ascending: true })

    if (txError) {
      console.error('Aggregate fetch error:', txError)
      return NextResponse.json(
        { error: 'Failed to fetch transactions' },
        { status: 500 }
      )
    }

    // Compute warnings from ALL transactions in the date range
    let uncategorisedCount = 0
    let unconfirmedAiCount = 0
    let personalCount = 0

    const thisQuarter = createEmptyBucket()
    const cumulative = createEmptyBucket()

    for (const tx of transactions || []) {
      const cat = tx.category as unknown as { code: string; name: string; type: string } | null

      // Count warnings
      if (!tx.category_id) {
        uncategorisedCount++
        continue
      }

      if (!cat) continue

      // Skip personal, transfer, and unknown categories
      if (cat.type === 'personal' || cat.type === 'transfer' || cat.type === 'unknown') {
        if (cat.type === 'personal') personalCount++
        continue
      }

      // Count unconfirmed AI suggestions
      if (tx.ai_suggested_category_id && tx.review_status !== 'confirmed') {
        unconfirmedAiCount++
      }

      const summary: TransactionSummary = {
        id: tx.id,
        date: tx.date,
        description: tx.description,
        merchantName: tx.merchant_name,
        amount: tx.amount,
        categoryCode: cat.code,
        categoryName: cat.name,
      }

      // Always add to cumulative
      addTransaction(cumulative, summary, cat.code)

      // Add to thisQuarter if within the quarter dates
      if (tx.date >= periodStart && tx.date <= periodEnd) {
        addTransaction(thisQuarter, summary, cat.code)
      }
    }

    // Calculate totals
    const thisQuarterIncome = thisQuarter.income.turnover + thisQuarter.income.other
    const thisQuarterExpenses = Object.values(thisQuarter.expenses).reduce((s, v) => s + v, 0)
    const cumulativeIncome = cumulative.income.turnover + cumulative.income.other
    const cumulativeExpenses = Object.values(cumulative.expenses).reduce((s, v) => s + v, 0)

    // Check for previous submission
    const { data: prevSubmission } = await supabase
      .from('mtd_submissions')
      .select('submitted_at, data')
      .eq('user_id', user.id)
      .eq('business_type', 'self-employment')
      .eq('tax_year', taxYear)
      .eq('period_start', periodStart)
      .eq('period_end', periodEnd)
      .order('submitted_at', { ascending: false })
      .limit(1)
      .single()

    const previousSubmission = prevSubmission
      ? {
          submittedAt: prevSubmission.submitted_at,
          correlationId: (prevSubmission.data as Record<string, unknown>)?.correlationId as string | undefined,
          data: prevSubmission.data as Record<string, unknown>,
        }
      : null

    // Round all monetary values to 2 decimal places
    const round = (n: number) => Math.round(n * 100) / 100

    thisQuarter.income.turnover = round(thisQuarter.income.turnover)
    thisQuarter.income.other = round(thisQuarter.income.other)
    for (const key of Object.keys(thisQuarter.expenses)) {
      thisQuarter.expenses[key] = round(thisQuarter.expenses[key])
    }
    cumulative.income.turnover = round(cumulative.income.turnover)
    cumulative.income.other = round(cumulative.income.other)
    for (const key of Object.keys(cumulative.expenses)) {
      cumulative.expenses[key] = round(cumulative.expenses[key])
    }

    const response: AggregateResponse = {
      thisQuarter,
      cumulative,
      totals: {
        thisQuarterIncome: round(thisQuarterIncome),
        thisQuarterExpenses: round(thisQuarterExpenses),
        cumulativeIncome: round(cumulativeIncome),
        cumulativeExpenses: round(cumulativeExpenses),
      },
      warnings: {
        uncategorisedCount,
        unconfirmedAiCount,
        personalCount,
      },
      previousSubmission,
      turnover: round(cumulative.income.turnover),
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Aggregate error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to aggregate transactions' },
      { status: 500 }
    )
  }
}
