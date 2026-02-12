'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { motion } from 'framer-motion';
import { EmptyState } from './EmptyState';
import { Lock, Loader2 } from 'lucide-react';
import { getAllQuarters } from '@/lib/mtd-utils';
import { calculateEstimatedTax } from '@/lib/tax/calculator';
import Link from 'next/link';

interface MtdQuarterCardsProps {
  hasHmrcConnection: boolean;
  taxYear?: string;
}

interface Quarter {
  id: string;
  period: string;
  status: 'submitted' | 'review' | 'upcoming' | 'open';
  income?: number;
  expenses?: number;
  tax?: number;
  submittedDate?: string;
  dueDate?: string;
  daysLeft?: number;
  progress?: number;
  unreviewed?: number;
}

interface QuarterApiData {
  quarter: number;
  start: string;
  end: string;
  deadline: string;
  income: number;
  expenses: number;
  pending: number;
  confirmed: number;
  total: number;
  submitted: boolean;
  submittedAt: string | null;
}

interface ObligationDetail {
  periodStartDate: string;
  periodEndDate: string;
  dueDate: string;
  status: 'Open' | 'Fulfilled';
}

interface BusinessObligation {
  obligationDetails: ObligationDetail[];
}

function getCurrentTaxYear(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  if (month > 4 || (month === 4 && day >= 6)) {
    return `${year}-${(year + 1).toString().slice(-2)}`;
  }
  return `${year - 1}-${year.toString().slice(-2)}`;
}

function getTaxYearDisplay(ty: string): string {
  const startYear = parseInt(ty.split('-')[0]);
  return `${startYear}/${startYear + 1 - 2000}`;
}

