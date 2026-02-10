'use client';

import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConsolidatedToggleProps {
  isConsolidated: boolean;
  onToggle: (consolidated: boolean) => void;
  totalTurnover: number;
  disabled?: boolean;
}

const TURNOVER_THRESHOLD = 90000;

export function ConsolidatedToggle({
  isConsolidated,
  onToggle,
  totalTurnover,
  disabled = false,
}: ConsolidatedToggleProps) {
  const isEligible = totalTurnover < TURNOVER_THRESHOLD;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
      <div className="flex items-start gap-4">
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-gray-900 mb-1">
            Expense reporting method
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            {isEligible
              ? 'You can choose to report your expenses as a single total (simplified) or itemised by category.'
              : `Your turnover (${formatCurrency(totalTurnover)}) exceeds £90,000, so you must report itemised expenses.`}
          </p>

          <div className="flex items-center gap-4">
            <label
              className={cn(
                'flex items-center gap-2 cursor-pointer',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              <input
                type="radio"
                name="expenseMethod"
                checked={!isConsolidated}
                onChange={() => onToggle(false)}
                disabled={disabled}
                className="w-4 h-4 text-cyan-600 border-gray-300 focus:ring-cyan-500"
              />
              <span className="text-sm font-medium text-gray-900">
                Itemised expenses
              </span>
            </label>

            <label
              className={cn(
                'flex items-center gap-2',
                isEligible && !disabled ? 'cursor-pointer' : 'opacity-50 cursor-not-allowed'
              )}
            >
              <input
                type="radio"
                name="expenseMethod"
                checked={isConsolidated}
                onChange={() => isEligible && onToggle(true)}
                disabled={!isEligible || disabled}
                className="w-4 h-4 text-cyan-600 border-gray-300 focus:ring-cyan-500"
              />
              <span className="text-sm font-medium text-gray-900">
                Consolidated total
              </span>
            </label>
          </div>
        </div>

        <div className="flex-shrink-0">
          <div
            className={cn(
              'w-10 h-10 rounded-full flex items-center justify-center',
              isEligible ? 'bg-cyan-100' : 'bg-gray-200'
            )}
          >
            <Info
              className={cn(
                'h-5 w-5',
                isEligible ? 'text-cyan-600' : 'text-gray-400'
              )}
            />
          </div>
        </div>
      </div>

      {/* Info box for consolidated */}
      {isConsolidated && isEligible && (
        <div className="mt-4 bg-cyan-50 border border-cyan-200 rounded-lg p-3">
          <p className="text-sm text-cyan-800">
            <strong>Consolidated expenses:</strong> You'll report a single total for all
            your business expenses. This is simpler but provides less detail to HMRC.
          </p>
        </div>
      )}

      {/* Warning if near threshold */}
      {!isConsolidated && totalTurnover > TURNOVER_THRESHOLD * 0.8 && totalTurnover < TURNOVER_THRESHOLD && (
        <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-3">
          <p className="text-sm text-amber-800">
            <strong>Note:</strong> Your turnover ({formatCurrency(totalTurnover)}) is
            approaching £90,000. If it exceeds this threshold, you must use itemised
            expenses.
          </p>
        </div>
      )}
    </div>
  );
}
