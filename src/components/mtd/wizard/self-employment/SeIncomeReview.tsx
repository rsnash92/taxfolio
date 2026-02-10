'use client';

import { useState, useMemo } from 'react';
import { TrendingUp, Plus, Info } from 'lucide-react';
import { TransactionTable } from '../shared/TransactionTable';
import type { MtdWizardState, MtdTransaction } from '@/types/mtd';
import { isIncomeCategory } from '@/lib/mtd/category-mapping';

interface SeIncomeReviewProps {
  state: MtdWizardState;
  onUpdateState: (updates: Partial<MtdWizardState>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function SeIncomeReview({
  state,
  onUpdateState,
  onNext,
  onBack,
}: SeIncomeReviewProps) {
  const [otherIncome, setOtherIncome] = useState(
    state.selfEmploymentData?.incomes?.other?.toString() || ''
  );

  // Filter to income transactions
  const incomeTransactions = useMemo(() => {
    return state.transactions.filter(
      (tx) =>
        tx.amount > 0 || isIncomeCategory(tx.mtdCategory || '')
    );
  }, [state.transactions]);

  // Calculate totals
  const { totalTurnover, totalFromTransactions } = useMemo(() => {
    const fromTx = incomeTransactions
      .filter((tx) => !state.excludedTransactionIds.includes(tx.id))
      .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

    const other = parseFloat(otherIncome) || 0;

    return {
      totalTurnover: fromTx,
      totalFromTransactions: fromTx,
    };
  }, [incomeTransactions, state.excludedTransactionIds, otherIncome]);

  const handleUpdateTransaction = (id: string, updates: Partial<MtdTransaction>) => {
    const updatedTransactions = state.transactions.map((tx) =>
      tx.id === id ? { ...tx, ...updates } : tx
    );
    onUpdateState({ transactions: updatedTransactions });
  };

  const handleExcludeTransaction = (id: string, exclude: boolean) => {
    const excludedIds = exclude
      ? [...state.excludedTransactionIds, id]
      : state.excludedTransactionIds.filter((i) => i !== id);
    onUpdateState({ excludedTransactionIds: excludedIds });
  };

  const handleContinue = () => {
    const other = parseFloat(otherIncome) || 0;

    onUpdateState({
      selfEmploymentData: {
        ...state.selfEmploymentData,
        incomes: {
          turnover: totalTurnover,
          other: other > 0 ? other : undefined,
        },
      },
    });

    onNext();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Review your income
        </h1>
        <p className="text-gray-600">
          Review and categorise your business income for this quarter. Exclude any
          transactions that aren't business income.
        </p>
      </div>

      {/* Turnover summary */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-green-700 font-medium">
                Total Turnover (from transactions)
              </p>
              <p className="text-xs text-green-600">
                This is your main trading income for the quarter
              </p>
            </div>
          </div>
          <p className="text-2xl font-bold text-green-700">
            {formatCurrency(totalTurnover)}
          </p>
        </div>
      </div>

      {/* Transaction table */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Income transactions
        </h2>
        <TransactionTable
          transactions={incomeTransactions.map((tx) => ({
            ...tx,
            isExcluded: state.excludedTransactionIds.includes(tx.id),
          }))}
          businessType="self-employment"
          showIncome={true}
          showExpenses={false}
          onUpdateTransaction={handleUpdateTransaction}
          onExcludeTransaction={handleExcludeTransaction}
        />
      </div>

      {/* Other income */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex items-start gap-3 mb-4">
          <Info className="h-5 w-5 text-gray-400 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-gray-900">
              Other business income
            </h3>
            <p className="text-sm text-gray-600">
              Include any other income not shown in your bank transactions (e.g.,
              cash payments, refunds, or income from other sources).
            </p>
          </div>
        </div>

        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
            £
          </span>
          <input
            type="number"
            value={otherIncome}
            onChange={(e) => setOtherIncome(e.target.value)}
            placeholder="0.00"
            min="0"
            step="0.01"
            className="w-full pl-8 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Total summary */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">
          Income Summary
        </h3>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Turnover (from transactions)</span>
            <span className="font-medium text-gray-900">
              {formatCurrency(totalTurnover)}
            </span>
          </div>
          {parseFloat(otherIncome) > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Other income</span>
              <span className="font-medium text-gray-900">
                {formatCurrency(parseFloat(otherIncome))}
              </span>
            </div>
          )}
          <div className="border-t border-gray-200 pt-2 mt-2">
            <div className="flex justify-between">
              <span className="font-semibold text-gray-900">Total Income</span>
              <span className="font-bold text-green-600">
                {formatCurrency(totalTurnover + (parseFloat(otherIncome) || 0))}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <button
          onClick={onBack}
          className="px-6 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
        >
          Back
        </button>
        <button
          onClick={handleContinue}
          className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white text-sm font-medium rounded-lg hover:from-cyan-600 hover:to-cyan-700 transition-colors"
        >
          Continue to expenses
        </button>
      </div>
    </div>
  );
}
