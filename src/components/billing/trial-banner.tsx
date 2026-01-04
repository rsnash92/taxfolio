"use client"

import { Sparkles } from "lucide-react"
import Link from "next/link"

interface TrialBannerProps {
  daysLeft: number
}

export function TrialBanner({ daysLeft }: TrialBannerProps) {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-[#00e3ec] px-4 py-1.5 flex items-center justify-center gap-2">
      <Sparkles className="h-3.5 w-3.5 text-black" />
      <span className="text-xs font-medium text-black">
        {daysLeft} day{daysLeft === 1 ? "" : "s"} left in trial
      </span>
      <span className="text-black/60">•</span>
      <Link
        href="/settings/billing"
        className="text-xs font-semibold text-black underline hover:no-underline"
      >
        Upgrade early for 10% off
      </Link>
    </div>
  )
}
