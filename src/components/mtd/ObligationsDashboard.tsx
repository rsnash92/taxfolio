'use client';

import { useState, useEffect, useMemo } from 'react';
import { ChevronDown, ChevronUp, RefreshCw, ExternalLink, AlertCircle } from 'lucide-react';
import { ObligationCard } from './ObligationCard';
import { ObligationFilters } from './ObligationFilters';
import { DeadlineBanner } from './DeadlineBanner';
import { YearSummaryBar } from './YearSummaryBar';
import type {
  MtdBusiness,
  ObligationWithDisplayStatus,
  HmrcObligationsResponse,
  BusinessObligation,
  TaxYear,
} from '@/types/mtd';
import {
  getObligationDisplayStatus,
  getDaysUntilDue,
  sortObligationsByUrgency,
  getCurrentTaxYear,
} from '@/lib/mtd/quarters';
import { cn } from '@/lib/utils';

interface ObligationsDashboardProps {
  onSelectObligation: (obligation: ObligationWithDisplayStatus) => void;
}

export function ObligationsDashboard({ onSelectObligation }: ObligationsDashboardProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [businesses, setBusinesses] = useState<MtdBusiness[]>([]);
  const [rawObligations, setRawObligations] = useState<HmrcObligationsResponse | null>(null);
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null);
  const [showHistorical, setShowHistorical] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const taxYear = getCurrentTaxYear();

  // Fetch data on mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch businesses
      const businessesRes = await fetch('/api/mtd/businesses');
      if (!businessesRes.ok) {
        if (businessesRes.status === 401) {
          setIsConnected(false);
          setIsLoading(false);
          return;
        }
        throw new Error('Failed to fetch businesses');
      }
      const businessesData = await businessesRes.json();
      setBusinesses(businessesData.businesses || []);
      setIsConnected(true);

      // Fetch obligations
      const obligationsRes = await fetch(`/api/mtd/obligations?taxYear=${taxYear}`);
      if (!obligationsRes.ok) {
        throw new Error('Failed to fetch obligations');
      }
      const obligationsData = await obligationsRes.json();
      setRawObligations(obligationsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Get the minimum date for relevant obligations (start of previous tax year)
  // In sandbox mode, HMRC returns historical test data from 2018 — bypass filter
  const isSandbox = process.env.NEXT_PUBLIC_HMRC_ENVIRONMENT === 'sandbox' ||
    process.env.NEXT_PUBLIC_APP_URL?.includes('localhost');

  const minRelevantDate = useMemo(() => {
    // In sandbox, show all obligations so we can test with HMRC's historical data
    if (isSandbox) {
      return new Date(2000, 0, 1);
    }

    // Current tax year starts April 6
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-indexed

    // If before April, we're in tax year starting previous calendar year
    // So "previous tax year" started 2 years ago
    // If April or later, we're in tax year starting this calendar year
    // So "previous tax year" started 1 year ago
    const prevTaxYearStart = currentMonth < 3
      ? new Date(currentYear - 2, 3, 6) // April 6 two years ago
      : new Date(currentYear - 1, 3, 6); // April 6 one year ago

    return prevTaxYearStart;
  }, [isSandbox]);

  // Process obligations into display format
  const obligations = useMemo((): ObligationWithDisplayStatus[] => {
    if (!rawObligations?.obligations) return [];

    const result: ObligationWithDisplayStatus[] = [];

    for (const businessObligation of rawObligations.obligations) {
      const business = businesses.find(
        (b) => b.businessId === businessObligation.businessId
      );

      for (const detail of businessObligation.obligationDetails) {
        // Filter out obligations older than the previous tax year
        const periodStart = new Date(detail.periodStartDate);
        if (periodStart < minRelevantDate) {
          continue;
        }

        result.push({
          ...detail,
          displayStatus: getObligationDisplayStatus(detail),
          businessId: businessObligation.businessId,
          businessType: businessObligation.typeOfBusiness,
          businessName: business?.tradingName,
          daysUntilDue: getDaysUntilDue(detail.dueDate),
        });
      }
    }

    return sortObligationsByUrgency(result);
  }, [rawObligations, businesses, minRelevantDate]);

  // Filter obligations
  const filteredObligations = useMemo(() => {
    let filtered = obligations;

    if (selectedBusinessId) {
      filtered = filtered.filter((o) => o.businessId === selectedBusinessId);
    }

    return filtered;
  }, [obligations, selectedBusinessId]);

  // Split into current and historical
  const { currentObligations, historicalObligations } = useMemo(() => {
    const current = filteredObligations.filter(
      (o) => o.displayStatus !== 'fulfilled'
    );
    const historical = filteredObligations.filter(
      (o) => o.displayStatus === 'fulfilled'
    );
    return { currentObligations: current, historicalObligations: historical };
  }, [filteredObligations]);

  // Find next urgent obligation for banner
  const nextUrgentObligation = useMemo(() => {
    return currentObligations.find(
      (o) => o.displayStatus === 'overdue' || o.daysUntilDue <= 14
    );
  }, [currentObligations]);

  // Not connected state
  if (!isLoading && !isConnected) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <ExternalLink className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Connect to HMRC
        </h3>
        <p className="text-gray-500 mb-6 max-w-md mx-auto">
          To view your quarterly obligations and submit returns, you need to connect your HMRC account.
        </p>
        <a
          href="/api/mtd/auth/authorize"
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white font-medium rounded-lg hover:from-cyan-600 hover:to-cyan-700 transition-colors"
        >
          Connect to HMRC
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse bg-gray-200 rounded-xl h-32" />
        <div className="animate-pulse bg-gray-200 rounded-xl h-24" />
        <div className="animate-pulse bg-gray-200 rounded-xl h-24" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-800 mb-1">
              Failed to load obligations
            </h3>
            <p className="text-sm text-red-600 mb-4">{error}</p>
            <button
              onClick={fetchData}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
            >
              <RefreshCw className="h-4 w-4" />
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Year summary */}
      <YearSummaryBar taxYear={taxYear} obligations={obligations} />

      {/* Urgent deadline banner */}
      <DeadlineBanner
        nextObligation={nextUrgentObligation || null}
        onSelect={onSelectObligation}
      />

      {/* Filters */}
      {businesses.length > 1 && (
        <ObligationFilters
          businesses={businesses}
          selectedBusinessId={selectedBusinessId}
          onSelectBusiness={setSelectedBusinessId}
        />
      )}

      {/* Current obligations */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Current and upcoming obligations
          </h2>
          <button
            onClick={fetchData}
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>

        {currentObligations.length === 0 ? (
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
            <p className="text-green-800 font-medium">
              All obligations fulfilled for this period
            </p>
            <p className="text-sm text-green-600 mt-1">
              Great work! You're all caught up.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {currentObligations.map((obligation) => (
              <ObligationCard
                key={`${obligation.businessId}-${obligation.periodStartDate}`}
                obligation={obligation}
                onSelect={onSelectObligation}
              />
            ))}
          </div>
        )}
      </div>

      {/* Historical obligations */}
      {historicalObligations.length > 0 && (
        <div>
          <button
            onClick={() => setShowHistorical(!showHistorical)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4"
          >
            {showHistorical ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
            <span className="text-sm font-medium">
              Historical obligations ({historicalObligations.length})
            </span>
          </button>

          {showHistorical && (
            <div className="space-y-3 opacity-75">
              {historicalObligations.map((obligation) => (
                <ObligationCard
                  key={`${obligation.businessId}-${obligation.periodStartDate}`}
                  obligation={obligation}
                  onSelect={onSelectObligation}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
