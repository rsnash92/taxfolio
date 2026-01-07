"use client"

import { Progress } from "@/components/ui/progress"

interface UsageMeterProps {
  label: string
  current: number
  limit: number
}

export function UsageMeter({ label, current, limit }: UsageMeterProps) {
  // -1 means unlimited
  if (limit === -1) {
    return (
      <div>
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-gray-500">{label}</span>
          <span className="text-gray-900">{current} (Unlimited)</span>
        </div>
        <Progress value={0} className="h-2" />
      </div>
    )
  }

  const percentage = Math.min((current / limit) * 100, 100)
  const isNearLimit = percentage >= 80
  const isAtLimit = current >= limit

  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-2">
        <span className="text-gray-500">{label}</span>
        <span className={isAtLimit ? "text-red-500" : isNearLimit ? "text-amber-500" : "text-gray-900"}>
          {current} / {limit}
        </span>
      </div>
      <Progress
        value={percentage}
        className={`h-2 ${isAtLimit ? "[&>div]:bg-red-500" : isNearLimit ? "[&>div]:bg-amber-500" : "[&>div]:bg-[#00e3ec]"}`}
      />
      {isAtLimit && (
        <p className="text-xs text-red-500 mt-1">
          Limit reached. Upgrade to continue.
        </p>
      )}
    </div>
  )
}