function formatPeriodLabel(start: string, end: string): string {
  const s = new Date(start);
  const e = new Date(end);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[s.getMonth()]} – ${months[e.getMonth()]} ${e.getFullYear()}`;
}

function getDaysUntil(dateStr: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function getStatusBadge(status: Quarter['status']) {
  switch (status) {
    case 'submitted':
      return (
        <Badge className="bg-green-50 text-green-700 border-green-200 hover:bg-green-50">
          Submitted ✓
        </Badge>
      );
    case 'review':
    case 'open':
      return (
        <Badge className="bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50">
          Ready for review
        </Badge>
      );
    case 'upcoming':
      return (
        <Badge className="bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-50">
          Upcoming
        </Badge>
      );
  }
}

export function MtdQuarterCards({ hasHmrcConnection, taxYear: taxYearProp }: MtdQuarterCardsProps) {
  const [quarters, setQuarters] = useState<Quarter[]>([]);
  const [loading, setLoading] = useState(hasHmrcConnection);
  const taxYear = taxYearProp || getCurrentTaxYear();

  useEffect(() => {
    if (!hasHmrcConnection) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch obligations and quarter data in parallel
        const [obligationsRes, quartersRes] = await Promise.all([
          fetch(`/api/mtd/obligations?taxYear=${taxYear}`),
          fetch(`/api/dashboard/quarters?taxYear=${taxYear}`),
        ]);

        const allQuarters = getAllQuarters(taxYear);
        let obligationDetails: ObligationDetail[] = [];
        let quarterData: QuarterApiData[] = [];

        if (obligationsRes.ok) {
          const data = await obligationsRes.json();
          obligationDetails = (data.obligations || []).flatMap(
            (b: BusinessObligation) => b.obligationDetails || []
          );
        }

        if (quartersRes.ok) {
          const data = await quartersRes.json();
          quarterData = data.quarters || [];
        }

        const mapped: Quarter[] = allQuarters.map((q, idx) => {
          const qd = quarterData[idx];
          const obligation = obligationDetails.find(
            (o) => o.periodStartDate === q.start && o.periodEndDate === q.end
          );

          const now = new Date();
          now.setHours(0, 0, 0, 0);
          const periodStart = new Date(q.start);
          const daysLeft = getDaysUntil(q.deadline);

          if (obligation?.status === 'Fulfilled' || qd?.submitted) {
            const income = qd?.income || 0;
            const expenses = qd?.expenses || 0;
            const { totalTaxDue } = calculateEstimatedTax(income, expenses);
            return {
              id: `Q${idx + 1}`,
              period: formatPeriodLabel(q.start, q.end),
              status: 'submitted' as const,
              income,
              expenses,
              tax: totalTaxDue,
              submittedDate: qd?.submittedAt
                ? new Date(qd.submittedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                : undefined,
              dueDate: q.deadline,
            };
          }

          if (periodStart > now) {
            return {
              id: `Q${idx + 1}`,
              period: formatPeriodLabel(q.start, q.end),
              status: 'upcoming' as const,
              dueDate: new Date(q.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
            };
          }

          // Open period
          const income = qd?.income || 0;
          const expenses = qd?.expenses || 0;
          const total = qd?.total || 0;
          const pending = qd?.pending || 0;
          const confirmed = qd?.confirmed || 0;
          const { totalTaxDue } = calculateEstimatedTax(income, expenses);
          const progress = total > 0 ? Math.round((confirmed / total) * 100) : 0;

          return {
            id: `Q${idx + 1}`,
            period: formatPeriodLabel(q.start, q.end),
            status: 'review' as const,
            income,
            expenses,
            tax: totalTaxDue,
            dueDate: q.deadline,
            daysLeft: Math.max(0, daysLeft),
            progress,
            unreviewed: pending,
          };
        });

        setQuarters(mapped);
      } catch (err) {
        console.error('Failed to load quarter data:', err);
        // Fallback to empty quarters with date ranges
        const allQuarters = getAllQuarters(taxYear);
        setQuarters(
          allQuarters.map((q, idx) => ({
            id: `Q${idx + 1}`,
            period: formatPeriodLabel(q.start, q.end),
            status: 'upcoming' as const,
            dueDate: new Date(q.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
          }))
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [hasHmrcConnection, taxYear]);

  // No HMRC connection
  if (!hasHmrcConnection) {
    const allQuarters = getAllQuarters(taxYear);
    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900">MTD Quarters</h2>
          <span className="text-xs text-gray-500">{getTaxYearDisplay(taxYear)} Tax Year</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          {allQuarters.map((q, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 + i * 0.08 }}
            >
              <Card className="py-4 relative overflow-hidden">
                <CardContent className="px-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-900">Q{i + 1}</span>
                    <Badge className="bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-50">
                      <Lock className="h-3 w-3 mr-1" /> Locked
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500">{formatPeriodLabel(q.start, q.end)}</p>
                  <p className="text-xs text-gray-400 italic">Connect HMRC to view</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="mt-3 text-center">
          <Link
            href="/settings/hmrc"
            className="text-xs font-medium text-[#00c4d4] hover:text-[#00e3ec] transition-colors"
          >
            Connect to HMRC &rarr;
          </Link>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900">MTD Quarters</h2>
          <span className="text-xs text-gray-500">{getTaxYearDisplay(taxYear)} Tax Year</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="py-4 animate-pulse">
              <CardContent className="px-4 space-y-3">
                <div className="h-4 bg-gray-200 rounded w-1/3" />
                <div className="h-3 bg-gray-100 rounded w-2/3" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-gray-900">MTD Quarters</h2>
        <span className="text-xs text-gray-500">{getTaxYearDisplay(taxYear)} Tax Year</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        {quarters.map((q, i) => (
          <motion.div
            key={q.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 + i * 0.08 }}
          >
            <Card
              className={`py-4 transition-all hover:shadow-md ${
                q.status === 'review' ? 'cursor-pointer ring-1 ring-amber-200' : ''
              }`}
            >
              <CardContent className="px-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-900">{q.id}</span>
                  {getStatusBadge(q.status)}
                </div>

                <p className="text-xs text-gray-500">{q.period}</p>

                {q.status !== 'upcoming' ? (
                  <>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Income</span>
                        <span className="font-medium font-mono text-gray-900">
                          {formatCurrency(q.income ?? 0)}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Expenses</span>
                        <span className="font-medium font-mono text-gray-900">
                          {formatCurrency(q.expenses ?? 0)}
                        </span>
                      </div>
                      <div className="h-px bg-gray-100 my-1" />
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Est. Tax</span>
                        <span
                          className={`font-semibold font-mono ${
                            q.status === 'submitted' ? 'text-green-600' : 'text-amber-600'
                          }`}
                        >
                          {formatCurrency(q.tax ?? 0)}
                        </span>
                      </div>
                    </div>

                    {q.status === 'review' && (
                      <div className="pt-1">
                        <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                          <span>{q.unreviewed} to review</span>
                          <span>{q.daysLeft} days left</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-1000"
                            style={{ width: `${q.progress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {q.status === 'submitted' && q.submittedDate && (
                      <p className="text-[10px] text-gray-400 pt-1">
                        Submitted {q.submittedDate}
                      </p>
                    )}
                  </>
                ) : (
                  <div className="text-xs text-gray-400 italic">
                    <p>Due {q.dueDate}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
