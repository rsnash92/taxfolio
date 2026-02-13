'use client'

import Link from 'next/link'
import { ArrowLeft, AlertTriangle, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface ReviewHeaderProps {
  quarterNumber: number
  taxYear: string
  periodStart: string
  periodEnd: string
  dueDate?: string
  previousSubmission?: {
    submittedAt: string
  } | null
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function getDaysOverdue(dueDate: string): number {
  const now = new Date()
  const due = new Date(dueDate + 'T00:00:00')
  const diff = Math.floor((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24))
  return Math.max(0, diff)
}

export function ReviewHeader({
  quarterNumber,
  taxYear,
  periodStart,
  periodEnd,
  dueDate,
  previousSubmission,
}: ReviewHeaderProps) {
  const displayYear = taxYear.replace('-', '/')
  const daysOverdue = dueDate ? getDaysOverdue(dueDate) : 0

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Link
          href="/mtd/quarterly"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to obligations
        </Link>
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
          <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
          Connected to HMRC
        </span>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <h1 className="text-2xl font-bold text-gray-900">
          Q{quarterNumber} {displayYear} Review
        </h1>
        {daysOverdue > 0 && (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            <AlertTriangle className="h-3 w-3 mr-1" />
            {daysOverdue} days overdue
          </Badge>
        )}
        {previousSubmission && (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
            <Clock className="h-3 w-3 mr-1" />
            Previously submitted {formatDate(previousSubmission.submittedAt.split('T')[0])} — resubmission will overwrite
          </Badge>
        )}
      </div>

      <p className="text-sm text-gray-500">
        {formatDate(periodStart)} to {formatDate(periodEnd)}
        {dueDate && <span className="ml-2 text-gray-400">· Due {formatDate(dueDate)}</span>}
      </p>
    </div>
  )
}
