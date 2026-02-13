'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { AlertTriangle, CircleCheck, X } from 'lucide-react'
import Link from 'next/link'

interface Anomaly {
  type: string
  description: string
  transactionId?: string
  amount?: number
}

interface ExpenseAnomaliesProps {
  anomalies: Anomaly[]
}

export function ExpenseAnomalies({ anomalies }: ExpenseAnomaliesProps) {
  const [dismissed, setDismissed] = useState<Set<number>>(new Set())

  const visible = anomalies.filter((_, i) => !dismissed.has(i))

  const handleDismiss = (idx: number) => {
    setDismissed((prev) => new Set(prev).add(idx))
  }

  return (
    <Card>
      <CardContent className="space-y-3">
        <h3 className="text-base font-semibold text-gray-900">Expense Anomalies</h3>

        {visible.length === 0 ? (
          <div className="flex items-center gap-2 py-3">
            <CircleCheck className="h-4 w-4 text-green-500" />
            <p className="text-sm text-gray-500">No anomalies detected — your records look clean.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {visible.map((anomaly, i) => {
              const originalIdx = anomalies.indexOf(anomaly)
              return (
                <div
                  key={originalIdx}
                  className="relative flex items-start gap-3 rounded-lg border border-amber-100 bg-amber-50/50 p-3"
                >
                  <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0 pr-6">
                    <p className="text-xs text-gray-700 leading-relaxed">{anomaly.description}</p>
                    {anomaly.transactionId && (
                      <Link
                        href="/transactions"
                        className="text-[10px] font-medium text-[#00a8b0] hover:text-[#00c4d4] mt-1 inline-block transition-colors"
                      >
                        Review &rarr;
                      </Link>
                    )}
                  </div>
                  <button
                    onClick={() => handleDismiss(originalIdx)}
                    className="absolute top-2 right-2 p-0.5 text-gray-300 hover:text-gray-500 transition-colors"
                    aria-label="Dismiss"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
