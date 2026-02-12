// Dashboard-specific types for the main dashboard data layer

export interface DashboardData {
  ytdSummary: YtdSummaryData
  recentTransactions: RecentTransactionData[]
  nudge: NudgeData | null
  hasBankConnection: boolean
  hasHmrcConnection: boolean
  lastSyncedAt: string | null
}

export interface YtdSummaryData {
  totalIncome: number
  totalExpenses: number
  estimatedTax: number
  yoyChange: number | null // null if no previous year data
}

export interface RecentTransactionData {
  id: string
  merchant: string
  amount: number
  type: 'income' | 'expense'
  category: string | null
  status: 'auto' | 'needs_review'
  date: string // YYYY-MM-DD
}

export interface NudgeData {
  uncategorisedCount: number
  totalTransactions: number
  aiCategorisedPercent: number
}
