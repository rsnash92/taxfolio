'use client';

import { AiNudgeBanner } from '@/components/dashboard/AiNudgeBanner';
import { MtdQuarterCards } from '@/components/dashboard/MtdQuarterCards';
import { RecentTransactions } from '@/components/dashboard/RecentTransactions';
import { YearToDateSummary } from '@/components/dashboard/YearToDateSummary';
import { AiInsightsPanel } from '@/components/dashboard/AiInsightsPanel';
import { UpcomingDeadlines } from '@/components/dashboard/UpcomingDeadlines';

interface DashboardContentProps {
  userName: string;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export function DashboardContent({ userName }: DashboardContentProps) {
  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
          {getGreeting()}, {userName}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Tax Year 2026/27
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 ml-2 align-middle" />
        </p>
      </div>

      {/* Main content grid */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left column — main content */}
        <div className="flex-1 space-y-6 min-w-0">
          <AiNudgeBanner />
          <MtdQuarterCards />
          <RecentTransactions />
        </div>

        {/* Right column — sidebar cards */}
        <div className="w-full lg:w-80 space-y-6 shrink-0">
          <YearToDateSummary />
          <AiInsightsPanel />
          <UpcomingDeadlines />
        </div>
      </div>
    </div>
  );
}
