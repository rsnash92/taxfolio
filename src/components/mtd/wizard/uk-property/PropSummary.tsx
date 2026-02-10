'use client';

import { useMemo } from 'react';
import { Home, TrendingDown, FileText, Edit2, AlertCircle } from 'lucide-react';
import type { MtdWizardState } from '@/types/mtd';
import { UK_PROPERTY_EXPENSE_CATEGORIES } from '@/types/mtd';
import { formatPeriod } from '@/lib/mtd/quarters';

interface PropSummaryProps {
  state: MtdWizardState;
  onNext: () => void;
  onBack: () => void;
  onEdit: (step: 'income' | 'expenses') => void;
}

export function PropSummary({
  state,
  onNext,
  onBack,
  onEdit,
}: PropSummaryProps) {
  const { ukPropertyData } = state;

  // Calculate totals
  const totals = useMemo(() => {
    const income = ukPropertyData?.income || {};
    const totalIncome =
      (income.periodAmount || 0) +
      (income.premiumsOfLeaseGrant || 0) +
      (income.reversePremiums || 0) +
      (income.otherIncome || 0) +
      (income.rentARoom?.rentsReceived || 0);

    let totalExpenses = 0;
    if (state.useConsolidatedExpenses) {
      totalExpenses = ukPropertyData?.expenses?.consolidatedExpenses || 0;
    } else {
      for (const category of UK_PROPERTY_EXPENSE_CATEGORIES) {
        totalExpenses += (ukPropertyData?.expenses as any)?.[category.key] || 0;
      }
    }

    const netProfit = totalIncome - totalExpenses;

    return { totalIncome, totalExpenses, netProfit, income };
  }, [ukPropertyData, state.useConsolidatedExpenses]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(amount);
  };

  // Build the JSON preview
  const submissionPreview = useMemo(() => {
    const data: any = {
      income: {},
      expenses: {},
    };

    const income = ukPropertyData?.income;
    if (income) {
      if (income.periodAmount) data.income.periodAmount = income.periodAmount;
      if (income.premiumsOfLeaseGrant)
        data.income.premiumsOfLeaseGrant = income.premiumsOfLeaseGrant;
      if (income.reversePremiums)
        data.income.reversePremiums = income.reversePremiums;
      if (income.otherIncome) data.income.otherIncome = income.otherIncome;
      if (income.taxDeducted) data.income.taxDeducted = income.taxDeducted;
      if (income.rentARoom?.rentsReceived) {
        data.income.rentARoom = { rentsReceived: income.rentARoom.rentsReceived };
      }
    }

    if (state.useConsolidatedExpenses) {
      data.expenses.consolidatedExpenses = totals.totalExpenses;
    } else {
      for (const category of UK_PROPERTY_EXPENSE_CATEGORIES) {
        const amount = (ukPropertyData?.expenses as any)?.[category.key];
        if (amount && amount > 0) {
          data.expenses[category.key] = amount;
        }
      }
    }

    return data;
  }, [ukPropertyData, state.useConsolidatedExpenses, totals]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Review your submission
        </h1>
        <p className="text-gray-600">
          Review your property income and expenses for{' '}
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
                <Home className="h-4 w-4 text-green-600" />
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
            {totals.income.periodAmount && totals.income.periodAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Rental income</span>
                <span className="font-medium">
                  {formatCurrency(totals.income.periodAmount)}
                </span>
              </div>
            )}
            {totals.income.rentARoom?.rentsReceived &&
              totals.income.rentARoom.rentsReceived > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Rent a Room</span>
                  <span className="font-medium">
                    {formatCurrency(totals.income.rentARoom.rentsReceived)}
                  </span>
                </div>
              )}
            {totals.income.premiumsOfLeaseGrant &&
              totals.income.premiumsOfLeaseGrant > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Lease premiums</span>
                  <span className="font-medium">
                    {formatCurrency(totals.income.premiumsOfLeaseGrant)}
                  </span>
                </div>
              )}
            {totals.income.otherIncome && totals.income.otherIncome > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Other income</span>
                <span className="font-medium">
                  {formatCurrency(totals.income.otherIncome)}
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
              UK_PROPERTY_EXPENSE_CATEGORIES.filter(
                (c) => ((ukPropertyData?.expenses as any)?.[c.key] || 0) > 0
              )
                .slice(0, 4)
                .map((category) => (
                  <div key={category.key} className="flex justify-between text-sm">
                    <span className="text-gray-600 truncate">{category.label}</span>
                    <span className="font-medium">
                      {formatCurrency(
                        (ukPropertyData?.expenses as any)?.[category.key] || 0
                      )}
                    </span>
                  </div>
                ))
            )}
            {!state.useConsolidatedExpenses &&
              UK_PROPERTY_EXPENSE_CATEGORIES.filter(
                (c) => ((ukPropertyData?.expenses as any)?.[c.key] || 0) > 0
              ).length > 4 && (
                <p className="text-xs text-gray-400">
                  +{' '}
                  {UK_PROPERTY_EXPENSE_CATEGORIES.filter(
                    (c) => ((ukPropertyData?.expenses as any)?.[c.key] || 0) > 0
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
            <span className="text-sm font-medium text-white/80">
              Net Property Income
            </span>
          </div>

          <p
            className={`text-3xl font-bold ${
              totals.netProfit >= 0 ? 'text-green-400' : 'text-red-400'
            }`}
          >
            {formatCurrency(totals.netProfit)}
          </p>
          <p className="text-sm text-white/60 mt-1">
            {totals.netProfit >= 0 ? 'Profit' : 'Loss'} this quarter
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

      {/* Tax deducted note */}
      {totals.income.taxDeducted && totals.income.taxDeducted > 0 && (
        <div className="bg-cyan-50 border border-cyan-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-cyan-600 mt-0.5" />
            <div>
              <p className="font-medium text-cyan-900">Tax already deducted</p>
              <p className="text-sm text-cyan-700 mt-1">
                You've indicated {formatCurrency(totals.income.taxDeducted)} was
                deducted at source. This will be taken into account in your tax
                calculation.
              </p>
            </div>
          </div>
        </div>
      )}

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
                You haven't recorded any property income for this period. If you
                received rental income, please go back and add it.
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
