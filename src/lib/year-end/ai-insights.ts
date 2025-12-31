import Anthropic from '@anthropic-ai/sdk'
import { YearEndReport, AIInsight, ActionItem } from './types'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

/**
 * Generate AI insights for the year-end report
 */
export async function generateInsights(
  report: Partial<YearEndReport>
): Promise<{ insights: AIInsight[]; actionItems: ActionItem[] }> {
  const prompt = `You are a UK tax expert analyzing a sole trader's year-end financial data. Generate insights and action items.

## Financial Summary (Tax Year ${report.taxYear})

**Income & Expenses**
- Total Income: £${report.summary?.totalIncome?.toFixed(2)}
- Total Expenses: £${report.summary?.totalExpenses?.toFixed(2)}
- Net Profit: £${report.summary?.netProfit?.toFixed(2)}
- Profit Margin: ${report.summary?.profitMargin?.toFixed(1)}%

**Tax Position**
- Estimated Income Tax: £${report.tax?.incomeTax.total.toFixed(2)}
- Estimated NI: £${report.tax?.nationalInsurance.total.toFixed(2)}
- Total Tax Due: £${report.tax?.totalTaxDue.toFixed(2)}
- Effective Tax Rate: ${report.tax?.effectiveTaxRate?.toFixed(1)}%
- Marginal Rate: ${report.tax?.marginalRate}%

**Expense Categories**
${report.expenses?.byCategory.slice(0, 8).map(c =>
    `- ${c.category}: £${c.amount.toFixed(2)} (${c.percentage}%)`
  ).join('\n')}

**Deductions Claimed**
- Mileage: ${report.deductions?.mileage ? `£${report.deductions.mileage.amount.toFixed(2)} (${report.deductions.mileage.miles} miles)` : 'Not claimed'}
- Use of Home: ${report.deductions?.useOfHome ? `£${report.deductions.useOfHome.amount.toFixed(2)}` : 'Not claimed'}

${report.comparison ? `
**Year-on-Year Comparison (vs ${report.comparison.previousYear})**
- Income: ${report.comparison.income.changePercent > 0 ? '+' : ''}${report.comparison.income.changePercent}%
- Expenses: ${report.comparison.expenses.changePercent > 0 ? '+' : ''}${report.comparison.expenses.changePercent}%
- Profit: ${report.comparison.profit.changePercent > 0 ? '+' : ''}${report.comparison.profit.changePercent}%
- Tax: ${report.comparison.tax.changePercent > 0 ? '+' : ''}${report.comparison.tax.changePercent}%
` : ''}

## Task

Generate:
1. **4-6 Insights** - Key observations about their finances (positive trends, concerns, opportunities)
2. **3-5 Action Items** - Specific tasks to complete before filing

Respond with JSON only:
{
  "insights": [
    {
      "type": "positive" | "warning" | "neutral" | "tip",
      "title": "Short title",
      "description": "Detailed explanation (1-2 sentences)",
      "metric": "Optional: key number to highlight"
    }
  ],
  "actionItems": [
    {
      "priority": "high" | "medium" | "low",
      "title": "Task title",
      "description": "What to do and why",
      "deadline": "Optional: 31 January 2026"
    }
  ]
}

Be specific, actionable, and UK-focused. Reference their actual numbers.`

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)

    if (!jsonMatch) {
      return { insights: getDefaultInsights(report), actionItems: getDefaultActions() }
    }

    const result = JSON.parse(jsonMatch[0])

    return {
      insights: result.insights || [],
      actionItems: (result.actionItems || []).map((a: ActionItem) => ({
        ...a,
        completed: false,
        href: getActionHref(a.title),
      })),
    }
  } catch (error) {
    console.error('AI insights generation failed:', error)
    return { insights: getDefaultInsights(report), actionItems: getDefaultActions() }
  }
}

/**
 * Default insights if AI fails
 */
function getDefaultInsights(report: Partial<YearEndReport>): AIInsight[] {
  const insights: AIInsight[] = []

  // Profit margin insight
  const margin = report.summary?.profitMargin || 0
  if (margin > 50) {
    insights.push({
      type: 'positive',
      title: 'Strong profit margin',
      description: `Your ${margin.toFixed(0)}% profit margin is healthy for a sole trader business.`,
      metric: `${margin.toFixed(0)}%`,
    })
  } else if (margin < 20 && margin > 0) {
    insights.push({
      type: 'warning',
      title: 'Low profit margin',
      description: `Your ${margin.toFixed(0)}% profit margin is below average. Consider reviewing expenses or pricing.`,
      metric: `${margin.toFixed(0)}%`,
    })
  }

  // Tax rate insight
  if (report.tax?.marginalRate === 40) {
    insights.push({
      type: 'tip',
      title: 'Higher rate taxpayer',
      description: 'You\'re paying 40% on some earnings. Consider pension contributions to reduce your tax bill.',
    })
  }

  // Deductions insight
  if (!report.deductions?.mileage && !report.deductions?.useOfHome) {
    insights.push({
      type: 'warning',
      title: 'No additional deductions claimed',
      description: 'You haven\'t claimed mileage or use of home. These could reduce your tax bill.',
    })
  }

  return insights
}

/**
 * Default action items
 */
function getDefaultActions(): ActionItem[] {
  return [
    {
      priority: 'high',
      title: 'Review all transactions',
      description: 'Ensure all transactions are correctly categorised before filing.',
      completed: false,
      href: '/transactions',
    },
    {
      priority: 'high',
      title: 'File self-assessment',
      description: 'Submit your tax return before the deadline.',
      deadline: '31 January 2026',
      completed: false,
    },
    {
      priority: 'medium',
      title: 'Save for tax bill',
      description: 'Set aside money for your tax payment.',
      completed: false,
    },
  ]
}

/**
 * Get link for action item
 */
function getActionHref(title: string): string | undefined {
  const titleLower = title.toLowerCase()

  if (titleLower.includes('transaction')) return '/transactions'
  if (titleLower.includes('mileage')) return '/mileage'
  if (titleLower.includes('home')) return '/home-office'
  if (titleLower.includes('receipt')) return '/transactions'
  if (titleLower.includes('export')) return '/export'

  return undefined
}
