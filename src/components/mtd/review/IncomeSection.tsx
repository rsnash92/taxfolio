'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import type { AggregatedBucket, TransactionSummary } from '@/app/api/mtd/aggregate/route'

interface IncomeSectionProps {
  thisQuarter: AggregatedBucket
  cumulative: AggregatedBucket
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

interface IncomeRowProps {
  label: string
  hmrcField: string
  thisQuarterAmount: number
  cumulativeAmount: number
  thisQuarterTransactions: TransactionSummary[]
  cumulativeTransactions: TransactionSummary[]
}

function IncomeRow({
  label,
  thisQuarterAmount,
  cumulativeAmount,
  thisQuarterTransactions,
  cumulativeTransactions,
}: IncomeRowProps) {
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
        <td className="py-2.5 text-right font-mono text-sm font-medium text-gray-900">
          {formatCurrency(cumulativeAmount)}
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={3} className="bg-gray-50/50">
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

export function IncomeSection({ thisQuarter, cumulative }: IncomeSectionProps) {
  const thisQuarterTotal = thisQuarter.income.turnover + thisQuarter.income.other
  const cumulativeTotal = cumulative.income.turnover + cumulative.income.other

  return (
    <Card>
      <CardContent className="space-y-2">
        <h2 className="text-base font-semibold text-gray-900">Income</h2>

        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left text-xs font-medium text-gray-500 pb-2">Category</th>
              <th className="text-right text-xs font-medium text-gray-500 pb-2">This Quarter</th>
              <th className="text-right text-xs font-medium text-gray-500 pb-2">Cumulative YTD</th>
            </tr>
          </thead>
          <tbody>
            <IncomeRow
              label="Sales / Turnover"
              hmrcField="turnover"
              thisQuarterAmount={thisQuarter.income.turnover}
              cumulativeAmount={cumulative.income.turnover}
              thisQuarterTransactions={thisQuarter.transactionsByHmrcField['turnover'] || []}
              cumulativeTransactions={cumulative.transactionsByHmrcField['turnover'] || []}
            />
            <IncomeRow
              label="Other Income"
              hmrcField="other"
              thisQuarterAmount={thisQuarter.income.other}
              cumulativeAmount={cumulative.income.other}
              thisQuarterTransactions={thisQuarter.transactionsByHmrcField['other'] || []}
              cumulativeTransactions={cumulative.transactionsByHmrcField['other'] || []}
            />
          </tbody>
          <tfoot>
            <tr className="border-t border-gray-200">
              <td className="py-2.5 text-sm font-semibold text-gray-900 pl-6">Total Income</td>
              <td className="py-2.5 text-right font-mono text-sm font-semibold text-gray-900">
                {formatCurrency(thisQuarterTotal)}
              </td>
              <td className="py-2.5 text-right font-mono text-sm font-semibold text-green-700">
                {formatCurrency(cumulativeTotal)}
              </td>
            </tr>
          </tfoot>
        </table>
      </CardContent>
    </Card>
  )
}
