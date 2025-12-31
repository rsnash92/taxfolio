import { createClient } from '@/lib/supabase/server'
import { YearEndReport } from './types'
import { collectYearEndData, groupByMonth, groupByCategory } from './data-collector'
import { calculateTax } from './calculations'
import { compareYears } from './comparisons'
import { generateInsights } from './ai-insights'

/**
 * Generate complete year-end report
 */
export async function generateYearEndReport(
  userId: string,
  taxYear: string,
  options: { useAI?: boolean; forceRefresh?: boolean } = {}
): Promise<YearEndReport> {
  const supabase = await createClient()
  const { useAI = true, forceRefresh = false } = options

  // Check for cached report
  if (!forceRefresh) {
    const { data: cached } = await supabase
      .from('year_end_reports')
      .select('*')
      .eq('user_id', userId)
      .eq('tax_year', taxYear)
      .single()

    if (cached && cached.report_data) {
      // Return cached if less than 1 hour old
      const cacheAge = Date.now() - new Date(cached.generated_at).getTime()
      if (cacheAge < 60 * 60 * 1000) {
        return cached.report_data as YearEndReport
      }
    }
  }

  // Collect all data
  const data = await collectYearEndData(userId, taxYear, true)

  // Calculate basic totals
  const transactions = data.transactions
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)
  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)

  // Mileage deduction
  const mileageData = data.mileageTrips.length > 0 ? {
    miles: data.mileageTrips.reduce((sum, t) => sum + t.miles, 0),
    amount: data.mileageTrips.reduce((sum, t) => sum + (t.deduction || 0), 0),
    trips: data.mileageTrips.length,
  } : null

  // Use of home
  const useOfHomeData = data.useOfHome ? {
    amount: data.useOfHome.annual_allowance,
    method: data.useOfHome.method || 'simplified',
  } : null

  // Total additional deductions
  const totalAdditionalDeductions =
    (mileageData?.amount || 0) +
    (useOfHomeData?.amount || 0)

  // Net profit
  const netProfit = totalIncome - totalExpenses - totalAdditionalDeductions

  // Tax calculations
  const taxCalc = calculateTax(data)

  // Year comparison
  const comparison = compareYears(data, data.previousYearData)

  // Group data
  const monthlyData = groupByMonth(transactions, taxYear)
  const expensesByCategory = groupByCategory(transactions, 'expense')
  const incomeByCategory = groupByCategory(transactions, 'income')

  // Top expenses
  const topExpenses = transactions
    .filter(t => t.type === 'expense')
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5)
    .map(t => ({
      description: t.description,
      amount: t.amount,
      date: t.date,
    }))

  // Top income sources (group by similar descriptions)
  const incomeSourceMap = new Map<string, { amount: number; count: number }>()
  transactions
    .filter(t => t.type === 'income')
    .forEach(t => {
      const key = t.description.substring(0, 30)
      const existing = incomeSourceMap.get(key) || { amount: 0, count: 0 }
      incomeSourceMap.set(key, {
        amount: existing.amount + t.amount,
        count: existing.count + 1,
      })
    })

  const topSources = Array.from(incomeSourceMap.entries())
    .map(([description, d]) => ({ description, ...d }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5)

  // Build partial report for AI
  const partialReport: Partial<YearEndReport> = {
    taxYear,
    summary: {
      totalIncome: Math.round(totalIncome * 100) / 100,
      totalExpenses: Math.round(totalExpenses * 100) / 100,
      netProfit: Math.round(netProfit * 100) / 100,
      profitMargin: totalIncome > 0 ? Math.round((netProfit / totalIncome) * 1000) / 10 : 0,
      estimatedTax: taxCalc.incomeTax.total,
      estimatedNI: taxCalc.nationalInsurance.total,
      totalTaxDue: taxCalc.totalTaxDue,
      effectiveTaxRate: taxCalc.effectiveTaxRate,
    },
    expenses: {
      total: Math.round(totalExpenses * 100) / 100,
      byCategory: expensesByCategory,
      byMonth: monthlyData,
      topExpenses,
      averageTransaction: transactions.filter(t => t.type === 'expense').length > 0
        ? Math.round((totalExpenses / transactions.filter(t => t.type === 'expense').length) * 100) / 100
        : 0,
      transactionCount: transactions.filter(t => t.type === 'expense').length,
      largestCategory: expensesByCategory[0]?.category || 'None',
      largestCategoryAmount: expensesByCategory[0]?.amount || 0,
    },
    deductions: {
      mileage: mileageData,
      useOfHome: useOfHomeData,
      capitalAllowances: 0,
      otherDeductions: 0,
      totalAdditional: Math.round(totalAdditionalDeductions * 100) / 100,
    },
    tax: taxCalc,
    comparison,
  }

  // Generate AI insights
  let insights: YearEndReport['insights'] = []
  let actionItems: YearEndReport['actionItems'] = []

  if (useAI) {
    const aiResult = await generateInsights(partialReport)
    insights = aiResult.insights
    actionItems = aiResult.actionItems
  }

  // Build final report
  const report: YearEndReport = {
    taxYear,
    generatedAt: new Date().toISOString(),
    summary: partialReport.summary!,
    income: {
      total: Math.round(totalIncome * 100) / 100,
      byCategory: incomeByCategory,
      byMonth: monthlyData,
      topSources,
      averageTransaction: transactions.filter(t => t.type === 'income').length > 0
        ? Math.round((totalIncome / transactions.filter(t => t.type === 'income').length) * 100) / 100
        : 0,
      transactionCount: transactions.filter(t => t.type === 'income').length,
    },
    expenses: partialReport.expenses!,
    deductions: partialReport.deductions!,
    tax: partialReport.tax!,
    comparison,
    insights,
    actionItems,
  }

  // Cache the report (don't fail if table doesn't exist yet)
  try {
    await supabase.from('year_end_reports').upsert({
      user_id: userId,
      tax_year: taxYear,
      report_data: report,
      ai_insights: { insights, actionItems },
      generated_at: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Failed to cache report:', error)
  }

  return report
}
