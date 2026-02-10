'use client';

import { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Edit2,
  X,
  Plus,
  Search,
  Filter,
} from 'lucide-react';
import type { MtdTransaction, BusinessType } from '@/types/mtd';
import { getCategoryLabel, isIncomeCategory } from '@/lib/mtd/category-mapping';
import { cn } from '@/lib/utils';
import { CategorySelector } from './CategorySelector';

interface TransactionTableProps {
  transactions: MtdTransaction[];
  businessType: BusinessType;
  showIncome?: boolean;
  showExpenses?: boolean;
  onUpdateTransaction: (id: string, updates: Partial<MtdTransaction>) => void;
  onExcludeTransaction: (id: string, exclude: boolean) => void;
  onAddManualTransaction?: () => void;
}

type SortField = 'date' | 'description' | 'amount' | 'category';
type SortDirection = 'asc' | 'desc';

export function TransactionTable({
  transactions,
  businessType,
  showIncome = true,
  showExpenses = true,
  onUpdateTransaction,
  onExcludeTransaction,
  onAddManualTransaction,
}: TransactionTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showExcluded, setShowExcluded] = useState(false);

  // Filter transactions
  const filteredTransactions = transactions.filter((tx) => {
    // Filter by income/expense
    const isIncome = tx.amount > 0 || isIncomeCategory(tx.mtdCategory || '');
    if (showIncome && !showExpenses && !isIncome) return false;
    if (showExpenses && !showIncome && isIncome) return false;

    // Filter excluded
    if (!showExcluded && tx.isExcluded) return false;

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        tx.description?.toLowerCase().includes(search) ||
        tx.merchantName?.toLowerCase().includes(search) ||
        getCategoryLabel(tx.mtdCategory || '').toLowerCase().includes(search)
      );
    }

    return true;
  });

  // Sort transactions
  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    let comparison = 0;

    switch (sortField) {
      case 'date':
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
        break;
      case 'description':
        comparison = (a.description || '').localeCompare(b.description || '');
        break;
      case 'amount':
        comparison = Math.abs(a.amount) - Math.abs(b.amount);
        break;
      case 'category':
        comparison = (a.mtdCategory || '').localeCompare(b.mtdCategory || '');
        break;
    }

    return sortDirection === 'asc' ? comparison : -comparison;
  });

  // Calculate totals
  const totals = filteredTransactions.reduce(
    (acc, tx) => {
      if (tx.isExcluded) return acc;
      if (tx.amount > 0 || isIncomeCategory(tx.mtdCategory || '')) {
        acc.income += Math.abs(tx.amount);
      } else {
        acc.expenses += Math.abs(tx.amount);
      }
      return acc;
    },
    { income: 0, expenses: 0 }
  );

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? (
      <ChevronUp className="h-4 w-4" />
    ) : (
      <ChevronDown className="h-4 w-4" />
    );
  };

  return (
    <div className="space-y-4">
      {/* Search and filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
          />
        </div>

        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
          <input
            type="checkbox"
            checked={showExcluded}
            onChange={(e) => setShowExcluded(e.target.checked)}
            className="rounded border-gray-300 text-cyan-600 focus:ring-cyan-500"
          />
          Show excluded
        </label>

        {onAddManualTransaction && (
          <button
            onClick={onAddManualTransaction}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-cyan-600 hover:text-cyan-700 hover:bg-cyan-50 rounded-lg transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add manual
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('date')}
                >
                  <div className="flex items-center gap-1">
                    Date
                    <SortIcon field="date" />
                  </div>
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('description')}
                >
                  <div className="flex items-center gap-1">
                    Description
                    <SortIcon field="description" />
                  </div>
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('category')}
                >
                  <div className="flex items-center gap-1">
                    Category
                    <SortIcon field="category" />
                  </div>
                </th>
                <th
                  className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wide cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('amount')}
                >
                  <div className="flex items-center justify-end gap-1">
                    Amount
                    <SortIcon field="amount" />
                  </div>
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sortedTransactions.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-gray-500"
                  >
                    No transactions found
                  </td>
                </tr>
              ) : (
                sortedTransactions.map((tx) => (
                  <tr
                    key={tx.id}
                    className={cn(
                      'hover:bg-gray-50 transition-colors',
                      tx.isExcluded && 'opacity-50 bg-gray-50'
                    )}
                  >
                    <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                      {formatDate(tx.date)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-900 truncate max-w-xs">
                          {tx.merchantName || tx.description}
                        </span>
                        {tx.merchantName && tx.description && (
                          <span className="text-xs text-gray-500 truncate max-w-xs">
                            {tx.description}
                          </span>
                        )}
                        <span className="text-xs text-gray-400">
                          {tx.accountName}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {editingId === tx.id ? (
                        <CategorySelector
                          businessType={businessType === 'uk-property' ? 'uk-property' : 'self-employment'}
                          value={tx.mtdCategory}
                          onChange={(category) => {
                            onUpdateTransaction(tx.id, { mtdCategory: category as any });
                            setEditingId(null);
                          }}
                          showIncome={showIncome}
                        />
                      ) : (
                        <button
                          onClick={() => setEditingId(tx.id)}
                          className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-cyan-600"
                        >
                          {getCategoryLabel(tx.mtdCategory || 'Uncategorised')}
                          <Edit2 className="h-3 w-3 opacity-50" />
                        </button>
                      )}
                    </td>
                    <td
                      className={cn(
                        'px-4 py-3 text-sm font-medium text-right whitespace-nowrap',
                        tx.amount > 0 || isIncomeCategory(tx.mtdCategory || '')
                          ? 'text-green-600'
                          : 'text-gray-900'
                      )}
                    >
                      {tx.amount > 0 && '+'}
                      {formatCurrency(tx.amount)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => onExcludeTransaction(tx.id, !tx.isExcluded)}
                        className={cn(
                          'p-1.5 rounded-lg transition-colors',
                          tx.isExcluded
                            ? 'text-cyan-600 hover:bg-cyan-50'
                            : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                        )}
                        title={tx.isExcluded ? 'Include transaction' : 'Exclude transaction'}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Totals row */}
        <div className="bg-gray-50 border-t border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">
              {filteredTransactions.filter((t) => !t.isExcluded).length} transactions
            </span>
            <div className="flex items-center gap-6">
              {showIncome && (
                <div className="text-right">
                  <span className="text-xs text-gray-500 block">Income</span>
                  <span className="text-sm font-semibold text-green-600">
                    {formatCurrency(totals.income)}
                  </span>
                </div>
              )}
              {showExpenses && (
                <div className="text-right">
                  <span className="text-xs text-gray-500 block">Expenses</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {formatCurrency(totals.expenses)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
