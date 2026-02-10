'use client';

import { useState, useMemo } from 'react';
import { TrendingUp, Home, Info } from 'lucide-react';
import { TransactionTable } from '../shared/TransactionTable';
import type { MtdWizardState, MtdTransaction } from '@/types/mtd';

interface PropIncomeReviewProps {
  state: MtdWizardState;
  onUpdateState: (updates: Partial<MtdWizardState>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function PropIncomeReview({
  state,
  onUpdateState,
  onNext,
  onBack,
}: PropIncomeReviewProps) {
  const [formData, setFormData] = useState({
    periodAmount: state.ukPropertyData?.income?.periodAmount?.toString() || '',
    premiumsOfLeaseGrant:
      state.ukPropertyData?.income?.premiumsOfLeaseGrant?.toString() || '',
    reversePremiums:
      state.ukPropertyData?.income?.reversePremiums?.toString() || '',
    otherIncome: state.ukPropertyData?.income?.otherIncome?.toString() || '',
    taxDeducted: state.ukPropertyData?.income?.taxDeducted?.toString() || '',
    rentARoomIncome:
      state.ukPropertyData?.income?.rentARoom?.rentsReceived?.toString() || '',
  });

  // Filter to income transactions (positive amounts)
  const incomeTransactions = useMemo(() => {
    return state.transactions.filter(
      (tx) =>
        tx.amount > 0 ||
        tx.mtdCategory === 'rental-income' ||
        tx.mtdCategory === 'rent-a-room' ||
        tx.mtdCategory === 'other-income'
    );
  }, [state.transactions]);

  // Calculate totals from transactions
  const transactionTotals = useMemo(() => {
    const activeTransactions = incomeTransactions.filter(
      (tx) => !state.excludedTransactionIds.includes(tx.id)
    );

    let rentalIncome = 0;
    let rentARoom = 0;
    let otherIncome = 0;

    for (const tx of activeTransactions) {
      const amount = Math.abs(tx.amount);
      if (tx.mtdCategory === 'rent-a-room') {
        rentARoom += amount;
      } else if (tx.mtdCategory === 'other-income') {
        otherIncome += amount;
      } else {
        rentalIncome += amount;
      }
    }

    return { rentalIncome, rentARoom, otherIncome };
  }, [incomeTransactions, state.excludedTransactionIds]);

  // Calculate total income
  const totalIncome = useMemo(() => {
    const periodAmount =
      parseFloat(formData.periodAmount) || transactionTotals.rentalIncome;
    const premiums = parseFloat(formData.premiumsOfLeaseGrant) || 0;
    const reverse = parseFloat(formData.reversePremiums) || 0;
    const other =
      parseFloat(formData.otherIncome) || transactionTotals.otherIncome;
    const rentARoom =
      parseFloat(formData.rentARoomIncome) || transactionTotals.rentARoom;

    return periodAmount + premiums + reverse + other + rentARoom;
  }, [formData, transactionTotals]);

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
    const income: any = {};

    const periodAmount =
      parseFloat(formData.periodAmount) || transactionTotals.rentalIncome;
    if (periodAmount > 0) income.periodAmount = periodAmount;

    const premiums = parseFloat(formData.premiumsOfLeaseGrant);
    if (premiums > 0) income.premiumsOfLeaseGrant = premiums;

    const reverse = parseFloat(formData.reversePremiums);
    if (reverse > 0) income.reversePremiums = reverse;

    const other = parseFloat(formData.otherIncome) || transactionTotals.otherIncome;
    if (other > 0) income.otherIncome = other;

    const taxDeducted = parseFloat(formData.taxDeducted);
    if (taxDeducted > 0) income.taxDeducted = taxDeducted;

    const rentARoom =
      parseFloat(formData.rentARoomIncome) || transactionTotals.rentARoom;
    if (rentARoom > 0) {
      income.rentARoom = { rentsReceived: rentARoom };
    }

    onUpdateState({
      ukPropertyData: {
        ...state.ukPropertyData,
        income,
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
          Review your property income
        </h1>
        <p className="text-gray-600">
          Review and enter your rental income for this quarter. Your bank
          transactions are shown below to help you verify the amounts.
        </p>
      </div>

      {/* Total income summary */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Home className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-green-700 font-medium">
                Total Property Income
              </p>
              <p className="text-xs text-green-600">This quarter</p>
            </div>
          </div>
          <p className="text-2xl font-bold text-green-700">
            {formatCurrency(totalIncome)}
          </p>
        </div>
      </div>

      {/* Income fields */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-5">
        <h2 className="text-lg font-semibold text-gray-900">Income breakdown</h2>

        {/* Rental income */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Total rents from property
          </label>
          <p className="text-xs text-gray-500 mb-2">
            Main rental income received (detected from transactions:{' '}
            {formatCurrency(transactionTotals.rentalIncome)})
          </p>
          <div className="relative max-w-xs">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
              £
            </span>
            <input
              type="number"
              value={formData.periodAmount}
              onChange={(e) =>
                setFormData({ ...formData, periodAmount: e.target.value })
              }
              placeholder={transactionTotals.rentalIncome.toFixed(2)}
              min="0"
              step="0.01"
              className="w-full pl-8 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Rent a Room */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Rent a Room income
          </label>
          <p className="text-xs text-gray-500 mb-2">
            Income from letting furnished rooms in your main home (up to £7,500
            tax-free)
          </p>
          <div className="relative max-w-xs">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
              £
            </span>
            <input
              type="number"
              value={formData.rentARoomIncome}
              onChange={(e) =>
                setFormData({ ...formData, rentARoomIncome: e.target.value })
              }
              placeholder={transactionTotals.rentARoom.toFixed(2)}
              min="0"
              step="0.01"
              className="w-full pl-8 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Premiums */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Premiums for granting a lease
          </label>
          <p className="text-xs text-gray-500 mb-2">
            One-off payments received for granting a lease
          </p>
          <div className="relative max-w-xs">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
              £
            </span>
            <input
              type="number"
              value={formData.premiumsOfLeaseGrant}
              onChange={(e) =>
                setFormData({ ...formData, premiumsOfLeaseGrant: e.target.value })
              }
              placeholder="0.00"
              min="0"
              step="0.01"
              className="w-full pl-8 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Other income */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Other property income
          </label>
          <p className="text-xs text-gray-500 mb-2">
            Any other income from your property business
          </p>
          <div className="relative max-w-xs">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
              £
            </span>
            <input
              type="number"
              value={formData.otherIncome}
              onChange={(e) =>
                setFormData({ ...formData, otherIncome: e.target.value })
              }
              placeholder={transactionTotals.otherIncome.toFixed(2)}
              min="0"
              step="0.01"
              className="w-full pl-8 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Tax deducted */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tax already deducted
          </label>
          <p className="text-xs text-gray-500 mb-2">
            Tax deducted at source (e.g., from non-resident landlord scheme)
          </p>
          <div className="relative max-w-xs">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
              £
            </span>
            <input
              type="number"
              value={formData.taxDeducted}
              onChange={(e) =>
                setFormData({ ...formData, taxDeducted: e.target.value })
              }
              placeholder="0.00"
              min="0"
              step="0.01"
              className="w-full pl-8 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Transaction table */}
      {incomeTransactions.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Income transactions
          </h2>
          <TransactionTable
            transactions={incomeTransactions.map((tx) => ({
              ...tx,
              isExcluded: state.excludedTransactionIds.includes(tx.id),
            }))}
            businessType="uk-property"
            showIncome={true}
            showExpenses={false}
            onUpdateTransaction={handleUpdateTransaction}
            onExcludeTransaction={handleExcludeTransaction}
          />
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
          Continue to expenses
        </button>
      </div>
    </div>
  );
}
