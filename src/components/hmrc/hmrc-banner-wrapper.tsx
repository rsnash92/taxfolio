'use client'

import { useEffect, useState } from 'react'
import { HMRCConnectionBanner } from './hmrc-connection-banner'
import { getMTDQuarters, hasApproachingDeadline, formatDeadline, getCurrentTaxYear } from '@/lib/hmrc/deadlines'
import { Skeleton } from '@/components/ui/skeleton'

interface HMRCStatus {
  connected: boolean
  expiresAt: string | null
  scope: string | null
}

interface HMRCBannerWrapperProps {
  taxYear?: string
}

export function HMRCBannerWrapper({ taxYear }: HMRCBannerWrapperProps) {
  const [status, setStatus] = useState<HMRCStatus | null>(null)
  const [loading, setLoading] = useState(true)

  const year = taxYear || getCurrentTaxYear()

  useEffect(() => {
    async function fetchStatus() {
      try {
        const res = await fetch('/api/hmrc/status')
        if (res.ok) {
          const data = await res.json()
          setStatus(data)
        }
      } catch (error) {
        console.error('Failed to fetch HMRC status:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStatus()
  }, [])

  if (loading) {
    return (
      <div className="mb-6 p-5 bg-muted/50 border rounded-xl">
        <div className="flex items-start gap-4">
          <Skeleton className="h-12 w-12 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-full max-w-md" />
          </div>
        </div>
      </div>
    )
  }

  if (!status) {
    return null
  }

  // Determine connection status
  const isExpired = status.expiresAt && new Date(status.expiresAt) < new Date()
  const connectionStatus: 'connected' | 'disconnected' | 'expired' = status.connected
    ? 'connected'
    : isExpired
    ? 'expired'
    : 'disconnected'

  // Get deadline info
  const deadlineCheck = hasApproachingDeadline(year)

  return (
    <HMRCConnectionBanner
      isConnected={status.connected}
      status={connectionStatus}
      hasApproachingDeadline={deadlineCheck.hasApproaching}
      deadlineInfo={
        deadlineCheck.quarter
          ? {
              quarter: deadlineCheck.quarter.quarter,
              daysRemaining: deadlineCheck.daysRemaining,
              deadline: formatDeadline(deadlineCheck.quarter.deadline),
            }
          : undefined
      }
    />
  )
}
