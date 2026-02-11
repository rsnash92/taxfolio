'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { IncomeSummaryCard } from '@/components/mtd/IncomeSummaryCard';
import { buildClientRequestHeaders } from '@/lib/mtd/fraud-headers';
import { ExternalLink } from 'lucide-react';
import type { BissSummaryResponse, MtdBusiness } from '@/types/mtd';

function getCurrentTaxYear(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const day = now.getDate();
  if (month > 3 || (month === 3 && day >= 6)) {
    return `${year}-${(year + 1).toString().slice(-2)}`;
  }
  return `${year - 1}-${year.toString().slice(-2)}`;
}

export default function IncomeSummaryPage() {
  const router = useRouter();
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [businesses, setBusinesses] = useState<MtdBusiness[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<MtdBusiness | null>(null);
  const [taxYear, setTaxYear] = useState(getCurrentTaxYear());
  const [summary, setSummary] = useState<BissSummaryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isFetchingSummary, setIsFetchingSummary] = useState(false);

  // Load businesses on mount
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
        .select('id')
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
        const res = await fetch('/api/mtd/businesses', { headers: fraudHeaders });
        if (res.ok) {
          const data = await res.json();
          const bizList = data.listOfBusinesses || data.businesses || [];
          setBusinesses(bizList);
          if (bizList.length > 0) {
            setSelectedBusiness(bizList[0]);
          }
        }
      } catch (err) {
        console.error('Failed to fetch businesses:', err);
      }

      setIsLoading(false);
    };

    load();
  }, [router]);

  // Fetch summary when business or tax year changes
  const fetchSummary = useCallback(async () => {
    if (!selectedBusiness) return;

    setIsFetchingSummary(true);
    setError(null);
    setSummary(null);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const fraudHeaders = buildClientRequestHeaders(user.id);
      const params = new URLSearchParams({
        taxYear,
        typeOfBusiness: selectedBusiness.typeOfBusiness,
        businessId: selectedBusiness.businessId,
      });

      const res = await fetch(`/api/mtd/income-summary?${params}`, {
        headers: fraudHeaders,
      });

      if (!res.ok) {
        const body = await res.json();
        setError(body.error || 'Failed to fetch income summary');
        setIsFetchingSummary(false);
        return;
      }

      const result = await res.json();
      setSummary(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch income summary');
    }

    setIsFetchingSummary(false);
  }, [selectedBusiness, taxYear]);

  useEffect(() => {
    if (selectedBusiness) {
      fetchSummary();
    }
  }, [selectedBusiness, taxYear, fetchSummary]);

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
          <h1 className="text-2xl font-bold text-gray-900">Annual Income Summary</h1>
          <p className="text-gray-500 mt-1">Year-to-date business income and expenses</p>
        </div>

        <div className="max-w-md mx-auto bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
          <div className="w-16 h-16 bg-[#00e3ec]/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <ExternalLink className="h-8 w-8 text-[#00e3ec]" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Connect to HMRC</h2>
          <p className="text-gray-600 mb-6">
            Connect your HMRC account to view your annual income summary.
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

  // Generate tax year options (current and previous 2)
  const currentYear = getCurrentTaxYear();
  const [startYear] = currentYear.split('-').map(Number);
  const taxYearOptions = [
    currentYear,
    `${startYear - 1}-${startYear.toString().slice(-2)}`,
    `${startYear - 2}-${(startYear - 1).toString().slice(-2)}`,
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Annual Income Summary</h1>
          <p className="text-gray-500 mt-1">Year-to-date business income and expenses</p>
        </div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-700 text-sm font-medium rounded-full">
          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
          Connected to HMRC
        </span>
      </div>

      {/* Selectors */}
      <div className="flex flex-wrap gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tax Year</label>
          <select
            value={taxYear}
            onChange={(e) => setTaxYear(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00e3ec]"
          >
            {taxYearOptions.map((ty) => (
              <option key={ty} value={ty}>{ty}</option>
            ))}
          </select>
        </div>

        {businesses.length > 1 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Business</label>
            <select
              value={selectedBusiness?.businessId || ''}
              onChange={(e) => {
                const biz = businesses.find((b) => b.businessId === e.target.value);
                if (biz) setSelectedBusiness(biz);
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00e3ec]"
            >
              {businesses.map((biz) => (
                <option key={biz.businessId} value={biz.businessId}>
                  {biz.tradingName || biz.typeOfBusiness}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {isFetchingSummary && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00e3ec]"></div>
        </div>
      )}

      {summary && !isFetchingSummary && (
        <IncomeSummaryCard
          summary={summary}
          businessName={selectedBusiness?.tradingName}
          taxYear={taxYear}
        />
      )}

      {!summary && !isFetchingSummary && !error && businesses.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
          No businesses found. Submit a quarterly update first to see your income summary.
        </div>
      )}
    </div>
  );
}
