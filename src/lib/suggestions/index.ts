import { createClient } from '@/lib/supabase/server'
import { buildFinancialContext } from './context'
import { generateRuleBasedSuggestions } from './rules'
import { analyzeWithAI } from './analyzer'
import { TaxSuggestion, SuggestionsAnalysis } from './types'

export * from './types'

/**
 * Get all suggestions for a user
 */
export async function getSuggestions(
  userId: string,
  taxYear: string,
  includeAI: boolean = true
): Promise<SuggestionsAnalysis> {
  const supabase = await createClient()

  // Build context
  const context = await buildFinancialContext(userId, taxYear)

  // Get dismissed suggestions
  const { data: dismissed } = await supabase
    .from('dismissed_suggestions')
    .select('suggestion_key')
    .eq('user_id', userId)
    .eq('tax_year', taxYear)

  const dismissedKeys = new Set((dismissed || []).map(d => d.suggestion_key))

  // Generate rule-based suggestions
  let suggestions = generateRuleBasedSuggestions(context)

  // Add AI suggestions if enabled
  if (includeAI) {
    const aiSuggestions = await analyzeWithAI(context, suggestions)
    suggestions = [...suggestions, ...aiSuggestions]
  }

  // Filter out dismissed and mark
  suggestions = suggestions.map(s => ({
    ...s,
    isDismissed: dismissedKeys.has(s.key),
  }))

  // Sort by priority and potential saving
  const priorityOrder = { high: 0, medium: 1, low: 2 }
  suggestions.sort((a, b) => {
    if (a.isDismissed !== b.isDismissed) {
      return a.isDismissed ? 1 : -1
    }
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority]
    }
    return b.potentialSaving - a.potentialSaving
  })

  // Calculate totals (excluding dismissed)
  const activeSuggestions = suggestions.filter(s => !s.isDismissed)
  const totalPotentialSaving = activeSuggestions.reduce((sum, s) => sum + s.potentialSaving, 0)
  const totalTaxSaving = activeSuggestions.reduce((sum, s) => sum + s.taxSaving, 0)

  return {
    suggestions,
    totalPotentialSaving: Math.round(totalPotentialSaving * 100) / 100,
    totalTaxSaving: Math.round(totalTaxSaving * 100) / 100,
    analyzedAt: new Date().toISOString(),
  }
}

/**
 * Dismiss a suggestion
 */
export async function dismissSuggestion(
  userId: string,
  suggestionKey: string,
  taxYear: string
): Promise<void> {
  const supabase = await createClient()

  await supabase.from('dismissed_suggestions').upsert({
    user_id: userId,
    suggestion_key: suggestionKey,
    tax_year: taxYear,
  })
}

/**
 * Restore a dismissed suggestion
 */
export async function restoreSuggestion(
  userId: string,
  suggestionKey: string,
  taxYear: string
): Promise<void> {
  const supabase = await createClient()

  await supabase
    .from('dismissed_suggestions')
    .delete()
    .eq('user_id', userId)
    .eq('suggestion_key', suggestionKey)
    .eq('tax_year', taxYear)
}
