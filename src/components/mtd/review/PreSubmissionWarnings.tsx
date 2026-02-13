'use client'

import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

interface PreSubmissionWarningsProps {
  warnings: {
    uncategorisedCount: number
    unconfirmedAiCount: number
    personalCount: number
  }
}

export function PreSubmissionWarnings({ warnings }: PreSubmissionWarningsProps) {
  const items: { message: string; href: string }[] = []

  if (warnings.uncategorisedCount > 0) {
    items.push({
      message: `${warnings.uncategorisedCount} transaction${warnings.uncategorisedCount === 1 ? '' : 's'} not yet categorised — these won't be included in your submission`,
      href: '/transactions?filter=needs_review',
    })
  }

  if (warnings.unconfirmedAiCount > 0) {
    items.push({
      message: `${warnings.unconfirmedAiCount} AI-suggested categor${warnings.unconfirmedAiCount === 1 ? 'y' : 'ies'} not yet confirmed`,
      href: '/transactions?filter=needs_review',
    })
  }

  if (items.length === 0) return null

  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <Card key={i} className="border-amber-200 bg-amber-50">
          <CardContent className="flex items-start gap-3 py-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-amber-800">{item.message}</p>
              <Link
                href={item.href}
                className="text-xs font-medium text-amber-700 hover:text-amber-900 underline mt-1 inline-block"
              >
                Review transactions &rarr;
              </Link>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
