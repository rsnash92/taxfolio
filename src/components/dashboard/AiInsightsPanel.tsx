'use client';

import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { EmptyState } from './EmptyState';
import { Sparkles } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';
import type { NudgeData, YtdSummaryData } from '@/types/dashboard';

interface AiInsightsPanelProps {
  hasBankConnection: boolean;
  nudge: NudgeData | null;
  ytdSummary: YtdSummaryData;
}

interface Insight {
  icon: string;
  text: string;
  action: string;
  href: string;
  type: 'warning' | 'opportunity' | 'info';
}

function getBorderColor(type: Insight['type']) {
  switch (type) {
    case 'warning':
      return 'border-l-amber-400';
    case 'opportunity':
      return 'border-l-green-400';
    case 'info':
      return 'border-l-gray-300';
  }
}

function generateInsights(nudge: NudgeData | null, ytd: YtdSummaryData): Insight[] {
  const insights: Insight[] = [];

  // Warning: uncategorised transactions
  if (nudge && nudge.uncategorisedCount > 0) {
    insights.push({
      icon: '⚠️',
      text: `You have ${nudge.uncategorisedCount} uncategorised transaction${nudge.uncategorisedCount !== 1 ? 's' : ''} — review them to keep your records accurate`,
      action: 'Review now',
      href: '/transactions',
      type: 'warning',
    });
  }

  // Info: tax estimate
  if (ytd.estimatedTax > 0) {
    const yoyText = ytd.yoyChange !== null
      ? ytd.yoyChange < 0
        ? ` — down ${formatCurrency(Math.abs(ytd.yoyChange))} from last year`
        : ` — up ${formatCurrency(ytd.yoyChange)} from last year`
      : '';
    insights.push({
      icon: '📊',
      text: `Year-to-date tax estimate: ${formatCurrency(ytd.estimatedTax)}${yoyText}`,
      action: 'See breakdown',
      href: '/insights',
      type: 'info',
    });
  }

  // Opportunity: if expenses are low relative to income
  if (ytd.totalIncome > 0 && ytd.totalExpenses / ytd.totalIncome < 0.15) {
    insights.push({
      icon: '🎯',
      text: 'Your expense-to-income ratio is below 15% — are you claiming all allowable business expenses?',
      action: 'Review expenses',
      href: '/insights',
      type: 'opportunity',
    });
  }

  return insights.slice(0, 3);
}

export function AiInsightsPanel({ hasBankConnection, nudge, ytdSummary }: AiInsightsPanelProps) {
  if (!hasBankConnection) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.5 }}
      >
        <EmptyState
          icon={<Sparkles className="h-6 w-6 text-gray-400" />}
          title="AI Insights"
          description="Connect your bank to unlock AI-powered insights about your spending and tax savings."
          action={{ label: 'Connect Bank', href: '/api/truelayer/auth/authorize' }}
        />
      </motion.div>
    );
  }

  const insights = generateInsights(nudge, ytdSummary);

  if (insights.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.5 }}
      >
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          AI Insights
        </h3>
        <Card className="py-3">
          <CardContent className="px-4 py-0">
            <p className="text-xs text-gray-400">
              No insights yet. Add more transactions to unlock AI analysis.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.5 }}
    >
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
        AI Insights
      </h3>

      <div className="space-y-2.5">
        {insights.map((insight, i) => (
          <Link key={i} href={insight.href}>
            <Card
              className={`py-3 border-l-4 ${getBorderColor(insight.type)} cursor-pointer hover:shadow-md transition-shadow`}
            >
              <CardContent className="px-4 py-0">
                <div className="flex gap-2.5 items-start">
                  <span className="text-sm shrink-0">{insight.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-700 leading-relaxed">{insight.text}</p>
                    <span className="text-xs font-semibold text-[#00c4d4] mt-1.5 hover:text-[#00e3ec] transition-colors inline-block">
                      {insight.action} &rarr;
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
      <p className="text-[10px] text-gray-400 mt-2">
        AI-generated estimates based on your categorised transactions. Not tax advice.
      </p>
    </motion.div>
  );
}
