"use client"

import { Sparkles } from "lucide-react"
import Link from "next/link"

interface TrialBannerProps {
  daysLeft: number
}

export function TrialBanner({ daysLeft }: TrialBannerProps) {
  return (
    <div className="bg-[#15e49e] px-4 py-2 flex items-center justify-center gap-2">
      <Sparkles className="h-4 w-4 text-black" />
      <span className="text-sm font-medium text-black">
        {daysLeft} day{daysLeft === 1 ? "" : "s"} left in trial
      </span>
      <span className="text-black/60">•</span>
      <Link
        href="/settings/billing"
        className="text-sm font-semibold text-black underline hover:no-underline"
      >
        Upgrade now for 20% off
      </Link>
    </div>
  )
}
