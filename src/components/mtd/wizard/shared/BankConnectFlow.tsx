'use client';

import { useState, useEffect } from 'react';
import {
  Building2,
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  Loader2,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import type { MtdWizardState, MtdTransaction, BankConnection } from '@/types/mtd';
import { getMtdCategory } from '@/lib/mtd/category-mapping';
import { formatDate } from '@/lib/mtd/quarters';
import { cn } from '@/lib/utils';

interface BankConnectFlowProps {
  state: MtdWizardState;
  onUpdateState: (updates: Partial<MtdWizardState>) => void;
  onComplete: () => void;
  onBack: () => void;
}

type Phase = 'loading' | 'connections' | 'fetching' | 'error';

export function BankConnectFlow({
  state,
  onUpdateState,
  onComplete,
  onBack,
}: BankConnectFlowProps) {
  const [phase, setPhase] = useState<Phase>('loading');
  const [connections, setConnections] = useState<BankConnection[]>([]);
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const periodLabel = `${formatDate(state.obligation.periodStartDate)} to ${formatDate(state.obligation.periodEndDate)}`;

  // Check for existing connections on mount
  useEffect(() => {
    const loadConnections = async () => {
      try {
        const response = await fetch('/api/truelayer/connections');
        if (response.ok) {
          const data = await response.json();
          setConnections(data.connections || []);
        }
      } catch {
        // No connections, that's fine
      }
      setPhase('connections');
    };

    loadConnections();
  }, []);

  const handleConnectBank = () => {
    // Save wizard context to sessionStorage before redirecting
    sessionStorage.setItem(
      'mtd-wizard-context',
      JSON.stringify({
        obligationId: `${state.businessId}-${state.obligation.periodStartDate}`,
        businessId: state.businessId,
        periodStart: state.obligation.periodStartDate,
        periodEnd: state.obligation.periodEndDate,
      })
    );

    // Redirect to TrueLayer OAuth
    window.location.href = '/api/truelayer/auth/authorize';
  };

  const handleSelectConnection = async (connectionId: string) => {
    setSelectedConnectionId(connectionId);
    setPhase('fetching');

    try {
      const response = await fetch('/api/truelayer/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          connectionId,
          fromDate: state.obligation.periodStartDate,
          toDate: state.obligation.periodEndDate,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to fetch transactions');
      }

      const data = await response.json();
      const transactions: MtdTransaction[] = data.transactions || [];

      onUpdateState({
        dataSource: 'bank',
        bankConnectionId: connectionId,
        transactions,
      });

      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch transactions');
      setPhase('error');
    }
  };

  // Loading state
  if (phase === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-8 w-8 text-cyan-500 animate-spin mb-4" />
        <p className="text-gray-600">Checking bank connections...</p>
      </div>
    );
  }

  // Fetching transactions
  if (phase === 'fetching') {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-8 w-8 text-cyan-500 animate-spin mb-4" />
        <p className="text-gray-600">Fetching transactions for {periodLabel}...</p>
        <p className="text-sm text-gray-400 mt-2">This may take a moment</p>
      </div>
    );
  }

  // Error state
  if (phase === 'error') {
    return (
      <div className="space-y-6">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <AlertTriangle className="h-10 w-10 text-red-500 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-red-800 mb-2">
            Failed to fetch transactions
          </h3>
          <p className="text-sm text-red-700 mb-4">{error}</p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => {
                setPhase('connections');
                setError(null);
              }}
              className="px-4 py-2 text-sm font-medium text-red-700 bg-red-100 rounded-lg hover:bg-red-200"
            >
              Try again
            </button>
            <button
              onClick={onBack}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Choose different source
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Connections view
  return (
    <div className="space-y-6">
      <div>
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <div className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-50 text-cyan-700 text-sm font-medium rounded-full mb-4">
          {state.businessName || 'Business'} - {periodLabel}
        </div>

        <h2 className="text-2xl font-bold text-gray-900">
          Connect your bank
        </h2>
        <p className="text-gray-600 mt-1">
          {connections.length > 0
            ? 'Select a connected bank to import transactions, or connect a new one.'
            : 'Connect your bank account via Open Banking to automatically import your transactions.'}
        </p>
      </div>

      {/* Existing connections */}
      {connections.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">Your connected banks</h3>
          {connections.map((conn) => (
            <button
              key={conn.id}
              onClick={() => handleSelectConnection(conn.id)}
              className="w-full flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-xl text-left hover:border-cyan-300 hover:shadow-sm transition-all"
            >
              <div className="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center">
                <Building2 className="h-5 w-5 text-cyan-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">{conn.bank_name}</p>
                <p className="text-sm text-gray-500">
                  {conn.accounts.length} account{conn.accounts.length !== 1 ? 's' : ''}
                  {conn.accounts[0]?.account_number_last4 && ` • ****${conn.accounts[0].account_number_last4}`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-xs text-green-600">Connected</span>
              </div>
              <ArrowRight className="h-5 w-5 text-gray-400" />
            </button>
          ))}
        </div>
      )}

      {/* Connect new bank */}
      <button
        onClick={handleConnectBank}
        className="w-full flex items-center gap-4 p-4 bg-white border-2 border-dashed border-gray-300 rounded-xl text-left hover:border-cyan-400 hover:bg-cyan-50/50 transition-all"
      >
        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
          <ExternalLink className="h-5 w-5 text-gray-500" />
        </div>
        <div className="flex-1">
          <p className="font-medium text-gray-900">Connect a new bank</p>
          <p className="text-sm text-gray-500">
            Securely connect via Open Banking (powered by TrueLayer)
          </p>
        </div>
        <ArrowRight className="h-5 w-5 text-gray-400" />
      </button>

      <p className="text-xs text-gray-400 text-center">
        Your bank data is securely accessed via Open Banking. We never store your login credentials.
      </p>
    </div>
  );
}
