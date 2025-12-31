export interface YearEndReport {
  taxYear: string
  generatedAt: string

  summary: {
    totalIncome: number
    totalExpenses: number
    netProfit: number
    profitMargin: number
    estimatedTax: number
    estimatedNI: number
    totalTaxDue: number
    effectiveTaxRate: number
  }

  income: {
    total: number
    byCategory: CategoryBreakdown[]
    byMonth: MonthlyData[]
    topSources: { description: string; amount: number; count: number }[]
    averageTransaction: number
    transactionCount: number
  }

  expenses: {
    total: number
    byCategory: CategoryBreakdown[]
    byMonth: MonthlyData[]
    topExpenses: { description: string; amount: number; date: string }[]
    averageTransaction: number
    transactionCount: number
    largestCategory: string
    largestCategoryAmount: number
  }

  deductions: {
    mileage: { miles: number; amount: number; trips: number } | null
    useOfHome: { amount: number; method: string } | null
    capitalAllowances: number
    otherDeductions: number
    totalAdditional: number
  }

  tax: TaxCalculation

  comparison: YearComparison | null

  insights: AIInsight[]

  actionItems: ActionItem[]
}

export interface TaxCalculation {
  taxableProfit: number
  personalAllowance: number
  personalAllowanceUsed: number

  incomeTax: {
    basicRate: { amount: number; tax: number }
    higherRate: { amount: number; tax: number }
    additionalRate: { amount: number; tax: number }
    total: number
  }

  nationalInsurance: {
    class2: number
    class4Lower: number
    class4Upper: number
    total: number
  }

  totalTaxDue: number
  paymentsOnAccount: {
    required: boolean
    firstPayment: number
    secondPayment: number
    total: number
  }

  effectiveTaxRate: number
  marginalRate: number
}

export interface CategoryBreakdown {
  category: string
  amount: number
  percentage: number
  count: number
  trend?: 'up' | 'down' | 'stable'
  changePercent?: number
}

export interface MonthlyData {
  month: string
  monthName: string
  income: number
  expenses: number
  profit: number
}

export interface YearComparison {
  previousYear: string
  income: { previous: number; current: number; change: number; changePercent: number }
  expenses: { previous: number; current: number; change: number; changePercent: number }
  profit: { previous: number; current: number; change: number; changePercent: number }
  tax: { previous: number; current: number; change: number; changePercent: number }
  categoryChanges: {
    category: string
    previous: number
    current: number
    changePercent: number
  }[]
}

export interface AIInsight {
  type: 'positive' | 'warning' | 'neutral' | 'tip'
  title: string
  description: string
  metric?: string
}

export interface ActionItem {
  priority: 'high' | 'medium' | 'low'
  title: string
  description: string
  deadline?: string
  completed: boolean
  href?: string
}

export interface CollectedData {
  taxYear: string
  transactions: TransactionRecord[]
  mileageTrips: MileageRecord[]
  useOfHome: UseOfHomeRecord | null
  previousYearData: CollectedData | null
}

export interface TransactionRecord {
  id: string
  date: string
  description: string
  amount: number
  type: 'income' | 'expense'
  category?: string
  review_status: string
}

export interface MileageRecord {
  id: string
  date: string
  miles: number
  deduction: number
  purpose?: string
}

export interface UseOfHomeRecord {
  annual_allowance: number
  method: string
}
