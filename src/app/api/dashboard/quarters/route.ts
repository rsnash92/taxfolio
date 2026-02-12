import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAllQuarters } from '@/lib/mtd-utils'

interface QuarterData {
  quarter: number
  start: string
  end: string
  deadline: string
  income: number
  expenses: number
  pending: number
  confirmed: number
  total: number
  submitted: boolean
  submittedAt: string | null
  submissionData: Record<string, unknown> | null
}

/**
 * GET /api/dashboard/quarters?taxYear=2025-26
 * Returns per-quarter transaction aggregates for the dashboard
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
  const quarters = getAllQuarters(taxYear)

  // Fetch all transactions for the tax year
  const { data: transactions } = await supabase
    .from('transactions')
    .select('date, amount, review_status, category:categories!transactions_category_id_fkey(type)')
    .eq('tax_year', taxYear)

  // Fetch submissions for the tax year
  const { data: submissions } = await supabase
    .from('mtd_submissions')
    .select('period_start, period_end, submitted_at, data')
    .eq('tax_year', taxYear)
    .eq('user_id', user.id)

  const result: QuarterData[] = quarters.map((q, idx) => {
    const qTxs = (transactions || []).filter((tx) => {
      const txDate = tx.date
      return txDate >= q.start && txDate <= q.end
    })

    let income = 0
    let expenses = 0
    let pending = 0
    let confirmed = 0

    for (const tx of qTxs) {
      const cat = tx.category as unknown as { type: string } | null
      if (tx.review_status === 'confirmed' && cat) {
        if (cat.type === 'income') income += Math.abs(tx.amount)
        else if (cat.type === 'expense') expenses += Math.abs(tx.amount)
        confirmed++
      } else if (tx.review_status === 'pending') {
        pending++
      }
    }

    // Check if this quarter has been submitted
    const submission = (submissions || []).find(
      (s) => s.period_start === q.start && s.period_end === q.end,
    )

    return {
      quarter: idx + 1,
      start: q.start,
      end: q.end,
      deadline: q.deadline,
      income: Math.round(income * 100) / 100,
      expenses: Math.round(expenses * 100) / 100,
      pending,
      confirmed,
      total: qTxs.length,
      submitted: !!submission,
      submittedAt: submission?.submitted_at || null,
      submissionData: submission?.data || null,
    }
  })

  return NextResponse.json({ quarters: result, taxYear })
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
