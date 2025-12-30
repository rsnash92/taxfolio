"use client"

import { Clock } from "lucide-react"
import Link from "next/link"

interface TrialBannerProps {
  daysLeft: number
}

export function TrialBanner({ daysLeft }: TrialBannerProps) {
  const urgency = daysLeft <= 3
    ? "bg-red-500/10 border-red-500/20 text-red-400"
    : daysLeft <= 7
      ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
      : "bg-blue-500/10 border-blue-500/20 text-blue-400"

  return (
    <div className={`border rounded-lg px-4 py-3 flex items-center justify-between ${urgency}`}>
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4" />
        <span className="text-sm font-medium">
          {daysLeft === 0
            ? "Your trial ends today!"
            : `${daysLeft} day${daysLeft === 1 ? "" : "s"} left in your free trial`
          }
        </span>
      </div>
      <Link
        href="/settings/billing"
        className="text-sm font-medium underline hover:no-underline"
      >
        Subscribe now
      </Link>
    </div>
  )
}
