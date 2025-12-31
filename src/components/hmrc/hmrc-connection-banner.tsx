'use client'

import Link from 'next/link'
import { AlertTriangle, CheckCircle, ExternalLink, X, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

interface HMRCConnectionBannerProps {
  isConnected: boolean
  status: 'connected' | 'disconnected' | 'expired'
  hasApproachingDeadline?: boolean
  deadlineInfo?: {
    quarter: number
    daysRemaining: number
    deadline: string
  }
}

export function HMRCConnectionBanner({
  isConnected,
  status,
  hasApproachingDeadline,
  deadlineInfo,
}: HMRCConnectionBannerProps) {
  const [dismissed, setDismissed] = useState(false)

  // Connected state
  if (isConnected) {
    return (
      <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <div>
              <p className="text-sm font-medium">Connected to HMRC</p>
              <p className="text-xs text-muted-foreground">Ready to submit your quarterly returns</p>
            </div>
          </div>
          <Link href="/settings/hmrc">
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              Manage
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  // Expired state
  if (status === 'expired') {
    return (
      <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
        <div className="flex items-start gap-3">
          <Clock className="h-5 w-5 text-amber-500 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium">HMRC connection expired</p>
            <p className="text-sm text-muted-foreground mt-1">
              Your Government Gateway session has expired. Reconnect to continue submitting returns.
            </p>
            <Link href="/settings/hmrc" className="mt-3 inline-block">
              <Button size="sm">
                <ExternalLink className="h-4 w-4 mr-2" />
                Reconnect to HMRC
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Not connected state
  if (dismissed) {
    return null
  }

  // Deadline approaching - urgent banner
  if (hasApproachingDeadline && deadlineInfo) {
    return (
      <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium">
              Q{deadlineInfo.quarter} deadline in {deadlineInfo.daysRemaining} days!
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Connect your Government Gateway account to submit your Q{deadlineInfo.quarter} return
              before {deadlineInfo.deadline}.
            </p>
            <div className="flex items-center gap-3 mt-3">
              <Link href="/settings/hmrc">
                <Button size="sm">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Connect Government Gateway
                </Button>
              </Link>
              <Link
                href="https://www.gov.uk/guidance/sign-up-your-business-for-making-tax-digital-for-income-tax"
                target="_blank"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Learn about MTD
              </Link>
            </div>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    )
  }

  // Standard not connected banner
  return (
    <div className="mb-6 p-5 bg-muted/50 border rounded-xl">
      <div className="flex items-start gap-4">
        <div className="p-3 bg-amber-500/20 rounded-xl">
          <AlertTriangle className="h-6 w-6 text-amber-500" />
        </div>
        <div className="flex-1">
          <h3 className="text-base font-semibold">
            Connect to HMRC to submit your returns
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Link your Government Gateway account to submit your quarterly Making Tax Digital
            returns directly to HMRC. This is required for MTD compliance from April 2026.
          </p>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Submit self-employment income (SA103)
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Submit property income (SA105)
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle className="h-4 w-4 text-green-500" />
              View tax calculations
            </span>
          </div>

          <div className="flex items-center gap-3 mt-4">
            <Link href="/settings/hmrc">
              <Button>
                <ExternalLink className="h-4 w-4 mr-2" />
                Connect Government Gateway
              </Button>
            </Link>
            <button
              onClick={() => setDismissed(true)}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Maybe later
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
