'use client'

import { useEffect, useState } from 'react'
import { HMRCStatusWidget } from './hmrc-status-widget'
import { getMTDQuarters, getNextDeadline, formatDeadline, getCurrentTaxYear } from '@/lib/hmrc/deadlines'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

interface HMRCStatus {
  connected: boolean
  expiresAt: string | null
  scope: string | null
}

interface MTDData {
  summary: {
    readyQuarters: number
  }
}

interface HMRCWidgetWrapperProps {
  taxYear?: string
}

export function HMRCWidgetWrapper({ taxYear }: HMRCWidgetWrapperProps) {
  const [status, setStatus] = useState<HMRCStatus | null>(null)
  const [mtdData, setMtdData] = useState<MTDData | null>(null)
  const [loading, setLoading] = useState(true)

  const year = taxYear || getCurrentTaxYear()

  useEffect(() => {
    async function fetchData() {
      try {
        const [statusRes, mtdRes] = await Promise.all([
          fetch('/api/hmrc/status'),
          fetch(`/api/mtd/quarters?tax_year=${year}`),
        ])

        if (statusRes.ok) {
          setStatus(await statusRes.json())
        }
        if (mtdRes.ok) {
          setMtdData(await mtdRes.json())
        }
      } catch (error) {
        console.error('Failed to fetch HMRC/MTD data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [year])

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-24" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-16" />
            <Skeleton className="h-10 w-16" />
          </div>
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-9 w-full" />
        </CardContent>
      </Card>
    )
  }

  // Default values if API fails
  const isExpired = status?.expiresAt && new Date(status.expiresAt) < new Date()
  const connectionStatus: 'connected' | 'disconnected' | 'expired' = status?.connected
    ? 'connected'
    : isExpired
    ? 'expired'
    : 'disconnected'

  // Get quarter info
  const nextDeadline = getNextDeadline(year)

  return (
    <HMRCStatusWidget
      isConnected={status?.connected || false}
      status={connectionStatus}
      quarters={{
        ready: mtdData?.summary?.readyQuarters || 0,
        submitted: 0, // TODO: Track submitted quarters
        total: 4,
      }}
      nextDeadline={
        nextDeadline
          ? {
              quarter: nextDeadline.quarter,
              deadline: formatDeadline(nextDeadline.deadline),
              daysRemaining: nextDeadline.daysUntilDeadline,
            }
          : null
      }
      taxYear={year}
    />
  )
}
