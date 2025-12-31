export type SuggestionPriority = 'high' | 'medium' | 'low'
export type SuggestionCategory = 'missing_deduction' | 'optimization' | 'warning' | 'tip'

export interface TaxSuggestion {
  key: string
  title: string
  description: string
  category: SuggestionCategory
  priority: SuggestionPriority
  potentialSaving: number
  taxSaving: number
  action: {
    label: string
    href: string
  }
  learnMoreUrl?: string
  isDismissed?: boolean
}

export interface SuggestionsAnalysis {
  suggestions: TaxSuggestion[]
  totalPotentialSaving: number
  totalTaxSaving: number
  analyzedAt: string
}

export interface UserFinancialContext {
  taxYear: string
  totalIncome: number
  totalExpenses: number
  taxableProfit: number
  marginalTaxRate: number
  hasUseOfHome: boolean
  useOfHomeAmount: number
  hasMileage: boolean
  mileageAmount: number
  totalMiles: number
  transactionCount: number
  expensesByCategory: Record<string, number>
  bankConnected: boolean
  businessType: 'sole_trader' | 'landlord' | 'both'
}
