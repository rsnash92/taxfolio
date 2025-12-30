import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getQuarterDates, getQuarterStatus, type QuarterStatus } from '@/lib/mtd-utils'

interface CategoryBreakdown {
  code: string
  name: string
  type: string
  hmrc_box: string | null
  amount: number
}

interface QuarterData {
  quarter: number
  label: string
  startDate: string
  endDate: string
  deadline: string
  status: QuarterStatus
  income: number
  expenses: number
  netProfit: number
  transactionCounts: {
    total: number
    pending: number
    confirmed: number
  }
  incomeBreakdown: CategoryBreakdown[]
  expensesBreakdown: CategoryBreakdown[]
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

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const taxYear = searchParams.get('tax_year') || getCurrentTaxYear()

    const quarters: QuarterData[] = []
    let totalReadyQuarters = 0

    for (let q = 1; q <= 4; q++) {
      const quarterDates = getQuarterDates(taxYear, q)

      // Fetch all transactions for this quarter
      const { data: transactions } = await supabase
        .from('transactions')
        .select(`
          amount,
          review_status,
          category:categories!transactions_category_id_fkey(code, name, type, hmrc_box)
        `)
        .eq('user_id', user.id)
        .gte('date', quarterDates.start)
        .lte('date', quarterDates.end)

      // Count by status
      let pendingCount = 0
      let confirmedCount = 0
      let totalIncome = 0
      let totalExpenses = 0

      const incomeByCategory: Record<string, CategoryBreakdown> = {}
      const expensesByCategory: Record<string, CategoryBreakdown> = {}

      for (const tx of transactions || []) {
        if (tx.review_status === 'pending') pendingCount++
        if (tx.review_status === 'confirmed') confirmedCount++

        // Only count confirmed transactions for totals
        if (tx.review_status === 'confirmed' && tx.category) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const rawCategory = tx.category as any
          const category = Array.isArray(rawCategory) ? rawCategory[0] : rawCategory
          if (!category) continue

          const amount = Math.abs(tx.amount)

          if (category.type === 'income') {
            totalIncome += amount
            if (!incomeByCategory[category.code]) {
              incomeByCategory[category.code] = {
                code: category.code,
                name: category.name,
                type: category.type,
                hmrc_box: category.hmrc_box,
                amount: 0,
              }
            }
            incomeByCategory[category.code].amount += amount
          } else if (category.type === 'expense') {
            totalExpenses += amount
            if (!expensesByCategory[category.code]) {
              expensesByCategory[category.code] = {
                code: category.code,
                name: category.name,
                type: category.type,
                hmrc_box: category.hmrc_box,
                amount: 0,
              }
            }
            expensesByCategory[category.code].amount += amount
          }
        }
      }

      const status = getQuarterStatus(quarterDates, pendingCount, confirmedCount)
      if (status === 'ready') totalReadyQuarters++

      quarters.push({
        quarter: q,
        label: quarterDates.label,
        startDate: quarterDates.start,
        endDate: quarterDates.end,
        deadline: quarterDates.deadline,
        status,
        income: Math.round(totalIncome * 100) / 100,
        expenses: Math.round(totalExpenses * 100) / 100,
        netProfit: Math.round((totalIncome - totalExpenses) * 100) / 100,
        transactionCounts: {
          total: (transactions?.length || 0),
          pending: pendingCount,
          confirmed: confirmedCount,
        },
        incomeBreakdown: Object.values(incomeByCategory).map(c => ({
          ...c,
          amount: Math.round(c.amount * 100) / 100,
        })),
        expensesBreakdown: Object.values(expensesByCategory).map(c => ({
          ...c,
          amount: Math.round(c.amount * 100) / 100,
        })),
      })
    }

    // Calculate year totals
    const yearTotals = quarters.reduce(
      (acc, q) => ({
        income: acc.income + q.income,
        expenses: acc.expenses + q.expenses,
        netProfit: acc.netProfit + q.netProfit,
        totalTransactions: acc.totalTransactions + q.transactionCounts.total,
        pendingTransactions: acc.pendingTransactions + q.transactionCounts.pending,
        confirmedTransactions: acc.confirmedTransactions + q.transactionCounts.confirmed,
      }),
      { income: 0, expenses: 0, netProfit: 0, totalTransactions: 0, pendingTransactions: 0, confirmedTransactions: 0 }
    )

    return NextResponse.json({
      tax_year: taxYear,
      quarters,
      summary: {
        readyQuarters: totalReadyQuarters,
        totalQuarters: 4,
        ...yearTotals,
      },
    })
  } catch (error) {
    console.error('Error fetching MTD quarters:', error)
    return NextResponse.json(
      { error: 'Failed to fetch quarterly data' },
      { status: 500 }
    )
  }
}
