'use client';

import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { motion } from 'framer-motion';
import { EmptyState } from './EmptyState';
import { Building2 } from 'lucide-react';
import type { YtdSummaryData } from '@/types/dashboard';

interface YearToDateSummaryProps {
  summary: YtdSummaryData;
  hasBankConnection: boolean;
}

export function YearToDateSummary({ summary, hasBankConnection }: YearToDateSummaryProps) {
  if (!hasBankConnection) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <EmptyState
          icon={<Building2 className="h-6 w-6 text-gray-400" />}
          title="Connect your bank"
          description="Link your bank account to see year-to-date income, expenses, and estimated tax."
          action={{ label: 'Connect Bank', href: '/api/truelayer/auth/authorize' }}
        />
      </motion.div>
    );
  }

  const hasData = summary.totalIncome > 0 || summary.totalExpenses > 0;

  if (!hasData) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <Card>
          <CardContent>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
              Year to Date
            </h3>
            <p className="text-sm text-gray-400">
              No confirmed transactions yet. Review your transactions to see your year-to-date summary.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  const yoyText = summary.yoyChange !== null
    ? summary.yoyChange < 0
      ? `↓ ${formatCurrency(Math.abs(summary.yoyChange))} less than last year`
      : `↑ ${formatCurrency(summary.yoyChange)} more than last year`
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
    >
      <Card>
        <CardContent>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
            Year to Date
          </h3>

          <div className="space-y-4">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Total Income</p>
              <p className="text-xl font-bold font-mono text-gray-900">
                {formatCurrency(summary.totalIncome)}
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Total Expenses</p>
              <p className="text-xl font-bold font-mono text-gray-900">
                {formatCurrency(summary.totalExpenses)}
              </p>
            </div>

            <div className="h-px bg-gray-200" />

            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Estimated Tax</p>
              <p className="text-2xl font-bold font-mono text-[#00e3ec]">
                {formatCurrency(summary.estimatedTax)}
              </p>
              {yoyText && (
                <p className={`text-xs mt-1 ${summary.yoyChange !== null && summary.yoyChange < 0 ? 'text-green-600' : 'text-amber-600'}`}>
                  {yoyText}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
