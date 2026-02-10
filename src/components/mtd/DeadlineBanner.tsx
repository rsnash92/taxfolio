'use client';

import { AlertTriangle, Clock, ChevronRight } from 'lucide-react';
import type { ObligationWithDisplayStatus } from '@/types/mtd';
import { formatPeriod, getDaysUntilDue } from '@/lib/mtd/quarters';
import { cn } from '@/lib/utils';

interface DeadlineBannerProps {
  nextObligation: ObligationWithDisplayStatus | null;
  onSelect: (obligation: ObligationWithDisplayStatus) => void;
}

export function DeadlineBanner({ nextObligation, onSelect }: DeadlineBannerProps) {
  if (!nextObligation) {
    return null;
  }

  const daysUntil = getDaysUntilDue(nextObligation.dueDate);
  const isOverdue = daysUntil < 0;
  const isUrgent = daysUntil >= 0 && daysUntil <= 14;

  if (!isOverdue && !isUrgent) {
    return null;
  }

  const Icon = isOverdue ? AlertTriangle : Clock;

  return (
    <div
      className={cn(
        'rounded-xl p-4 mb-6 cursor-pointer transition-all duration-200',
        isOverdue
          ? 'bg-red-50 border border-red-200 hover:border-red-300'
          : 'bg-amber-50 border border-amber-200 hover:border-amber-300'
      )}
      onClick={() => onSelect(nextObligation)}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'p-2 rounded-lg',
              isOverdue ? 'bg-red-100' : 'bg-amber-100'
            )}
          >
            <Icon
              className={cn(
                'h-5 w-5',
                isOverdue ? 'text-red-600' : 'text-amber-600'
              )}
            />
          </div>
          <div>
            <p
              className={cn(
                'font-semibold',
                isOverdue ? 'text-red-800' : 'text-amber-800'
              )}
            >
              {isOverdue
                ? `Overdue: ${formatPeriod(nextObligation.periodStartDate, nextObligation.periodEndDate)}`
                : `Due soon: ${formatPeriod(nextObligation.periodStartDate, nextObligation.periodEndDate)}`}
            </p>
            <p
              className={cn(
                'text-sm',
                isOverdue ? 'text-red-600' : 'text-amber-600'
              )}
            >
              {isOverdue
                ? `${Math.abs(daysUntil)} day${Math.abs(daysUntil) === 1 ? '' : 's'} overdue`
                : `${daysUntil} day${daysUntil === 1 ? '' : 's'} remaining`}
            </p>
          </div>
        </div>

        <button
          className={cn(
            'inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
            isOverdue
              ? 'bg-red-600 text-white hover:bg-red-700'
              : 'bg-amber-600 text-white hover:bg-amber-700'
          )}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(nextObligation);
          }}
        >
          Submit now
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
