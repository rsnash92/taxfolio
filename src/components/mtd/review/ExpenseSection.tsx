'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { SELF_EMPLOYMENT_EXPENSE_CATEGORIES } from '@/types/mtd'
import type { AggregatedBucket, TransactionSummary } from '@/app/api/mtd/aggregate/route'

interface ExpenseSectionProps {
  thisQuarter: AggregatedBucket
  cumulative: AggregatedBucket
  adjustments: Record<string, number>
  onAdjustmentChange: (field: string, value: number) => void
  consolidated: boolean
  onConsolidatedChange: (value: boolean) => void
  showConsolidatedOption: boolean
}

function TransactionDrilldown({ transactions }: { transactions: TransactionSummary[] }) {
  if (!transactions.length) {
    return <p className="text-xs text-gray-400 py-2 pl-8">No transactions</p>
  }

  return (
    <div className="pl-8 py-2 space-y-1">
      {transactions.map((tx) => (
        <div key={tx.id} className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-gray-400 w-20 shrink-0">
              {new Date(tx.date + 'T00:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
            </span>
            <span className="text-gray-700 truncate">
              {tx.merchantName || tx.description}
            </span>
          </div>
          <span className="font-mono text-gray-900 shrink-0 ml-2">
            {formatCurrency(Math.abs(tx.amount))}
          </span>
        </div>
      ))}
    </div>
  )
}

interface ExpenseRowProps {
  label: string
  hmrcField: string
  thisQuarterAmount: number
  cumulativeAmount: number
  adjustment: number
  onAdjustmentChange: (value: number) => void
  thisQuarterTransactions: TransactionSummary[]
  cumulativeTransactions: TransactionSummary[]
}

function ExpenseRow({
  label,
  thisQuarterAmount,
  cumulativeAmount,
  adjustment,
  onAdjustmentChange,
  thisQuarterTransactions,
  cumulativeTransactions,
}: ExpenseRowProps) {
  const [expanded, setExpanded] = useState(false)
  const hasTransactions = thisQuarterTransactions.length > 0 || cumulativeTransactions.length > 0

  return (
    <>
      <tr
        className={`border-b border-gray-100 ${hasTransactions ? 'cursor-pointer hover:bg-gray-50' : ''}`}
        onClick={() => hasTransactions && setExpanded(!expanded)}
      >
        <td className="py-2.5 pr-4">
          <div className="flex items-center gap-2">
            {hasTransactions ? (
              expanded ? (
                <ChevronDown className="h-4 w-4 text-gray-400" />
              ) : (
                <ChevronRight className="h-4 w-4 text-gray-400" />
              )
            ) : (
              <span className="w-4" />
            )}
            <span className="text-sm text-gray-700">{label}</span>
          </div>
        </td>
        <td className="py-2.5 text-right font-mono text-sm text-gray-900">
          {formatCurrency(thisQuarterAmount)}
        </td>
        <td className="py-2.5 text-right font-mono text-sm text-gray-900">
          {adjustment ? (
            <span>
              <span className="text-gray-400 line-through text-xs mr-1">{formatCurrency(cumulativeAmount)}</span>
              {formatCurrency(cumulativeAmount + adjustment)}
            </span>
          ) : (
            formatCurrency(cumulativeAmount)
          )}
        </td>
        <td className="py-2.5 text-right" onClick={(e) => e.stopPropagation()}>
          <input
            type="number"
            step="0.01"
            value={adjustment || ''}
            onChange={(e) => onAdjustmentChange(parseFloat(e.target.value) || 0)}
            placeholder="+/- adj"
            className="w-24 text-right text-sm font-mono border border-gray-200 rounded px-2 py-1.5 bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#00e3ec] focus:border-[#00e3ec]"
          />
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={4} className="bg-gray-50/50">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider pl-8 pt-2">This Quarter</p>
                <TransactionDrilldown transactions={thisQuarterTransactions} />
              </div>
              <div>
                <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider pl-8 pt-2">Cumulative YTD</p>
                <TransactionDrilldown transactions={cumulativeTransactions} />
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

export function ExpenseSection({
  thisQuarter,
  cumulative,
  adjustments,
  onAdjustmentChange,
  consolidated,
  onConsolidatedChange,
  showConsolidatedOption,
}: ExpenseSectionProps) {
  // Get all HMRC expense fields that have data
  const activeCategories = SELF_EMPLOYMENT_EXPENSE_CATEGORIES.filter(
    (cat) => (cumulative.expenses[cat.key] || 0) > 0 || (thisQuarter.expenses[cat.key] || 0) > 0
  )

  const thisQuarterTotal = Object.values(thisQuarter.expenses).reduce((s, v) => s + v, 0)
    + Object.values(adjustments).reduce((s, v) => s + v, 0)
  const cumulativeTotal = Object.values(cumulative.expenses).reduce((s, v) => s + v, 0)
    + Object.values(adjustments).reduce((s, v) => s + v, 0)
  const totalAdjustments = Object.values(adjustments).reduce((s, v) => s + v, 0)

  return (
    <Card>
      <CardContent className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">Expenses</h2>
          {showConsolidatedOption && (
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={consolidated}
                onChange={(e) => onConsolidatedChange(e.target.checked)}
                className="rounded border-gray-300 text-[#00e3ec] focus:ring-[#00e3ec]"
              />
              Use consolidated expenses
            </label>
          )}
        </div>

        {showConsolidatedOption && consolidated ? (
          <div className="py-4">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left text-xs font-medium text-gray-500 pb-2">Category</th>
                  <th className="text-right text-xs font-medium text-gray-500 pb-2">This Quarter</th>
                  <th className="text-right text-xs font-medium text-gray-500 pb-2">Cumulative YTD</th>
                  <th className="text-right text-xs font-medium text-gray-500 pb-2 w-28">Adjustment</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-100">
                  <td className="py-2.5 pr-4">
                    <div className="flex items-center gap-2">
                      <span className="w-4" />
                      <span className="text-sm text-gray-700">Consolidated Expenses</span>
                    </div>
                  </td>
                  <td className="py-2.5 text-right font-mono text-sm text-gray-900">
                    {formatCurrency(thisQuarterTotal - totalAdjustments)}
                  </td>
                  <td className="py-2.5 text-right font-mono text-sm text-gray-900">
                    {formatCurrency(cumulativeTotal - totalAdjustments)}
                  </td>
                  <td className="py-2.5 text-right">
                    <input
                      type="number"
                      step="0.01"
                      value={adjustments['consolidatedExpenses'] || ''}
                      onChange={(e) => onAdjustmentChange('consolidatedExpenses', parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      className="w-24 text-right text-sm font-mono border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#00e3ec] focus:border-[#00e3ec]"
                    />
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr className="border-t border-gray-200">
                  <td className="py-2.5 text-sm font-semibold text-gray-900 pl-6">Total Expenses</td>
                  <td className="py-2.5 text-right font-mono text-sm font-semibold text-gray-900">
                    {formatCurrency(thisQuarterTotal)}
                  </td>
                  <td className="py-2.5 text-right font-mono text-sm font-semibold text-red-700">
                    {formatCurrency(cumulativeTotal)}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
            <p className="text-xs text-gray-400 mt-2">
              Consolidated expenses are available when turnover is below &pound;90,000.
              All expense categories are combined into a single figure.
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left text-xs font-medium text-gray-500 pb-2">Category</th>
                <th className="text-right text-xs font-medium text-gray-500 pb-2">This Quarter</th>
                <th className="text-right text-xs font-medium text-gray-500 pb-2">Cumulative YTD</th>
                <th className="text-right text-xs font-medium text-gray-500 pb-2 w-28">Adjustment</th>
              </tr>
            </thead>
            <tbody>
              {activeCategories.map((cat) => (
                <ExpenseRow
                  key={cat.key}
                  label={cat.label}
                  hmrcField={cat.key}
                  thisQuarterAmount={thisQuarter.expenses[cat.key] || 0}
                  cumulativeAmount={cumulative.expenses[cat.key] || 0}
                  adjustment={adjustments[cat.key] || 0}
                  onAdjustmentChange={(value) => onAdjustmentChange(cat.key, value)}
                  thisQuarterTransactions={thisQuarter.transactionsByHmrcField[cat.key] || []}
                  cumulativeTransactions={cumulative.transactionsByHmrcField[cat.key] || []}
                />
              ))}
              {activeCategories.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-sm text-gray-400">
                    No expenses categorised for this period
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr className="border-t border-gray-200">
                <td className="py-2.5 text-sm font-semibold text-gray-900 pl-6">Total Expenses</td>
                <td className="py-2.5 text-right font-mono text-sm font-semibold text-gray-900">
                  {formatCurrency(thisQuarterTotal)}
                </td>
                <td className="py-2.5 text-right font-mono text-sm font-semibold text-red-700">
                  {formatCurrency(cumulativeTotal)}
                </td>
                <td className="py-2.5 text-right font-mono text-xs text-gray-500">
                  {totalAdjustments !== 0 && (
                    <span>{totalAdjustments > 0 ? '+' : ''}{formatCurrency(totalAdjustments)}</span>
                  )}
                </td>
              </tr>
            </tfoot>
          </table>
        )}
      </CardContent>
    </Card>
  )
}
