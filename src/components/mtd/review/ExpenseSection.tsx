'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronRight, Plus, Pencil, Trash2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { SELF_EMPLOYMENT_EXPENSE_CATEGORIES } from '@/types/mtd'
import type { AggregatedBucket, TransactionSummary, AdjustmentSummary, FieldBreakdown } from '@/app/api/mtd/aggregate/route'
import { AddAdjustmentDialog } from './AddAdjustmentDialog'

interface ExpenseSectionProps {
  thisQuarter: AggregatedBucket
  cumulative: AggregatedBucket
  adjustmentsByField: Record<string, FieldBreakdown>
  consolidated: boolean
  onConsolidatedChange: (value: boolean) => void
  showConsolidatedOption: boolean
  businessId: string
  taxYear: string
  periodStart: string
  periodEnd: string
  onAdjustmentChange: () => void
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

function AdjustmentDrilldown({
  adjustments,
  onEdit,
  onDelete,
}: {
  adjustments: AdjustmentSummary[]
  onEdit: (adj: AdjustmentSummary) => void
  onDelete: (id: string) => void
}) {
  if (!adjustments.length) return null

  const typeLabels: Record<string, string> = {
    mileage_allowance: 'Mileage',
    use_of_home: 'Use of home',
    capital_allowance: 'Capital allowance',
    cash_expense: 'Cash expense',
    prior_period: 'Prior period',
    other: 'Other',
  }

  return (
    <div className="pl-8 py-2 space-y-1">
      {adjustments.map((adj) => (
        <div key={adj.id} className="flex items-center justify-between text-xs group">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-amber-600 w-20 shrink-0">
              {typeLabels[adj.adjustmentType] || adj.adjustmentType}
            </span>
            <span className="text-gray-700 truncate">{adj.description}</span>
          </div>
          <div className="flex items-center gap-1 shrink-0 ml-2">
            <span className="font-mono text-amber-700">
              {adj.amount > 0 ? '+' : ''}{formatCurrency(adj.amount)}
            </span>
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(adj) }}
              className="opacity-0 group-hover:opacity-100 p-0.5 text-gray-400 hover:text-gray-600 transition-opacity"
              title="Edit adjustment"
            >
              <Pencil className="h-3 w-3" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(adj.id) }}
              className="opacity-0 group-hover:opacity-100 p-0.5 text-gray-400 hover:text-red-500 transition-opacity"
              title="Delete adjustment"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
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
  fieldBreakdown: FieldBreakdown | undefined
  thisQuarterTransactions: TransactionSummary[]
  cumulativeTransactions: TransactionSummary[]
  onAddAdjustment: (hmrcField: string) => void
  onEditAdjustment: (adj: AdjustmentSummary) => void
  onDeleteAdjustment: (id: string) => void
}

function ExpenseRow({
  label,
  hmrcField,
  thisQuarterAmount,
  cumulativeAmount,
  fieldBreakdown,
  thisQuarterTransactions,
  cumulativeTransactions,
  onAddAdjustment,
  onEditAdjustment,
  onDeleteAdjustment,
}: ExpenseRowProps) {
  const [expanded, setExpanded] = useState(false)
  const hasTransactions = thisQuarterTransactions.length > 0 || cumulativeTransactions.length > 0
  const adjTotal = fieldBreakdown?.adjustmentTotal || 0
  const adjustments = fieldBreakdown?.adjustments || []
  const hasData = hasTransactions || adjustments.length > 0

  return (
    <>
      <tr
        className={`border-b border-gray-100 ${hasData ? 'cursor-pointer hover:bg-gray-50' : ''}`}
        onClick={() => hasData && setExpanded(!expanded)}
      >
        <td className="py-2.5 pr-4">
          <div className="flex items-center gap-2">
            {hasData ? (
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
          {adjTotal ? (
            <span>
              <span className="text-gray-400 line-through text-xs mr-1">{formatCurrency(cumulativeAmount)}</span>
              {formatCurrency(cumulativeAmount + adjTotal)}
            </span>
          ) : (
            formatCurrency(cumulativeAmount)
          )}
        </td>
        <td className="py-2.5 text-right" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => onAddAdjustment(hmrcField)}
            className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-[#00a8b0] transition-colors"
            title="Add adjustment"
          >
            <Plus className="h-3 w-3" />
            {adjTotal !== 0 && (
              <span className="font-mono text-amber-600">
                {adjTotal > 0 ? '+' : ''}{formatCurrency(adjTotal)}
              </span>
            )}
          </button>
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
            {adjustments.length > 0 && (
              <div>
                <p className="text-[10px] font-medium text-amber-500 uppercase tracking-wider pl-8 pt-2">
                  Adjustments ({adjustments.length})
                </p>
                <AdjustmentDrilldown
                  adjustments={adjustments}
                  onEdit={onEditAdjustment}
                  onDelete={onDeleteAdjustment}
                />
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  )
}

export function ExpenseSection({
  thisQuarter,
  cumulative,
  adjustmentsByField,
  consolidated,
  onConsolidatedChange,
  showConsolidatedOption,
  businessId,
  taxYear,
  periodStart,
  periodEnd,
  onAdjustmentChange,
}: ExpenseSectionProps) {
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [addDialogField, setAddDialogField] = useState<string>('')
  const [editAdjustment, setEditAdjustment] = useState<AdjustmentSummary | null>(null)

  const activeCategories = SELF_EMPLOYMENT_EXPENSE_CATEGORIES.filter(
    (cat) =>
      (cumulative.expenses[cat.key] || 0) > 0 ||
      (thisQuarter.expenses[cat.key] || 0) > 0 ||
      (adjustmentsByField[cat.key]?.adjustmentTotal || 0) !== 0
  )

  const totalAdjExpenses = Object.entries(adjustmentsByField)
    .filter(([field]) => field !== 'turnover')
    .reduce((s, [, fb]) => s + fb.adjustmentTotal, 0)

  const cumulativeExpTotal = Object.values(cumulative.expenses).reduce((s, v) => s + v, 0) + totalAdjExpenses
  const thisQuarterExpTotal = Object.values(thisQuarter.expenses).reduce((s, v) => s + v, 0)

  const handleAddAdjustment = (hmrcField: string) => {
    setAddDialogField(hmrcField)
    setEditAdjustment(null)
    setAddDialogOpen(true)
  }

  const handleEditAdjustment = (adj: AdjustmentSummary) => {
    setEditAdjustment(adj)
    setAddDialogField('')
    setAddDialogOpen(true)
  }

  const handleDeleteAdjustment = async (id: string) => {
    await fetch(`/api/mtd/adjustments?id=${id}`, { method: 'DELETE' })
    onAdjustmentChange()
  }

  const handleDialogSave = () => {
    setAddDialogOpen(false)
    setEditAdjustment(null)
    onAdjustmentChange()
  }

  return (
    <>
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
                    <th className="text-right text-xs font-medium text-gray-500 pb-2 w-28">Adjust</th>
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
                      {formatCurrency(thisQuarterExpTotal)}
                    </td>
                    <td className="py-2.5 text-right font-mono text-sm text-gray-900">
                      {formatCurrency(cumulativeExpTotal)}
                    </td>
                    <td className="py-2.5 text-right">
                      <button
                        onClick={() => handleAddAdjustment('consolidatedExpenses')}
                        className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-[#00a8b0] transition-colors"
                        title="Add adjustment"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr className="border-t border-gray-200">
                    <td className="py-2.5 text-sm font-semibold text-gray-900 pl-6">Total Expenses</td>
                    <td className="py-2.5 text-right font-mono text-sm font-semibold text-gray-900">
                      {formatCurrency(thisQuarterExpTotal)}
                    </td>
                    <td className="py-2.5 text-right font-mono text-sm font-semibold text-red-700">
                      {formatCurrency(cumulativeExpTotal)}
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
                  <th className="text-right text-xs font-medium text-gray-500 pb-2 w-28">Adjust</th>
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
                    fieldBreakdown={adjustmentsByField[cat.key]}
                    thisQuarterTransactions={thisQuarter.transactionsByHmrcField[cat.key] || []}
                    cumulativeTransactions={cumulative.transactionsByHmrcField[cat.key] || []}
                    onAddAdjustment={handleAddAdjustment}
                    onEditAdjustment={handleEditAdjustment}
                    onDeleteAdjustment={handleDeleteAdjustment}
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
                    {formatCurrency(thisQuarterExpTotal)}
                  </td>
                  <td className="py-2.5 text-right font-mono text-sm font-semibold text-red-700">
                    {formatCurrency(cumulativeExpTotal)}
                  </td>
                  <td className="py-2.5 text-right font-mono text-xs text-gray-500">
                    {totalAdjExpenses !== 0 && (
                      <span className="text-amber-600">{totalAdjExpenses > 0 ? '+' : ''}{formatCurrency(totalAdjExpenses)}</span>
                    )}
                  </td>
                </tr>
              </tfoot>
            </table>
          )}

          <div className="flex justify-end pt-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleAddAdjustment('')}
              className="text-xs text-gray-500 hover:text-[#00a8b0]"
            >
              <Plus className="h-3 w-3 mr-1" />
              Add adjustment (mileage, use of home, cash expense, etc.)
            </Button>
          </div>
        </CardContent>
      </Card>

      <AddAdjustmentDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSave={handleDialogSave}
        businessId={businessId}
        taxYear={taxYear}
        periodStart={periodStart}
        periodEnd={periodEnd}
        initialHmrcField={addDialogField}
        editAdjustment={editAdjustment}
      />
    </>
  )
}
