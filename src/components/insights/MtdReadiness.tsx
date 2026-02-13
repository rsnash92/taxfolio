'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Check, Circle } from 'lucide-react'
import Link from 'next/link'

interface MtdReadinessProps {
  readiness: {
    score: number
    currentQuarter: number
    categorised: number
    total: number
    hmrcConnected: boolean
    bankConnected: boolean
  }
}

function ScoreRing({ score }: { score: number }) {
  const radius = 54
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference
  const color = score >= 80 ? '#22c55e' : score >= 50 ? '#f59e0b' : '#ef4444'

  return (
    <div className="relative w-36 h-36 mx-auto">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 128 128">
        <circle
          cx="64"
          cy="64"
          r={radius}
          fill="none"
          stroke="#f1f5f9"
          strokeWidth="8"
        />
        <circle
          cx="64"
          cy="64"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold font-mono" style={{ color }}>{score}%</span>
        <span className="text-[10px] text-gray-400">Ready</span>
      </div>
    </div>
  )
}

export function MtdReadiness({ readiness }: MtdReadinessProps) {
  const categorisedPct = readiness.total > 0
    ? Math.round((readiness.categorised / readiness.total) * 100)
    : 0

  const checklist = [
    {
      label: 'Bank connected',
      done: readiness.bankConnected,
    },
    {
      label: 'HMRC connected',
      done: readiness.hmrcConnected,
    },
    {
      label: `Transactions categorised (${readiness.categorised} of ${readiness.total})`,
      done: categorisedPct === 100,
    },
  ]

  return (
    <Card className="h-full">
      <CardContent className="space-y-4">
        <h3 className="text-base font-semibold text-gray-900">MTD Readiness</h3>

        <ScoreRing score={readiness.score} />

        {/* Checklist */}
        <div className="space-y-2">
          {checklist.map((item) => (
            <div key={item.label} className="flex items-center gap-2.5">
              {item.done ? (
                <Check className="h-4 w-4 text-green-500 shrink-0" />
              ) : (
                <Circle className="h-4 w-4 text-gray-300 shrink-0" />
              )}
              <span className={`text-xs ${item.done ? 'text-gray-600' : 'text-gray-400'}`}>
                {item.label}
              </span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <Link
          href="/mtd"
          className="block w-full text-center px-4 py-2 text-xs font-semibold rounded-lg bg-[#00e3ec] text-black hover:bg-[#00c4d4] transition-colors"
        >
          Review Q{readiness.currentQuarter} &rarr;
        </Link>
      </CardContent>
    </Card>
  )
}
