"use client"

import { Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface UpgradePromptProps {
  feature: string
  current?: number
  limit?: number
  isTrial?: boolean
}

export function UpgradePrompt({ feature, current, limit, isTrial }: UpgradePromptProps) {
  const showUsage = current !== undefined && limit !== undefined

  return (
    <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
      <div className="flex items-start gap-3">
        <Zap className="h-5 w-5 text-amber-500 mt-0.5" />
        <div>
          <p className="text-amber-200 font-medium">
            {isTrial ? "Trial limit reached" : "Upgrade required"}
          </p>
          <p className="text-amber-100/70 text-sm mt-1">
            {showUsage ? (
              <>
                You&apos;ve used {current} of {limit} {feature} {isTrial ? "on the free trial" : ""}.
                Upgrade to Pro for unlimited access.
              </>
            ) : (
              <>
                This feature requires a Pro subscription.
                Upgrade to unlock {feature}.
              </>
            )}
          </p>
          <div className="flex gap-3 mt-3">
            <Link href="/settings/billing">
              <Button size="sm" className="bg-amber-500 hover:bg-amber-400 text-black">
                Upgrade to Pro
              </Button>
            </Link>
            <Link href="/settings/billing">
              <Button size="sm" variant="outline">
                View Plans
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
