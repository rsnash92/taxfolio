'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Lightbulb, X } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface Opportunity {
  title: string
  saving: number
  explanation: string
  action: string
}

export function TaxSavings() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [loading, setLoading] = useState(true)
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetch('/api/insights/savings')
      .then((res) => res.json())
      .then((data) => {
        setOpportunities(data.opportunities || [])
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const handleDismiss = (title: string) => {
    setDismissed((prev) => new Set(prev).add(title))
  }

  const visibleOpportunities = opportunities.filter((o) => !dismissed.has(o.title))
  const totalSavings = visibleOpportunities.reduce((sum, o) => sum + (o.saving || 0), 0)

  if (loading) {
    return (
      <Card>
        <CardContent className="space-y-4">
          <h3 className="text-base font-semibold text-gray-900">Tax Savings Opportunities</h3>
          <div className="space-y-3">
            <Skeleton className="h-24 rounded-lg" />
            <Skeleton className="h-24 rounded-lg" />
            <Skeleton className="h-24 rounded-lg" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (opportunities.length === 0) {
    return (
      <Card>
        <CardContent>
          <h3 className="text-base font-semibold text-gray-900 mb-2">Tax Savings Opportunities</h3>
          <p className="text-sm text-gray-500">
            Keep categorising your transactions — we&apos;ll find savings as your data builds up.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900">Tax Savings Opportunities</h3>
          {totalSavings > 0 && (
            <span className="text-sm font-medium text-green-600 font-mono">
              Up to {formatCurrency(totalSavings)}/year
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {visibleOpportunities.map((opp) => (
            <div
              key={opp.title}
              className="relative rounded-lg border border-green-100 bg-green-50/50 p-4"
            >
              <button
                onClick={() => handleDismiss(opp.title)}
                className="absolute top-2 right-2 p-1 text-gray-300 hover:text-gray-500 transition-colors"
                aria-label="Dismiss"
              >
                <X className="h-3.5 w-3.5" />
              </button>

              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-green-100">
                  <Lightbulb className="h-4 w-4 text-green-600" />
                </div>
                <div className="min-w-0 pr-4">
                  <p className="text-sm font-medium text-gray-900">{opp.title}</p>
                  {opp.saving > 0 && (
                    <p className="text-xs font-medium text-green-600 font-mono mt-0.5">
                      Save up to {formatCurrency(opp.saving)}/year
                    </p>
                  )}
                </div>
              </div>
              <p className="text-xs text-gray-600 mt-2 leading-relaxed">{opp.explanation}</p>
              <p className="text-xs text-[#00a8b0] font-medium mt-2">{opp.action}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
