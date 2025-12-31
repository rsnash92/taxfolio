import { CollectedData, YearComparison, CategoryBreakdown } from './types'
import { groupByCategory } from './data-collector'
import { estimateTax } from './calculations'

/**
 * Compare current year to previous year
 */
export function compareYears(
  currentData: CollectedData,
  previousData: CollectedData | null
): YearComparison | null {
  if (!previousData || previousData.transactions.length === 0) {
    return null
  }

  // Calculate totals for both years
  const currentIncome = sumByType(currentData.transactions, 'income')
  const currentExpenses = sumByType(currentData.transactions, 'expense')
  const currentProfit = currentIncome - currentExpenses

  const previousIncome = sumByType(previousData.transactions, 'income')
  const previousExpenses = sumByType(previousData.transactions, 'expense')
  const previousProfit = previousIncome - previousExpenses

  // Estimate tax for both years
  const currentTax = estimateTax(currentProfit)
  const previousTax = estimateTax(previousProfit)

  // Compare categories
  const currentCategories = groupByCategory(currentData.transactions, 'expense')
  const previousCategories = groupByCategory(previousData.transactions, 'expense')

  const categoryChanges = compareCategoryChanges(currentCategories, previousCategories)

  return {
    previousYear: previousData.taxYear,
    income: {
      previous: Math.round(previousIncome * 100) / 100,
      current: Math.round(currentIncome * 100) / 100,
      change: Math.round((currentIncome - previousIncome) * 100) / 100,
      changePercent: calculateChangePercent(previousIncome, currentIncome),
    },
    expenses: {
      previous: Math.round(previousExpenses * 100) / 100,
      current: Math.round(currentExpenses * 100) / 100,
      change: Math.round((currentExpenses - previousExpenses) * 100) / 100,
      changePercent: calculateChangePercent(previousExpenses, currentExpenses),
    },
    profit: {
      previous: Math.round(previousProfit * 100) / 100,
      current: Math.round(currentProfit * 100) / 100,
      change: Math.round((currentProfit - previousProfit) * 100) / 100,
      changePercent: calculateChangePercent(previousProfit, currentProfit),
    },
    tax: {
      previous: previousTax,
      current: currentTax,
      change: Math.round((currentTax - previousTax) * 100) / 100,
      changePercent: calculateChangePercent(previousTax, currentTax),
    },
    categoryChanges,
  }
}

/**
 * Sum transactions by type
 */
function sumByType(transactions: CollectedData['transactions'], type: 'income' | 'expense'): number {
  return transactions
    .filter(t => t.type === type)
    .reduce((sum, t) => sum + t.amount, 0)
}

/**
 * Calculate percentage change
 */
function calculateChangePercent(previous: number, current: number): number {
  if (previous === 0) return current > 0 ? 100 : 0
  return Math.round(((current - previous) / Math.abs(previous)) * 100)
}

/**
 * Compare category spending between years
 */
function compareCategoryChanges(
  current: CategoryBreakdown[],
  previous: CategoryBreakdown[]
): YearComparison['categoryChanges'] {
  const previousMap = new Map(previous.map(c => [c.category, c.amount]))

  const changes = current.map(cat => {
    const prevAmount = previousMap.get(cat.category) || 0
    return {
      category: cat.category,
      previous: prevAmount,
      current: cat.amount,
      changePercent: calculateChangePercent(prevAmount, cat.amount),
    }
  })

  // Sort by absolute change and take top 5
  return changes
    .sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent))
    .slice(0, 5)
}
