'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { AiNudgeBanner } from '@/components/dashboard/AiNudgeBanner';
import { MtdQuarterCards } from '@/components/dashboard/MtdQuarterCards';
import { RecentTransactions } from '@/components/dashboard/RecentTransactions';
import { YearToDateSummary } from '@/components/dashboard/YearToDateSummary';
import { AiInsightsPanel } from '@/components/dashboard/AiInsightsPanel';
import { UpcomingDeadlines } from '@/components/dashboard/UpcomingDeadlines';
import { ShieldCheck, Building2 } from 'lucide-react';
import type { DashboardData } from '@/types/dashboard';

interface DashboardContentProps {
  userName: string;
  data: DashboardData;
  taxYear?: string;
  hmrcSkipped?: boolean;
  bankSkipped?: boolean;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function getTaxYearDisplay(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const day = now.getDate();

  if (month > 4 || (month === 4 && day >= 6)) {
    return `${year}/${year + 1 - 2000}`;
  }
  return `${year - 1}/${year - 2000}`;
}

function SetupBanner({ hmrcSkipped, bankSkipped, hasHmrcConnection, hasBankConnection }: {
  hmrcSkipped?: boolean;
  bankSkipped?: boolean;
  hasHmrcConnection: boolean;
  hasBankConnection: boolean;
}) {
  const items: { label: string; href: string; icon: React.ReactNode }[] = [];
  if (hmrcSkipped && !hasHmrcConnection) {
    items.push({ label: 'Connect HMRC', href: '/api/mtd/auth/authorize', icon: <ShieldCheck className="h-4 w-4" /> });
  }
  if (bankSkipped && !hasBankConnection) {
    items.push({ label: 'Connect Bank', href: '/api/truelayer/auth/authorize', icon: <Building2 className="h-4 w-4" /> });
  }
  if (items.length === 0) return null;

  return (
    <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 flex items-center justify-between">
      <span className="text-sm text-amber-800">Complete your setup</span>
      <div className="flex items-center gap-3">
        {items.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 hover:text-amber-900 transition-colors"
          >
            {item.icon}
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

function DashboardInner({ userName, data, taxYear, hmrcSkipped, bankSkipped }: DashboardContentProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [syncing, setSyncing] = useState(false);

  // Auto-sync after bank connection
  useEffect(() => {
    if (searchParams.get('bank_connected') === 'true') {
      setSyncing(true);
      fetch('/api/truelayer/sync', { method: 'POST' })
        .then(() => {
          router.replace('/dashboard');
          router.refresh();
        })
        .catch(() => {
          router.replace('/dashboard');
        })
        .finally(() => setSyncing(false));
    }
  }, [searchParams, router]);

  return (
    <div className="space-y-6">
      {/* Syncing toast */}
      {syncing && (
        <div className="rounded-lg bg-[#00e3ec]/10 border border-[#00e3ec]/20 px-4 py-3 text-sm text-gray-700">
          Syncing your bank transactions...
        </div>
      )}

      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
          {getGreeting()}, {userName}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Tax Year {getTaxYearDisplay()}
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 ml-2 align-middle" />
        </p>
      </div>

      {/* Main content grid */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left column — main content */}
        <div className="flex-1 space-y-6 min-w-0">
          <SetupBanner
            hmrcSkipped={hmrcSkipped}
            bankSkipped={bankSkipped}
            hasHmrcConnection={data.hasHmrcConnection}
            hasBankConnection={data.hasBankConnection}
          />
          <AiNudgeBanner nudge={data.nudge} />
          <MtdQuarterCards hasHmrcConnection={data.hasHmrcConnection} taxYear={taxYear} />
          <RecentTransactions
            transactions={data.recentTransactions}
            hasBankConnection={data.hasBankConnection}
          />
        </div>

        {/* Right column — sidebar cards */}
        <div className="w-full lg:w-80 space-y-6 shrink-0">
          <YearToDateSummary
            summary={data.ytdSummary}
            hasBankConnection={data.hasBankConnection}
          />
          <AiInsightsPanel
            hasBankConnection={data.hasBankConnection}
            nudge={data.nudge}
            ytdSummary={data.ytdSummary}
          />
          <UpcomingDeadlines hasHmrcConnection={data.hasHmrcConnection} taxYear={taxYear} />
        </div>
      </div>
    </div>
  );
}

export function DashboardContent(props: DashboardContentProps) {
  return (
    <Suspense>
      <DashboardInner {...props} />
    </Suspense>
  );
}
