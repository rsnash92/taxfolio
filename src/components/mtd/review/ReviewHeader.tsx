'use client'

import Link from 'next/link'
import { ArrowLeft, Clock } from 'lucide-react'
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

export function ReviewHeader({
  quarterNumber,
  taxYear,
  periodStart,
  periodEnd,
  previousSubmission,
}: ReviewHeaderProps) {
  const displayYear = taxYear.replace('-', '/')

  return (
    <div className="space-y-2">
      <Link
        href="/mtd/quarterly"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to obligations
      </Link>

      <div className="flex items-center gap-3 flex-wrap">
        <h1 className="text-2xl font-bold text-gray-900">
          Q{quarterNumber} {displayYear} Review
        </h1>
        {previousSubmission && (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
            <Clock className="h-3 w-3 mr-1" />
            Previously submitted {formatDate(previousSubmission.submittedAt.split('T')[0])} — resubmission will overwrite
          </Badge>
        )}
      </div>

      <p className="text-sm text-gray-500">
        {formatDate(periodStart)} to {formatDate(periodEnd)}
      </p>
    </div>
  )
}
