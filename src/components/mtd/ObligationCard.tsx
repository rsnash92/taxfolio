'use client';

import { Calendar, Clock, CheckCircle, AlertTriangle, ArrowRight } from 'lucide-react';
import type { ObligationWithDisplayStatus, BusinessType } from '@/types/mtd';
import { formatPeriod, formatDateRange, getDeadlineDescription } from '@/lib/mtd/quarters';
import { cn } from '@/lib/utils';

interface ObligationCardProps {
  obligation: ObligationWithDisplayStatus;
  onSelect: (obligation: ObligationWithDisplayStatus) => void;
}

const statusConfig: Record<
  ObligationWithDisplayStatus['displayStatus'],
  {
    label: string;
    icon: typeof CheckCircle;
    bgColor: string;
    textColor: string;
    borderColor: string;
  }
> = {
  fulfilled: {
    label: 'Submitted',
    icon: CheckCircle,
    bgColor: 'bg-green-50',
    textColor: 'text-green-700',
    borderColor: 'border-green-200',
  },
  open: {
    label: 'Open',
    icon: Clock,
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-700',
    borderColor: 'border-amber-200',
  },
  overdue: {
    label: 'Overdue',
    icon: AlertTriangle,
    bgColor: 'bg-red-50',
    textColor: 'text-red-700',
    borderColor: 'border-red-200',
  },
  upcoming: {
    label: 'Upcoming',
    icon: Calendar,
    bgColor: 'bg-gray-50',
    textColor: 'text-gray-600',
    borderColor: 'border-gray-200',
  },
};

const businessTypeLabels: Record<BusinessType, string> = {
  'self-employment': 'Self-Employment',
  'uk-property': 'UK Property',
  'foreign-property': 'Foreign Property',
};

export function ObligationCard({ obligation, onSelect }: ObligationCardProps) {
  const status = statusConfig[obligation.displayStatus];
  const StatusIcon = status.icon;
  const isFulfilled = obligation.displayStatus === 'fulfilled';
  const isOverdue = obligation.displayStatus === 'overdue';

  return (
    <div
      className={cn(
        'bg-white border rounded-xl p-5 transition-all duration-200',
        isFulfilled ? 'border-gray-100' : 'border-gray-200 hover:border-cyan-300 hover:shadow-md cursor-pointer',
        isOverdue && 'border-red-200'
      )}
      onClick={() => !isFulfilled && onSelect(obligation)}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Business name and period */}
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              {businessTypeLabels[obligation.businessType]}
            </span>
            {obligation.businessName && (
              <>
                <span className="text-gray-300">•</span>
                <span className="text-xs text-gray-500 truncate">
                  {obligation.businessName}
                </span>
              </>
            )}
          </div>

          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {formatPeriod(obligation.periodStartDate, obligation.periodEndDate)}
          </h3>

          <p className="text-sm text-gray-500 mb-3">
            {formatDateRange(obligation.periodStartDate, obligation.periodEndDate)}
          </p>

          {/* Deadline info */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-gray-400" />
              <span
                className={cn(
                  'text-sm font-medium',
                  isOverdue ? 'text-red-600' : 'text-gray-600'
                )}
              >
                {getDeadlineDescription(obligation.dueDate)}
              </span>
            </div>

            {obligation.receivedDate && (
              <div className="flex items-center gap-1.5">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm text-gray-500">
                  Submitted {new Date(obligation.receivedDate).toLocaleDateString('en-GB')}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Status badge and action */}
        <div className="flex flex-col items-end gap-3">
          <div
            className={cn(
              'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
              status.bgColor,
              status.textColor,
              'border',
              status.borderColor
            )}
          >
            <StatusIcon className="h-3.5 w-3.5" />
            {status.label}
          </div>

          {!isFulfilled && (
            <button
              className={cn(
                'inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                'bg-gradient-to-r from-cyan-500 to-cyan-600 text-white hover:from-cyan-600 hover:to-cyan-700',
                'shadow-sm hover:shadow'
              )}
              onClick={(e) => {
                e.stopPropagation();
                onSelect(obligation);
              }}
            >
              View and submit
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
