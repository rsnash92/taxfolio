import Anthropic from '@anthropic-ai/sdk'
import { TaxSuggestion, UserFinancialContext } from './types'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

/**
 * Use AI to analyze spending patterns and find additional suggestions
 */
export async function analyzeWithAI(
  context: UserFinancialContext,
  existingSuggestions: TaxSuggestion[]
): Promise<TaxSuggestion[]> {
  // Only run AI analysis if they have meaningful data
  if (context.transactionCount < 10 || context.totalExpenses < 500) {
    return []
  }

  const existingKeys = existingSuggestions.map(s => s.key)

  const prompt = `You are a UK tax expert analyzing a sole trader's expenses to find missed deductions.

## User's Financial Data (Tax Year ${context.taxYear})

- Total Income: £${context.totalIncome.toFixed(2)}
- Total Expenses: £${context.totalExpenses.toFixed(2)}
- Taxable Profit: £${context.taxableProfit.toFixed(2)}
- Marginal Tax Rate: ${context.marginalTaxRate * 100}%
- Business Type: ${context.businessType}
- Has Use of Home claim: ${context.hasUseOfHome ? `Yes (£${context.useOfHomeAmount})` : 'No'}
- Has Mileage claims: ${context.hasMileage ? `Yes (${context.totalMiles} miles, £${context.mileageAmount})` : 'No'}
- Bank Connected: ${context.bankConnected ? 'Yes' : 'No'}

## Expenses by Category
${Object.entries(context.expensesByCategory)
    .sort(([, a], [, b]) => b - a)
    .map(([cat, amount]) => `- ${cat}: £${amount.toFixed(2)}`)
    .join('\n')}

## Already Suggested
${existingKeys.join(', ') || 'None'}

## Task
Analyze this data and suggest 1-3 ADDITIONAL tax saving opportunities that aren't already suggested. Focus on:
1. Patterns that suggest missing deductions
2. Categories that seem unusually low
3. Industry-specific deductions they might be missing
4. Optimization opportunities

Return JSON array with this format:
[
  {
    "key": "unique_key",
    "title": "Short title",
    "description": "Detailed explanation with specific advice",
    "category": "missing_deduction" | "optimization" | "tip",
    "priority": "high" | "medium" | "low",
    "potentialSaving": 100,
    "taxSaving": 20
  }
]

If no additional suggestions, return empty array [].
Only suggest things that are legitimately tax deductible in the UK.
Be conservative with estimates.`

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [
        { role: 'user', content: prompt }
      ],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''

    // Extract JSON from response
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) return []

    const suggestions = JSON.parse(jsonMatch[0]) as Array<{
      key: string
      title: string
      description: string
      category: string
      priority: string
      potentialSaving: number
      taxSaving: number
    }>

    // Convert to TaxSuggestion format
    return suggestions.map(s => ({
      key: `ai_${s.key}`,
      title: s.title,
      description: s.description,
      category: s.category as TaxSuggestion['category'],
      priority: s.priority as TaxSuggestion['priority'],
      potentialSaving: s.potentialSaving,
      taxSaving: s.taxSaving,
      action: {
        label: 'Review',
        href: '/transactions',
      },
    }))
  } catch (error) {
    console.error('AI analysis failed:', error)
    return []
  }
}
