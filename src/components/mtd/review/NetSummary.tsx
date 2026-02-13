'use client'

import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'

interface NetSummaryProps {
  cumulativeIncome: number
  cumulativeExpenses: number
  adjustments: Record<string, number>
}

export function NetSummary({ cumulativeIncome, cumulativeExpenses, adjustments }: NetSummaryProps) {
  const totalAdjustments = Object.values(adjustments).reduce((s, v) => s + v, 0)
  const adjustedExpenses = cumulativeExpenses + totalAdjustments
  const netProfit = cumulativeIncome - adjustedExpenses

  return (
    <Card className="border-gray-200">
      <CardContent>
        <h2 className="text-base font-semibold text-gray-900 mb-3">Net Profit Summary</h2>
        <p className="text-xs text-gray-400 mb-4">Cumulative figures — this is what HMRC will receive</p>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Total Income</span>
            <span className="font-mono text-sm text-gray-900">{formatCurrency(cumulativeIncome)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">
              Total Expenses
              {totalAdjustments !== 0 && (
                <span className="text-xs text-gray-400 ml-1">
                  (incl. {totalAdjustments > 0 ? '+' : ''}{formatCurrency(totalAdjustments)} adjustments)
                </span>
              )}
            </span>
            <span className="font-mono text-sm text-gray-900">({formatCurrency(adjustedExpenses)})</span>
          </div>
          <div className="border-t border-gray-200 pt-2 flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-900">Net Profit</span>
            <span className={`font-mono text-lg font-bold ${netProfit >= 0 ? 'text-green-700' : 'text-red-600'}`}>
              {formatCurrency(netProfit)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
