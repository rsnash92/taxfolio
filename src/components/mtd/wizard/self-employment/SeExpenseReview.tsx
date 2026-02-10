'use client';

import { useState, useMemo } from 'react';
import { TrendingDown, ChevronDown, ChevronUp } from 'lucide-react';
import { TransactionTable } from '../shared/TransactionTable';
import { ConsolidatedToggle } from '../shared/ConsolidatedToggle';
import type {
  MtdWizardState,
  MtdTransaction,
  SelfEmploymentExpenseCategory,
} from '@/types/mtd';
import {
  SELF_EMPLOYMENT_EXPENSE_CATEGORIES,
} from '@/types/mtd';
import {
  getCategoryLabel,
  isIncomeCategory,
  aggregateByCategory,
} from '@/lib/mtd/category-mapping';

interface SeExpenseReviewProps {
  state: MtdWizardState;
  onUpdateState: (updates: Partial<MtdWizardState>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function SeExpenseReview({
  state,
  onUpdateState,
  onNext,
  onBack,
}: SeExpenseReviewProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set()
  );
  const [manualAdjustments, setManualAdjustments] = useState<
    Record<string, string>
  >({});
  const [consolidatedTotal, setConsolidatedTotal] = useState(
    state.selfEmploymentData?.expenses?.consolidatedExpenses?.toString() || ''
  );

  // Filter to expense transactions
  const expenseTransactions = useMemo(() => {
    return state.transactions
      .filter(
        (tx) =>
          tx.amount < 0 && !isIncomeCategory(tx.mtdCategory || '')
      )
      .map((tx) => ({
        ...tx,
        isExcluded: state.excludedTransactionIds.includes(tx.id),
      }));
  }, [state.transactions, state.excludedTransactionIds]);

  // Calculate totals by category
  const categoryTotals = useMemo(() => {
    const activeTransactions = expenseTransactions.filter(
      (tx) => !tx.isExcluded
    );
    return aggregateByCategory(activeTransactions, 'self-employment');
  }, [expenseTransactions]);

  // Calculate total expenses
  const totalExpenses = useMemo(() => {
    if (state.useConsolidatedExpenses) {
      return parseFloat(consolidatedTotal) || 0;
    }

    let total = 0;
    for (const category of SELF_EMPLOYMENT_EXPENSE_CATEGORIES) {
      const fromTx = categoryTotals[category.key] || 0;
      const adjustment = parseFloat(manualAdjustments[category.key] || '0') || 0;
      total += fromTx + adjustment;
    }
    return total;
  }, [state.useConsolidatedExpenses, consolidatedTotal, categoryTotals, manualAdjustments]);

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

  const toggleCategory = (categoryKey: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryKey)) {
      newExpanded.delete(categoryKey);
    } else {
      newExpanded.add(categoryKey);
    }
    setExpandedCategories(newExpanded);
  };

  const handleContinue = () => {
    if (state.useConsolidatedExpenses) {
      onUpdateState({
        selfEmploymentData: {
          ...state.selfEmploymentData,
          expenses: {
            consolidatedExpenses: parseFloat(consolidatedTotal) || 0,
          },
        },
      });
    } else {
      const expenses: Record<string, number> = {};
      for (const category of SELF_EMPLOYMENT_EXPENSE_CATEGORIES) {
        const fromTx = categoryTotals[category.key] || 0;
        const adjustment = parseFloat(manualAdjustments[category.key] || '0') || 0;
        const total = fromTx + adjustment;
        if (total > 0) {
          expenses[category.key] = total;
        }
      }
      onUpdateState({
        selfEmploymentData: {
          ...state.selfEmploymentData,
          expenses,
        },
      });
    }

    onNext();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(amount);
  };

  // Get transactions for a specific category
  const getTransactionsForCategory = (categoryKey: string) => {
    return expenseTransactions.filter((tx) => tx.mtdCategory === categoryKey);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Review your expenses
        </h1>
        <p className="text-gray-600">
          Review your business expenses by category. You can adjust totals or add
          manual amounts for each category.
        </p>
      </div>

      {/* Total expenses summary */}
      <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-xl p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <TrendingDown className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-red-700 font-medium">Total Expenses</p>
              <p className="text-xs text-red-600">
                {state.useConsolidatedExpenses
                  ? 'Consolidated total'
                  : 'Sum of all categories'}
              </p>
            </div>
          </div>
          <p className="text-2xl font-bold text-red-700">
            {formatCurrency(totalExpenses)}
          </p>
        </div>
      </div>

      {/* Consolidated toggle */}
      <ConsolidatedToggle
        isConsolidated={state.useConsolidatedExpenses}
        onToggle={(consolidated) =>
          onUpdateState({ useConsolidatedExpenses: consolidated })
        }
        totalTurnover={state.selfEmploymentData?.incomes?.turnover || 0}
      />

      {/* Consolidated input OR itemised categories */}
      {state.useConsolidatedExpenses ? (
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Total business expenses
          </label>
          <p className="text-sm text-gray-600 mb-4">
            Enter the total of all your allowable business expenses for this
            quarter.
          </p>
          <div className="relative max-w-xs">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
              £
            </span>
            <input
              type="number"
              value={consolidatedTotal}
              onChange={(e) => setConsolidatedTotal(e.target.value)}
              placeholder="0.00"
              min="0"
              step="0.01"
              className="w-full pl-8 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            />
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-900">
            Expenses by category
          </h2>

          {SELF_EMPLOYMENT_EXPENSE_CATEGORIES.map((category) => {
            const txs = getTransactionsForCategory(category.key);
            const fromTx = categoryTotals[category.key] || 0;
            const adjustment =
              parseFloat(manualAdjustments[category.key] || '0') || 0;
            const total = fromTx + adjustment;
            const isExpanded = expandedCategories.has(category.key);

            return (
              <div
                key={category.key}
                className="bg-white border border-gray-200 rounded-xl overflow-hidden"
              >
                {/* Category header */}
                <button
                  onClick={() => toggleCategory(category.key)}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-left">
                      <p className="font-medium text-gray-900">
                        {category.label}
                      </p>
                      <p className="text-xs text-gray-500">
                        {category.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        {formatCurrency(total)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {txs.filter((t) => !t.isExcluded).length} transactions
                      </p>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </button>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="border-t border-gray-200 p-4 bg-gray-50">
                    {txs.length > 0 ? (
                      <TransactionTable
                        transactions={txs}
                        businessType="self-employment"
                        showIncome={false}
                        showExpenses={true}
                        onUpdateTransaction={handleUpdateTransaction}
                        onExcludeTransaction={handleExcludeTransaction}
                      />
                    ) : (
                      <p className="text-sm text-gray-500 text-center py-4">
                        No transactions in this category
                      </p>
                    )}

                    {/* Manual adjustment */}
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Additional {category.label.toLowerCase()} (manual)
                      </label>
                      <div className="relative max-w-xs">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                          £
                        </span>
                        <input
                          type="number"
                          value={manualAdjustments[category.key] || ''}
                          onChange={(e) =>
                            setManualAdjustments({
                              ...manualAdjustments,
                              [category.key]: e.target.value,
                            })
                          }
                          placeholder="0.00"
                          min="0"
                          step="0.01"
                          className="w-full pl-8 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
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
          onClick={handleContinue}
          className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white text-sm font-medium rounded-lg hover:from-cyan-600 hover:to-cyan-700 transition-colors"
        >
          Continue to summary
        </button>
      </div>
    </div>
  );
}
