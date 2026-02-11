'use client';

import { TrendingUp, TrendingDown, CheckCircle, Clock } from 'lucide-react';
import type { ObligationWithDisplayStatus } from '@/types/mtd';

interface YearSummaryBarProps {
  taxYear: string;
  obligations: ObligationWithDisplayStatus[];
  ytdIncome?: number;
  ytdExpenses?: number;
}

export function YearSummaryBar({
  taxYear,
  obligations,
  ytdIncome,
  ytdExpenses,
}: YearSummaryBarProps) {
  // Filter obligations to current tax year only for the summary
  // In sandbox mode, show all obligations since HMRC returns historical test data
  const isSandbox = process.env.NEXT_PUBLIC_HMRC_ENVIRONMENT === 'sandbox' ||
    process.env.NEXT_PUBLIC_APP_URL?.includes('localhost');

  const currentYearObligations = isSandbox
    ? obligations
    : obligations.filter((o) => {
        // Parse the tax year (e.g., "2025-26") to get the start year
        const [startYear] = taxYear.split('-').map(Number);
        const taxYearStart = new Date(startYear, 3, 6); // April 6
        const taxYearEnd = new Date(startYear + 1, 3, 5); // April 5 next year

        const periodStart = new Date(o.periodStartDate);
        return periodStart >= taxYearStart && periodStart <= taxYearEnd;
      });

  const totalObligations = currentYearObligations.length;
  const fulfilledObligations = currentYearObligations.filter(
    (o) => o.displayStatus === 'fulfilled'
  ).length;
  const overdueObligations = currentYearObligations.filter(
    (o) => o.displayStatus === 'overdue'
  ).length;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">
          Tax Year {taxYear}
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-300">
            {fulfilledObligations} of {totalObligations} quarters submitted
          </span>
          {overdueObligations > 0 && (
            <span className="px-2 py-0.5 bg-red-500/20 text-red-300 text-xs font-medium rounded-full">
              {overdueObligations} overdue
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Progress */}
        <div className="bg-white/5 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle className="h-4 w-4 text-cyan-400" />
            <span className="text-xs text-slate-400 uppercase tracking-wide">
              Progress
            </span>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-2xl font-bold text-white">
              {totalObligations > 0 ? Math.round((fulfilledObligations / totalObligations) * 100) : 0}%
            </span>
            <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden mb-1">
              <div
                className="h-full bg-cyan-400 rounded-full transition-all duration-500"
                style={{
                  width: `${totalObligations > 0 ? (fulfilledObligations / totalObligations) * 100 : 0}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Remaining */}
        <div className="bg-white/5 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="h-4 w-4 text-amber-400" />
            <span className="text-xs text-slate-400 uppercase tracking-wide">
              Remaining
            </span>
          </div>
          <span className="text-2xl font-bold text-white">
            {totalObligations - fulfilledObligations}
          </span>
          <span className="text-sm text-slate-400 ml-1">quarters</span>
        </div>

        {/* YTD Income */}
        {ytdIncome !== undefined && (
          <div className="bg-white/5 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-green-400" />
              <span className="text-xs text-slate-400 uppercase tracking-wide">
                YTD Income
              </span>
            </div>
            <span className="text-2xl font-bold text-white">
              {formatCurrency(ytdIncome)}
            </span>
          </div>
        )}

        {/* YTD Expenses */}
        {ytdExpenses !== undefined && (
          <div className="bg-white/5 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="h-4 w-4 text-red-400" />
              <span className="text-xs text-slate-400 uppercase tracking-wide">
                YTD Expenses
              </span>
            </div>
            <span className="text-2xl font-bold text-white">
              {formatCurrency(ytdExpenses)}
            </span>
          </div>
        )}

        {/* Net Profit (if both available) */}
        {ytdIncome !== undefined && ytdExpenses !== undefined && (
          <div className="bg-white/5 rounded-lg p-3 md:col-span-2">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-slate-400 uppercase tracking-wide">
                Net Profit
              </span>
            </div>
            <span
              className={`text-2xl font-bold ${
                ytdIncome - ytdExpenses >= 0 ? 'text-green-400' : 'text-red-400'
              }`}
            >
              {formatCurrency(ytdIncome - ytdExpenses)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
