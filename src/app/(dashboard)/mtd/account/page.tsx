'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { AccountBalanceCard } from '@/components/mtd/AccountBalanceCard';
import { AccountTransactionsTable } from '@/components/mtd/AccountTransactionsTable';
import { buildClientRequestHeaders } from '@/lib/mtd/fraud-headers';
import { ExternalLink } from 'lucide-react';
import type { SaBalanceAndTransactionsResponse } from '@/types/mtd';

export default function TaxAccountPage() {
  const router = useRouter();
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<SaBalanceAndTransactionsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      const { data: tokens } = await supabase
        .from('hmrc_tokens')
        .select('id, expires_at')
        .eq('user_id', user.id)
        .single();

      if (!tokens) {
        setIsConnected(false);
        setIsLoading(false);
        return;
      }

      setIsConnected(true);

      try {
        const fraudHeaders = buildClientRequestHeaders(user.id);
        const res = await fetch('/api/mtd/accounts/balance', {
          headers: fraudHeaders,
        });

        if (!res.ok) {
          const body = await res.json();
          setError(body.error || 'Failed to fetch account data');
          setIsLoading(false);
          return;
        }

        const result = await res.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch account data');
      }

      setIsLoading(false);
    };

    load();
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00e3ec]"></div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tax Account</h1>
          <p className="text-gray-500 mt-1">Self Assessment balance and transactions</p>
        </div>

        <div className="max-w-md mx-auto bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
          <div className="w-16 h-16 bg-[#00e3ec]/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <ExternalLink className="h-8 w-8 text-[#00e3ec]" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Connect to HMRC</h2>
          <p className="text-gray-600 mb-6">
            Connect your HMRC account to view your Self Assessment balance, charges, and payments.
          </p>
          <button
            onClick={() => { window.location.href = '/api/mtd/auth/authorize'; }}
            className="w-full py-3 px-4 bg-[#00e3ec] hover:bg-[#00c4d4] text-black font-medium rounded-lg transition-colors"
          >
            Connect to HMRC
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tax Account</h1>
          <p className="text-gray-500 mt-1">Self Assessment balance and transactions</p>
        </div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-700 text-sm font-medium rounded-full">
          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
          Connected to HMRC
        </span>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {data && (
        <>
          <AccountBalanceCard balance={data.balanceDetails} />
          <AccountTransactionsTable documents={data.documentDetails || []} />
        </>
      )}
    </div>
  );
}
