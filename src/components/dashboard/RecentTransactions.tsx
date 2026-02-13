'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { EmptyState } from './EmptyState';
import { Building2, RefreshCw, Loader2, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import type { RecentTransactionData } from '@/types/dashboard';
import { getCategoryLabel } from '@/lib/category-labels';

interface RecentTransactionsProps {
  transactions: RecentTransactionData[];
  hasBankConnection: boolean;
}

function formatTxDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export function RecentTransactions({ transactions, hasBankConnection }: RecentTransactionsProps) {
  const router = useRouter();
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ synced?: number; errors?: string[] } | null>(null);

  const needsReviewCount = transactions.filter((tx) => tx.status === 'needs_review').length;

  const handleSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await fetch('/api/truelayer/sync', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        setSyncResult({ errors: [data.error || 'Sync failed'] });
      } else if (data.errors?.length > 0) {
        setSyncResult({ synced: data.synced, errors: data.errors });
      } else {
        setSyncResult({ synced: data.synced });
        if (data.synced > 0) {
          router.refresh();
        }
      }
    } catch {
      setSyncResult({ errors: ['Network error — please try again'] });
    } finally {
      setSyncing(false);
    }
  };

  if (!hasBankConnection) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
        id="transactions"
      >
        <h2 className="text-base font-semibold text-gray-900 mb-4">Recent Transactions</h2>
        <EmptyState
          icon={<Building2 className="h-6 w-6 text-gray-400" />}
          title="Connect your bank"
          description="Link your bank account via Open Banking to see your transactions here."
          action={{ label: 'Connect Bank', href: '/api/truelayer/auth/authorize' }}
        />
      </motion.div>
    );
  }

  if (transactions.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
        id="transactions"
      >
        <h2 className="text-base font-semibold text-gray-900 mb-4">Recent Transactions</h2>
        <Card>
          <CardContent className="flex flex-col items-center text-center py-8">
            <p className="text-sm text-gray-500 mb-3">
              No transactions yet. Sync your bank to import them.
            </p>
            <button
              onClick={handleSync}
              disabled={syncing}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-[#00e3ec] text-black hover:bg-[#00c4d4] disabled:opacity-50"
            >
              {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              {syncing ? 'Syncing...' : 'Sync Now'}
            </button>
            {syncResult && (
              <div className="mt-3 text-xs">
                {syncResult.errors?.length ? (
                  <p className="text-red-500">{syncResult.errors[0]}</p>
                ) : syncResult.synced === 0 ? (
                  <p className="text-gray-400">No new transactions found.</p>
                ) : (
                  <p className="text-green-600">Synced {syncResult.synced} transactions.</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.4 }}
      id="transactions"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-gray-900">Recent Transactions</h2>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSync}
            disabled={syncing}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
            title="Sync transactions"
          >
            {syncing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </button>
          {needsReviewCount > 0 ? (
            <Link
              href="/transactions"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#00e3ec] text-black hover:bg-[#00c4d4] transition-colors"
            >
              {needsReviewCount} to review <ArrowRight className="h-3 w-3" />
            </Link>
          ) : (
            <Link href="/transactions" className="text-xs font-medium text-[#00c4d4] hover:text-[#00e3ec] transition-colors">
              View all &rarr;
            </Link>
          )}
        </div>
      </div>

      <Card className="py-0 overflow-hidden">
        <CardContent className="p-0">
          {transactions.map((tx, i) => (
            <div
              key={tx.id}
              className={`flex items-center px-4 py-3 ${
                i < transactions.length - 1 ? 'border-b border-gray-100' : ''
              } hover:bg-gray-50/50 transition-colors`}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{tx.merchant}</p>
                <p className="text-xs text-gray-500 mt-0.5">{formatTxDate(tx.date)}</p>
              </div>

              <div className="flex-1 text-center">
                {tx.status === 'auto' && tx.category_code ? (
                  tx.category_code === 'personal' || tx.category_code === 'transfer' ? (
                    <span className="inline-flex items-center text-xs font-medium px-2.5 py-0.5 rounded-full bg-gray-50 text-gray-500 border border-gray-200">
                      {getCategoryLabel(tx.category_code)}
                    </span>
                  ) : (
                    <span className="inline-flex items-center text-xs font-medium px-2.5 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200">
                      {getCategoryLabel(tx.category_code)}
                    </span>
                  )
                ) : tx.ai_suggested_category_code ? (
                  <Link href="/transactions">
                    {tx.ai_suggested_category_code === 'personal' || tx.ai_suggested_category_code === 'transfer' ? (
                      <span className="inline-flex items-center text-xs font-medium px-2.5 py-0.5 rounded-full bg-gray-50 text-gray-400 border border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors">
                        {getCategoryLabel(tx.ai_suggested_category_code)}
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-xs font-medium px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 cursor-pointer hover:bg-amber-100 transition-colors">
                        AI: {getCategoryLabel(tx.ai_suggested_category_code)}
                      </span>
                    )}
                  </Link>
                ) : (
                  <Link href="/transactions">
                    <span className="inline-flex items-center text-xs font-medium px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 cursor-pointer hover:bg-amber-100 transition-colors">
                      Categorise
                    </span>
                  </Link>
                )}
              </div>

              <div
                className={`font-mono text-sm font-medium min-w-[80px] text-right ${
                  tx.type === 'income' ? 'text-green-600' : 'text-gray-900'
                }`}
              >
                {tx.type === 'income' ? '+' : '-'}
                {formatCurrency(tx.amount)}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </motion.div>
  );
}
