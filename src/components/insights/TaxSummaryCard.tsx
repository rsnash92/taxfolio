'use client'

import { Card, CardContent } from '@/components/ui/card'
import { TrendingDown, TrendingUp } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface TaxSummaryProps {
  tax: {
    totalIncome: number
    totalExpenses: number
    taxableProfit: number
    personalAllowance: number
    taxableAfterAllowance: number
    incomeTax: number
    class2NIC: number
    class4NIC: number
    totalTaxDue: number
    effectiveRate: number
    prevYearTax: number | null
    prevYearIncome: number | null
  }
}

export function TaxSummaryCard({ tax }: TaxSummaryProps) {
  const profit = tax.totalIncome - tax.totalExpenses
  const hasComparison = tax.prevYearTax !== null
  const diff = hasComparison ? tax.totalTaxDue - tax.prevYearTax! : 0
  const isLower = diff < 0

  // Width percentages for the flow bar
  const maxVal = Math.max(tax.totalIncome, 1)
  const expensesPct = (tax.totalExpenses / maxVal) * 100
  const taxPct = (tax.totalTaxDue / maxVal) * 100
  const profitAfterTaxPct = Math.max(0, 100 - expensesPct - taxPct)

  if (tax.totalIncome === 0 && tax.totalExpenses === 0) {
    return (
      <Card>
        <CardContent>
          <h2 className="text-base font-semibold text-gray-900 mb-2">Tax Summary</h2>
          <p className="text-sm text-gray-500">
            Categorise your transactions to see your estimated tax position.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Tax Summary</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Estimate based on your categorised transactions
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold font-mono text-[#00e3ec]">
              {formatCurrency(tax.totalTaxDue)}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">Estimated annual tax + NIC</p>
            {hasComparison && (
              <div className={`inline-flex items-center gap-1 mt-1 text-xs font-medium ${isLower ? 'text-green-600' : 'text-amber-600'}`}>
                {isLower ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
                {formatCurrency(Math.abs(diff))} {isLower ? 'less' : 'more'} than last year
              </div>
            )}
          </div>
        </div>

        {/* Flow bar */}
        <div className="space-y-2">
          <div className="flex h-4 rounded-full overflow-hidden bg-gray-100">
            <div
              className="bg-gray-300 transition-all duration-500"
              style={{ width: `${expensesPct}%` }}
              title={`Expenses: ${formatCurrency(tax.totalExpenses)}`}
            />
            <div
              className="bg-[#00e3ec] transition-all duration-500"
              style={{ width: `${taxPct}%` }}
              title={`Tax: ${formatCurrency(tax.totalTaxDue)}`}
            />
            <div
              className="bg-green-400 transition-all duration-500"
              style={{ width: `${profitAfterTaxPct}%` }}
              title={`Take-home: ${formatCurrency(profit - tax.totalTaxDue)}`}
            />
          </div>
          <div className="flex justify-between text-[10px] text-gray-400">
            <span>Expenses {formatCurrency(tax.totalExpenses)}</span>
            <span>Tax {formatCurrency(tax.totalTaxDue)}</span>
            <span>Take-home {formatCurrency(Math.max(0, profit - tax.totalTaxDue))}</span>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
          <div>
            <p className="text-xs text-gray-500">Business Income</p>
            <p className="text-sm font-semibold font-mono text-gray-900">{formatCurrency(tax.totalIncome)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Expenses</p>
            <p className="text-sm font-semibold font-mono text-gray-900">{formatCurrency(tax.totalExpenses)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Taxable Profit</p>
            <p className="text-sm font-semibold font-mono text-gray-900">{formatCurrency(tax.taxableAfterAllowance)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Effective Rate</p>
            <p className="text-sm font-semibold font-mono text-gray-900">{tax.effectiveRate.toFixed(1)}%</p>
          </div>
        </div>

        {/* Breakdown */}
        <div className="border-t pt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-gray-500">
          <span>Income Tax: <span className="font-medium text-gray-700 font-mono">{formatCurrency(tax.incomeTax)}</span></span>
          <span>Class 2 NIC: <span className="font-medium text-gray-700 font-mono">{formatCurrency(tax.class2NIC)}</span></span>
          <span>Class 4 NIC: <span className="font-medium text-gray-700 font-mono">{formatCurrency(tax.class4NIC)}</span></span>
        </div>

        <p className="text-[10px] text-gray-400 leading-relaxed">
          This is a simplified estimate based on categorised transactions. Your actual liability may differ — consult a qualified accountant for tax advice.
        </p>
      </CardContent>
    </Card>
  )
}
