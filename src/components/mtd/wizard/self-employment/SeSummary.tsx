'use client';

import { useMemo } from 'react';
import { TrendingUp, TrendingDown, FileText, Edit2, AlertCircle } from 'lucide-react';
import type { MtdWizardState, SelfEmploymentExpenseCategory } from '@/types/mtd';
import { SELF_EMPLOYMENT_EXPENSE_CATEGORIES } from '@/types/mtd';
import { formatPeriod } from '@/lib/mtd/quarters';

interface SeSummaryProps {
  state: MtdWizardState;
  onNext: () => void;
  onBack: () => void;
  onEdit: (step: 'income' | 'expenses') => void;
}

export function SeSummary({
  state,
  onNext,
  onBack,
  onEdit,
}: SeSummaryProps) {
  const { selfEmploymentData } = state;

  // Calculate totals
  const totals = useMemo(() => {
    const turnover = selfEmploymentData?.incomes?.turnover || 0;
    const otherIncome = selfEmploymentData?.incomes?.other || 0;
    const totalIncome = turnover + otherIncome;

    let totalExpenses = 0;
    if (state.useConsolidatedExpenses) {
      totalExpenses = selfEmploymentData?.expenses?.consolidatedExpenses || 0;
    } else {
      for (const category of SELF_EMPLOYMENT_EXPENSE_CATEGORIES) {
        totalExpenses += (selfEmploymentData?.expenses as any)?.[category.key] || 0;
      }
    }

    const netProfit = totalIncome - totalExpenses;

    return { turnover, otherIncome, totalIncome, totalExpenses, netProfit };
  }, [selfEmploymentData, state.useConsolidatedExpenses]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(amount);
  };

  // Build the JSON preview
  const submissionPreview = useMemo(() => {
    const data: any = {
      incomes: {},
      expenses: {},
    };

    if (totals.turnover > 0) {
      data.incomes.turnover = totals.turnover;
    }
    if (totals.otherIncome > 0) {
      data.incomes.other = totals.otherIncome;
    }

    if (state.useConsolidatedExpenses) {
      data.expenses.consolidatedExpenses = totals.totalExpenses;
    } else {
      for (const category of SELF_EMPLOYMENT_EXPENSE_CATEGORIES) {
        const amount = (selfEmploymentData?.expenses as any)?.[category.key];
        if (amount && amount > 0) {
          data.expenses[category.key] = amount;
        }
      }
    }

    return data;
  }, [selfEmploymentData, state.useConsolidatedExpenses, totals]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Review your submission
        </h1>
        <p className="text-gray-600">
          Review your income and expenses for{' '}
          {formatPeriod(state.obligation.periodStartDate, state.obligation.periodEndDate)}{' '}
          before submitting to HMRC.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid md:grid-cols-3 gap-4">
        {/* Income */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-green-100 rounded-lg">
                <TrendingUp className="h-4 w-4 text-green-600" />
              </div>
              <span className="text-sm font-medium text-gray-700">Income</span>
            </div>
            <button
              onClick={() => onEdit('income')}
              className="p-1.5 text-gray-400 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors"
            >
              <Edit2 className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Turnover</span>
              <span className="font-medium">{formatCurrency(totals.turnover)}</span>
            </div>
            {totals.otherIncome > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Other income</span>
                <span className="font-medium">
                  {formatCurrency(totals.otherIncome)}
                </span>
              </div>
            )}
            <div className="border-t pt-2 mt-2">
              <div className="flex justify-between">
                <span className="font-semibold text-gray-900">Total</span>
                <span className="font-bold text-green-600">
                  {formatCurrency(totals.totalIncome)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Expenses */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-red-100 rounded-lg">
                <TrendingDown className="h-4 w-4 text-red-600" />
              </div>
              <span className="text-sm font-medium text-gray-700">Expenses</span>
            </div>
            <button
              onClick={() => onEdit('expenses')}
              className="p-1.5 text-gray-400 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors"
            >
              <Edit2 className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-2">
            {state.useConsolidatedExpenses ? (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Consolidated</span>
                <span className="font-medium">
                  {formatCurrency(totals.totalExpenses)}
                </span>
              </div>
            ) : (
              SELF_EMPLOYMENT_EXPENSE_CATEGORIES.filter(
                (c) => ((selfEmploymentData?.expenses as any)?.[c.key] || 0) > 0
              )
                .slice(0, 4)
                .map((category) => (
                  <div key={category.key} className="flex justify-between text-sm">
                    <span className="text-gray-600 truncate">{category.label}</span>
                    <span className="font-medium">
                      {formatCurrency(
                        (selfEmploymentData?.expenses as any)?.[category.key] || 0
                      )}
                    </span>
                  </div>
                ))
            )}
            {!state.useConsolidatedExpenses &&
              SELF_EMPLOYMENT_EXPENSE_CATEGORIES.filter(
                (c) => ((selfEmploymentData?.expenses as any)?.[c.key] || 0) > 0
              ).length > 4 && (
                <p className="text-xs text-gray-400">
                  +{' '}
                  {SELF_EMPLOYMENT_EXPENSE_CATEGORIES.filter(
                    (c) => ((selfEmploymentData?.expenses as any)?.[c.key] || 0) > 0
                  ).length - 4}{' '}
                  more categories
                </p>
              )}
            <div className="border-t pt-2 mt-2">
              <div className="flex justify-between">
                <span className="font-semibold text-gray-900">Total</span>
                <span className="font-bold text-red-600">
                  {formatCurrency(totals.totalExpenses)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Net Profit */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-5 text-white">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 bg-white/10 rounded-lg">
              <FileText className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-medium text-white/80">Net Profit</span>
          </div>

          <p
            className={`text-3xl font-bold ${
              totals.netProfit >= 0 ? 'text-green-400' : 'text-red-400'
            }`}
          >
            {formatCurrency(totals.netProfit)}
          </p>
          <p className="text-sm text-white/60 mt-1">
            This quarter
          </p>

          {state.ytdIncome !== undefined && state.ytdExpenses !== undefined && (
            <div className="mt-4 pt-4 border-t border-white/10">
              <p className="text-xs text-white/60 mb-1">Year to date</p>
              <p className="text-lg font-semibold">
                {formatCurrency(
                  (state.ytdIncome + totals.totalIncome) -
                    (state.ytdExpenses + totals.totalExpenses)
                )}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Data preview */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">
          Submission data preview
        </h3>
        <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-xs overflow-x-auto">
          {JSON.stringify(submissionPreview, null, 2)}
        </pre>
      </div>

      {/* Warning if no income */}
      {totals.totalIncome === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
            <div>
              <p className="font-medium text-amber-800">No income recorded</p>
              <p className="text-sm text-amber-600 mt-1">
                You haven't recorded any income for this period. If you had trading
                income, please go back and add it.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <button
          onClick={onBack}
          className="px-6 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
        >
          Back
        </button>
        <button
          onClick={onNext}
          className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white text-sm font-medium rounded-lg hover:from-cyan-600 hover:to-cyan-700 transition-colors"
        >
          Continue to submit
        </button>
      </div>
    </div>
  );
}
