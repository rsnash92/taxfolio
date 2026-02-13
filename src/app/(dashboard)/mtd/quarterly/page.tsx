'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ObligationsDashboard, MtdWizard } from '@/components/mtd';
import type { ObligationWithDisplayStatus, MtdTransaction } from '@/types/mtd';
import { ExternalLink } from 'lucide-react';

export default function QuarterlySubmissionsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedObligation, setSelectedObligation] = useState<ObligationWithDisplayStatus | null>(null);
  const [wizardTransactions, setWizardTransactions] = useState<MtdTransaction[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const checkConnection = async () => {
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

      setIsConnected(!!tokens);
      setIsLoading(false);
    };

    checkConnection();
  }, [router]);

  // Handle TrueLayer bank connection callback
  useEffect(() => {
    const bankConnected = searchParams.get('bank_connected');
    const bankError = searchParams.get('bank_error');

    if (bankConnected === 'true') {
      // Restore wizard context from sessionStorage after bank redirect
      const savedContext = sessionStorage.getItem('mtd-wizard-context');
      if (savedContext) {
        sessionStorage.removeItem('mtd-wizard-context');
        // The wizard will be restored when the user selects the obligation again
        // The bank connection is now stored in a cookie and will be detected
        // by the BankConnectFlow component
        setSuccessMessage('Bank connected successfully! Select a quarter to continue.');
      }
      // Clean up URL
      router.replace('/mtd/quarterly');
    }

    if (bankError) {
      setSuccessMessage(null);
      console.error('[Quarterly] Bank connection error:', bankError);
      router.replace('/mtd/quarterly');
    }
  }, [searchParams, router]);

  const handleConnect = () => {
    window.location.href = '/api/mtd/auth/authorize';
  };

  const handleSelectObligation = useCallback(async (obligation: ObligationWithDisplayStatus) => {
    // Self-employment obligations use the dedicated review page
    if (obligation.businessType === 'self-employment') {
      const params = new URLSearchParams({
        businessId: obligation.businessId,
        businessType: obligation.businessType,
        periodStart: obligation.periodStartDate,
        periodEnd: obligation.periodEndDate,
      });
      router.push(`/mtd/review?${params}`);
      return;
    }
    // Property obligations still use the wizard
    setWizardTransactions([]);
    setSelectedObligation(obligation);
  }, [router]);

  const handleCloseWizard = useCallback(() => {
    setSelectedObligation(null);
    setWizardTransactions([]);
  }, []);

  const handleWizardSuccess = useCallback(() => {
    setSuccessMessage('Quarterly update submitted successfully!');
    setRefreshKey((k) => k + 1);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00e3ec]"></div>
      </div>
    );
  }

  // Not connected - show connect prompt
  if (!isConnected) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quarterly Submissions</h1>
          <p className="text-gray-500 mt-1">Making Tax Digital for Income Tax</p>
        </div>

        <div className="max-w-md mx-auto bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
          <div className="w-16 h-16 bg-[#00e3ec]/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <ExternalLink className="h-8 w-8 text-[#00e3ec]" />
          </div>

          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Connect to HMRC
          </h2>
          <p className="text-gray-600 mb-6">
            To submit your quarterly updates, you need to connect your HMRC
            account. This allows us to securely submit your income and expense
            data on your behalf.
          </p>

          <button
            onClick={handleConnect}
            className="w-full py-3 px-4 bg-[#00e3ec] hover:bg-[#00c4d4] text-black font-medium rounded-lg transition-colors"
          >
            Connect to HMRC
          </button>

          <p className="mt-4 text-xs text-gray-500">
            You&apos;ll be redirected to HMRC to authorise access. We only request
            permission to read and write your self-assessment data.
          </p>
        </div>
      </div>
    );
  }

  // Wizard is open
  if (selectedObligation) {
    return (
      <MtdWizard
        obligation={selectedObligation}
        transactions={wizardTransactions}
        onClose={handleCloseWizard}
        onSuccess={handleWizardSuccess}
      />
    );
  }

  // Connected - show dashboard
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quarterly Submissions</h1>
          <p className="text-gray-500 mt-1">Making Tax Digital for Income Tax</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-700 text-sm font-medium rounded-full">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            Connected to HMRC
          </span>
        </div>
      </div>

      {/* Success message */}
      {successMessage && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm flex items-center justify-between">
          <span>{successMessage}</span>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-green-600 hover:text-green-800"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      )}

      {/* Dashboard */}
      <ObligationsDashboard
        key={refreshKey}
        onSelectObligation={handleSelectObligation}
      />
    </div>
  );
}
