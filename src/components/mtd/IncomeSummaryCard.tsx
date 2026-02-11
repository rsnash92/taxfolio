'use client';

import { TrendingUp, TrendingDown, Calculator } from 'lucide-react';
import type { BissSummaryResponse } from '@/types/mtd';

interface IncomeSummaryCardProps {
  summary: BissSummaryResponse;
  businessName?: string;
  taxYear: string;
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

export function IncomeSummaryCard({ summary, businessName, taxYear }: IncomeSummaryCardProps) {
  const netProfit = summary.profit.net;
  const isProfit = netProfit >= 0;

  return (
    <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-white">
            {businessName || 'Business'} — {taxYear}
          </h2>
          <p className="text-sm text-slate-400">Annual income source summary</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Income */}
        <div className="bg-white/5 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="h-4 w-4 text-green-400" />
            <span className="text-xs text-slate-400 uppercase tracking-wide">
              Income
            </span>
          </div>
          <span className="text-2xl font-bold text-white">
            {formatCurrency(summary.total.income)}
          </span>
        </div>

        {/* Total Expenses */}
        <div className="bg-white/5 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <TrendingDown className="h-4 w-4 text-red-400" />
            <span className="text-xs text-slate-400 uppercase tracking-wide">
              Expenses
            </span>
          </div>
          <span className="text-2xl font-bold text-white">
            {formatCurrency(summary.total.expenses)}
          </span>
        </div>

        {/* Net Profit / Loss */}
        <div className="bg-white/5 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Calculator className="h-4 w-4 text-cyan-400" />
            <span className="text-xs text-slate-400 uppercase tracking-wide">
              {isProfit ? 'Net Profit' : 'Net Loss'}
            </span>
          </div>
          <span className={`text-2xl font-bold ${isProfit ? 'text-green-400' : 'text-red-400'}`}>
            {formatCurrency(Math.abs(netProfit))}
          </span>
        </div>

        {/* Taxable */}
        <div className="bg-white/5 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-slate-400 uppercase tracking-wide">
              Taxable {isProfit ? 'Profit' : 'Loss'}
            </span>
          </div>
          <span className="text-2xl font-bold text-white">
            {formatCurrency(isProfit ? summary.profit.taxable : summary.loss.taxable)}
          </span>
        </div>
      </div>

      {/* Adjustments row if present */}
      {(summary.total.additions || summary.total.deductions || summary.total.accountingAdjustments) && (
        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-white/10">
          {summary.total.additions !== undefined && summary.total.additions > 0 && (
            <div className="text-center">
              <span className="text-xs text-slate-400 block">Additions</span>
              <span className="text-sm font-medium text-white">{formatCurrency(summary.total.additions)}</span>
            </div>
          )}
          {summary.total.deductions !== undefined && summary.total.deductions > 0 && (
            <div className="text-center">
              <span className="text-xs text-slate-400 block">Deductions</span>
              <span className="text-sm font-medium text-white">{formatCurrency(summary.total.deductions)}</span>
            </div>
          )}
          {summary.total.accountingAdjustments !== undefined && summary.total.accountingAdjustments !== 0 && (
            <div className="text-center">
              <span className="text-xs text-slate-400 block">Adjustments</span>
              <span className="text-sm font-medium text-white">{formatCurrency(summary.total.accountingAdjustments)}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
