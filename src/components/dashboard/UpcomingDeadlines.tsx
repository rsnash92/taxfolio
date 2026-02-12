'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { EmptyState } from './EmptyState';
import { Calendar } from 'lucide-react';
import Link from 'next/link';

interface UpcomingDeadlinesProps {
  hasHmrcConnection: boolean;
  taxYear?: string;
}

interface Deadline {
  name: string;
  date: string;
  daysLeft: number;
  urgent: boolean;
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

function getDaysUntil(dateStr: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function formatDeadlineDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function getQuarterLabel(start: string): string {
  const month = new Date(start).getMonth();
  if (month >= 3 && month <= 5) return 'Q1';
  if (month >= 6 && month <= 8) return 'Q2';
  if (month >= 9 && month <= 11) return 'Q3';
  return 'Q4';
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

export function UpcomingDeadlines({ hasHmrcConnection, taxYear: taxYearProp }: UpcomingDeadlinesProps) {
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [loading, setLoading] = useState(hasHmrcConnection);

  useEffect(() => {
    if (!hasHmrcConnection) return;

    const fetchDeadlines = async () => {
      setLoading(true);
      try {
        const taxYear = taxYearProp || getCurrentTaxYear();
        const res = await fetch(`/api/mtd/obligations?taxYear=${taxYear}`);
        if (!res.ok) throw new Error('Failed to fetch');

        const data = await res.json();
        const obligations: ObligationDetail[] = (data.obligations || []).flatMap(
          (b: BusinessObligation) => b.obligationDetails || []
        );

        // Filter to open obligations, sort by due date
        const openObligations = obligations
          .filter((o) => o.status === 'Open')
          .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
          .slice(0, 3);

        const mapped: Deadline[] = openObligations.map((o) => {
          const daysLeft = getDaysUntil(o.dueDate);
          return {
            name: `${getQuarterLabel(o.periodStartDate)} Submission`,
            date: formatDeadlineDate(o.dueDate),
            daysLeft: Math.max(0, daysLeft),
            urgent: daysLeft <= 30,
          };
        });

        // Add payment on account deadline (31 Jan) if within next 6 months
        const startYear = parseInt(taxYear.split('-')[0]);
        const poaDate = `${startYear + 1}-01-31`;
        const poaDays = getDaysUntil(poaDate);
        if (poaDays > 0 && poaDays <= 180) {
          mapped.push({
            name: 'Payment on Account',
            date: formatDeadlineDate(poaDate),
            daysLeft: poaDays,
            urgent: poaDays <= 30,
          });
        }

        // Sort and take top 3
        mapped.sort((a, b) => a.daysLeft - b.daysLeft);
        setDeadlines(mapped.slice(0, 3));
      } catch {
        setDeadlines([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDeadlines();
  }, [hasHmrcConnection, taxYearProp]);

  if (!hasHmrcConnection) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.6 }}
      >
        <EmptyState
          icon={<Calendar className="h-6 w-6 text-gray-400" />}
          title="Connect to HMRC"
          description="Link your HMRC account to see your MTD filing deadlines."
          action={{ label: 'Connect HMRC', href: '/settings/hmrc' }}
        />
      </motion.div>
    );
  }

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.6 }}
      >
        <Card>
          <CardContent className="animate-pulse">
            <div className="h-3 bg-gray-200 rounded w-1/3 mb-4" />
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex justify-between">
                  <div className="space-y-1">
                    <div className="h-3 bg-gray-200 rounded w-24" />
                    <div className="h-2 bg-gray-100 rounded w-32" />
                  </div>
                  <div className="h-5 bg-gray-100 rounded w-16" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  if (deadlines.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.6 }}
      >
        <Card>
          <CardContent>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
              Upcoming
            </h3>
            <p className="text-sm text-gray-400">No upcoming deadlines.</p>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.6 }}
    >
      <Card>
        <CardContent>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
            Upcoming
          </h3>

          <div className="space-y-3">
            {deadlines.map((deadline, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900">{deadline.name}</p>
                  <p className="text-xs text-gray-500">{deadline.date}</p>
                </div>

                {deadline.urgent ? (
                  <Badge className="bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50 shrink-0">
                    {deadline.daysLeft} days
                  </Badge>
                ) : (
                  <span className="text-xs font-medium text-gray-400 shrink-0">
                    {deadline.daysLeft} days
                  </span>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
