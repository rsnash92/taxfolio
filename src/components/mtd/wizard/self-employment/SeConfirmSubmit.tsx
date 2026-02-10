'use client';

import { useState } from 'react';
import { Shield, AlertTriangle, Loader2, CheckCircle } from 'lucide-react';
import type { MtdWizardState } from '@/types/mtd';
import { formatPeriod, usesCumulativePeriodSummaries } from '@/lib/mtd/quarters';
import { cn } from '@/lib/utils';

interface SeConfirmSubmitProps {
  state: MtdWizardState;
  onSubmit: () => Promise<void>;
  onBack: () => void;
}

export function SeConfirmSubmit({
  state,
  onSubmit,
  onBack,
}: SeConfirmSubmitProps) {
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isCumulative = usesCumulativePeriodSummaries(state.taxYear);

  const handleSubmit = async () => {
    if (!isConfirmed || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit');
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(amount);
  };

  const totalIncome =
    (state.selfEmploymentData?.incomes?.turnover || 0) +
    (state.selfEmploymentData?.incomes?.other || 0);

  const totalExpenses = state.useConsolidatedExpenses
    ? state.selfEmploymentData?.expenses?.consolidatedExpenses || 0
    : Object.values(state.selfEmploymentData?.expenses || {}).reduce(
        (sum, val) => sum + (typeof val === 'number' ? val : 0),
        0
      );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Confirm and submit
        </h1>
        <p className="text-gray-600">
          You're about to submit your quarterly update to HMRC for{' '}
          {formatPeriod(state.obligation.periodStartDate, state.obligation.periodEndDate)}.
        </p>
      </div>

      {/* Summary */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">
          Submission summary
        </h2>

        <div className="space-y-3">
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-sm text-gray-600">Business</span>
            <span className="text-sm font-medium text-gray-900">
              {state.businessName || 'Self-Employment'}
            </span>
          </div>

          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-sm text-gray-600">Period</span>
            <span className="text-sm font-medium text-gray-900">
              {formatPeriod(
                state.obligation.periodStartDate,
                state.obligation.periodEndDate
              )}
            </span>
          </div>

          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-sm text-gray-600">Tax year</span>
            <span className="text-sm font-medium text-gray-900">
              {state.taxYear}
            </span>
          </div>

          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-sm text-gray-600">Total income</span>
            <span className="text-sm font-medium text-green-600">
              {formatCurrency(totalIncome)}
            </span>
          </div>

          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-sm text-gray-600">Total expenses</span>
            <span className="text-sm font-medium text-gray-900">
              {formatCurrency(totalExpenses)}
            </span>
          </div>

          <div className="flex justify-between py-2">
            <span className="text-sm font-semibold text-gray-900">Net profit</span>
            <span
              className={cn(
                'text-sm font-bold',
                totalIncome - totalExpenses >= 0
                  ? 'text-green-600'
                  : 'text-red-600'
              )}
            >
              {formatCurrency(totalIncome - totalExpenses)}
            </span>
          </div>
        </div>
      </div>

      {/* API note */}
      <div className="bg-cyan-50 border border-cyan-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-cyan-600 mt-0.5" />
          <div>
            <p className="font-medium text-cyan-900">
              {isCumulative ? 'Cumulative submission' : 'Period submission'}
            </p>
            <p className="text-sm text-cyan-700 mt-1">
              {isCumulative
                ? 'For tax year 2025-26 onwards, HMRC uses cumulative period summaries. This submission will update your year-to-date totals.'
                : 'This submission covers only this specific quarter period.'}
            </p>
          </div>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
            <div>
              <p className="font-medium text-red-800">Submission failed</p>
              <p className="text-sm text-red-600 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation checkbox */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={isConfirmed}
            onChange={(e) => setIsConfirmed(e.target.checked)}
            disabled={isSubmitting}
            className="mt-1 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500"
          />
          <span className="text-sm text-gray-700">
            I confirm that the information I have provided is correct and complete
            to the best of my knowledge. I understand that HMRC may charge
            penalties if I submit inaccurate information.
          </span>
        </label>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <button
          onClick={onBack}
          disabled={isSubmitting}
          className="px-6 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50"
        >
          Back
        </button>
        <button
          onClick={handleSubmit}
          disabled={!isConfirmed || isSubmitting}
          className={cn(
            'px-6 py-2.5 text-sm font-medium rounded-lg transition-colors inline-flex items-center gap-2',
            isConfirmed && !isSubmitting
              ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 text-white hover:from-cyan-600 hover:to-cyan-700'
              : 'bg-gray-200 text-gray-500 cursor-not-allowed'
          )}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4" />
              Submit to HMRC
            </>
          )}
        </button>
      </div>
    </div>
  );
}
