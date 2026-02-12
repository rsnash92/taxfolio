"use client"

import Link from "next/link"

interface TrialBannerProps {
  daysLeft: number
}

export function TrialBanner({ daysLeft }: TrialBannerProps) {
  return (
    <div className="rounded-lg bg-gray-50 border border-gray-200 px-4 py-2 flex items-center justify-between text-sm mb-4">
      <span className="text-gray-600">
        Free trial{" "}
        <span className="text-gray-500">·</span>{" "}
        <span className="font-medium text-gray-900">
          {daysLeft} day{daysLeft === 1 ? "" : "s"} remaining
        </span>
      </span>
      <Link
        href="/settings/billing"
        className="text-xs font-medium text-[#00c4d4] hover:text-[#00a8b8] transition-colors"
      >
        View plans &rarr;
      </Link>
    </div>
  )
}
