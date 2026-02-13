'use client'

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { CheckCircle2, Copy, Check } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { useState } from 'react'

interface SubmissionSuccessProps {
  correlationId?: string
  submittedAt: string
  cumulativeIncome: number
  cumulativeExpenses: number
  netProfit: number
  quarterNumber: number
  taxYear: string
}

export function SubmissionSuccess({
  correlationId,
  submittedAt,
  cumulativeIncome,
  cumulativeExpenses,
  netProfit,
  quarterNumber,
  taxYear,
}: SubmissionSuccessProps) {
  const [copied, setCopied] = useState(false)
  const displayYear = taxYear.replace('-', '/')

  const handleCopy = async () => {
    if (correlationId) {
      await navigator.clipboard.writeText(correlationId)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const formattedDate = new Date(submittedAt).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className="max-w-lg mx-auto space-y-6 py-8">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100">
          <CheckCircle2 className="h-8 w-8 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Submitted successfully</h1>
        <p className="text-sm text-gray-500">
          Q{quarterNumber} {displayYear} quarterly update has been submitted to HMRC
        </p>
      </div>

      <Card>
        <CardContent className="space-y-4">
          {correlationId && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">HMRC Correlation ID</p>
              <div className="flex items-center gap-2">
                <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded flex-1 break-all">
                  {correlationId}
                </code>
                <button
                  onClick={handleCopy}
                  className="p-1.5 rounded hover:bg-gray-100 transition-colors shrink-0"
                  title="Copy to clipboard"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
          )}

          <div>
            <p className="text-xs font-medium text-gray-500 mb-1">Submitted at</p>
            <p className="text-sm text-gray-900">{formattedDate}</p>
          </div>

          <div className="border-t pt-3 space-y-2">
            <p className="text-xs font-medium text-gray-500">Summary</p>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Income</span>
                <span className="font-mono text-gray-900">{formatCurrency(cumulativeIncome)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Expenses</span>
                <span className="font-mono text-gray-900">({formatCurrency(cumulativeExpenses)})</span>
              </div>
              <div className="flex justify-between border-t pt-1.5 font-semibold">
                <span className="text-gray-900">Net Profit</span>
                <span className={`font-mono ${netProfit >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                  {formatCurrency(netProfit)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="text-center">
        <Link
          href="/mtd/quarterly"
          className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium rounded-lg bg-[#00e3ec] text-black hover:bg-[#00c4d4] transition-colors"
        >
          Back to obligations
        </Link>
      </div>
    </div>
  )
}
