'use client';

import { AlertTriangle, Clock, CreditCard, Wallet } from 'lucide-react';
import type { SaBalanceDetails } from '@/types/mtd';

interface AccountBalanceCardProps {
  balance: SaBalanceDetails;
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

export function AccountBalanceCard({ balance }: AccountBalanceCardProps) {
  return (
    <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">Account Balance</h2>
        <span className="text-2xl font-bold text-white">
          {formatCurrency(balance.totalBalance)}
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Overdue */}
        <div className="bg-white/5 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="h-4 w-4 text-red-400" />
            <span className="text-xs text-slate-400 uppercase tracking-wide">
              Overdue
            </span>
          </div>
          <span className={`text-2xl font-bold ${balance.overdueAmount > 0 ? 'text-red-400' : 'text-white'}`}>
            {formatCurrency(balance.overdueAmount)}
          </span>
        </div>

        {/* Due Now */}
        <div className="bg-white/5 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="h-4 w-4 text-amber-400" />
            <span className="text-xs text-slate-400 uppercase tracking-wide">
              Due Now
            </span>
          </div>
          <span className="text-2xl font-bold text-white">
            {formatCurrency(balance.payableAmount)}
          </span>
          {balance.payableDueDate && (
            <p className="text-xs text-slate-400 mt-1">
              by {new Date(balance.payableDueDate).toLocaleDateString('en-GB')}
            </p>
          )}
        </div>

        {/* Pending */}
        <div className="bg-white/5 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Wallet className="h-4 w-4 text-cyan-400" />
            <span className="text-xs text-slate-400 uppercase tracking-wide">
              Pending
            </span>
          </div>
          <span className="text-2xl font-bold text-white">
            {formatCurrency(balance.pendingChargeDueAmount)}
          </span>
        </div>

        {/* Credit */}
        <div className="bg-white/5 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <CreditCard className="h-4 w-4 text-green-400" />
            <span className="text-xs text-slate-400 uppercase tracking-wide">
              Credit
            </span>
          </div>
          <span className="text-2xl font-bold text-green-400">
            {formatCurrency(balance.availableCredit)}
          </span>
        </div>
      </div>
    </div>
  );
}
