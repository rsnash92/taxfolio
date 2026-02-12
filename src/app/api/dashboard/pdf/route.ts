import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateDashboardPDF, DashboardReportData } from '@/lib/pdf/dashboard-report'
import { calculateEstimatedTax } from '@/lib/tax/calculator'

interface TransactionData {
  amount: number
  review_status: string
  category: { code: string; name: string; type: string } | null
}

interface PrevTransactionData {
  amount: number
  review_status: string
  category: { type: string } | null
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
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const taxYear = request.nextUrl.searchParams.get('taxYear') || getCurrentTaxYear()

  try {
    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single()

    // Get transactions with categories
    const { data: transactions } = await supabase
      .from('transactions')
      .select(`
        amount,
        review_status,
        category:categories!transactions_category_id_fkey(code, name, type)
      `)
      .eq('tax_year', taxYear)

    // Calculate totals from confirmed transactions
    const txs = transactions as TransactionData[] | null
    let totalIncome = 0
    let totalExpenses = 0
    const expensesByCategory: Record<string, number> = {}

    for (const tx of txs || []) {
      if (tx.review_status !== 'confirmed') continue
      const category = tx.category
      if (!category) continue

      if (category.type === 'income') {
        totalIncome += Math.abs(tx.amount)
      } else if (category.type === 'expense') {
        totalExpenses += Math.abs(tx.amount)
        const catName = category.name || 'Uncategorised'
        expensesByCategory[catName] = (expensesByCategory[catName] || 0) + Math.abs(tx.amount)
      }
    }

    // Get mileage
    const { data: mileageTrips } = await supabase
      .from('mileage_trips')
      .select('miles, deduction')
      .eq('tax_year', taxYear)

    const totalMiles = (mileageTrips || []).reduce((sum, t) => sum + (t.miles || 0), 0)
    const mileageDeduction = (mileageTrips || []).reduce((sum, t) => sum + Number(t.deduction || 0), 0)

    // Get use of home
    const { data: useOfHome } = await supabase
      .from('use_of_home')
      .select('annual_allowance')
      .eq('tax_year', taxYear)
      .single()

    const useOfHomeAmount = useOfHome?.annual_allowance || 0

    // Calculate tax using shared calculator
    const taxBreakdown = calculateEstimatedTax(totalIncome, totalExpenses, mileageDeduction, useOfHomeAmount)
    const { incomeTax, class2NI, class4NI, totalTaxDue, effectiveTaxRate } = taxBreakdown
    const nationalInsurance = class2NI + class4NI
    const netProfit = totalIncome - totalExpenses - mileageDeduction - useOfHomeAmount

    // Sort expenses by category
    const sortedCategories = Object.entries(expensesByCategory)
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: totalExpenses > 0 ? Math.round((amount / totalExpenses) * 100) : 0,
      }))
      .sort((a, b) => b.amount - a.amount)

    // Get previous year for comparison
    const [startYear] = taxYear.split('-').map(Number)
    const previousTaxYear = `${startYear - 1}-${startYear.toString().slice(-2)}`

    const { data: prevTransactions } = await supabase
      .from('transactions')
      .select(`
        amount,
        review_status,
        category:categories!transactions_category_id_fkey(type)
      `)
      .eq('tax_year', previousTaxYear)

    let comparison
    const prevTxs = prevTransactions as PrevTransactionData[] | null
    if (prevTxs && prevTxs.length > 0) {
      let prevIncome = 0
      let prevExpenses = 0

      for (const tx of prevTxs) {
        if (tx.review_status !== 'confirmed') continue
        const category = tx.category
        if (!category) continue

        if (category.type === 'income') {
          prevIncome += Math.abs(tx.amount)
        } else if (category.type === 'expense') {
          prevExpenses += Math.abs(tx.amount)
        }
      }

      if (prevIncome > 0 || prevExpenses > 0) {
        const prevProfit = prevIncome - prevExpenses

        comparison = {
          previousYear: previousTaxYear,
          incomeChange: totalIncome - prevIncome,
          incomeChangePercent: prevIncome > 0 ? ((totalIncome - prevIncome) / prevIncome) * 100 : 0,
          expensesChange: totalExpenses - prevExpenses,
          expensesChangePercent: prevExpenses > 0 ? ((totalExpenses - prevExpenses) / prevExpenses) * 100 : 0,
          profitChange: netProfit - prevProfit,
          profitChangePercent: Math.abs(prevProfit) > 0 ? ((netProfit - prevProfit) / Math.abs(prevProfit)) * 100 : 0,
        }
      }
    }

    // Build report data
    const reportData: DashboardReportData = {
      taxYear,
      generatedAt: new Date().toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
      userName: profile?.full_name || 'User',
      summary: {
        totalIncome: Math.round(totalIncome * 100) / 100,
        totalExpenses: Math.round(totalExpenses * 100) / 100,
        netProfit: Math.round(netProfit * 100) / 100,
        profitMargin: totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0,
        totalTaxDue,
        effectiveTaxRate: Math.round(effectiveTaxRate * 10) / 10,
        incomeTax: Math.round(incomeTax * 100) / 100,
        nationalInsurance: Math.round(nationalInsurance * 100) / 100,
      },
      comparison,
      expensesByCategory: sortedCategories,
      deductions: {
        mileage: totalMiles > 0 ? { miles: totalMiles, amount: mileageDeduction } : undefined,
        useOfHome: useOfHomeAmount > 0 ? { amount: useOfHomeAmount } : undefined,
      },
      actionItems: [
        { title: 'Review all transactions are categorised', completed: false },
        { title: 'Confirm mileage log is complete', completed: false },
        { title: 'File self-assessment by 31 January', completed: false },
        { title: 'Set aside money for tax payment', completed: false },
      ],
    }

    // Generate PDF
    const doc = generateDashboardPDF(reportData)
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'))

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="TaxFolio-Summary-${taxYear}.pdf"`,
      },
    })
  } catch (error) {
    console.error('PDF generation failed:', error)
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 })
  }
}
