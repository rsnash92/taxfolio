"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Building2, CheckCircle2, XCircle, ExternalLink, RefreshCw } from "lucide-react"
import Link from "next/link"

interface HMRCStatus {
  connected: boolean
  expiresAt: string | null
  scope: string | null
}

export function HMRCStatusCard() {
  const [status, setStatus] = useState<HMRCStatus | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStatus()
  }, [])

  const fetchStatus = async () => {
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

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
              <Building2 className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-base">HMRC</CardTitle>
              <CardDescription className="text-xs">Making Tax Digital</CardDescription>
            </div>
          </div>
          {!loading && (
            <Badge variant={status?.connected ? "default" : "secondary"} className="text-xs">
              {status?.connected ? (
                <><CheckCircle2 className="h-3 w-3 mr-1" /> Connected</>
              ) : (
                <><XCircle className="h-3 w-3 mr-1" /> Not connected</>
              )}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <RefreshCw className="h-3 w-3 animate-spin" />
            Checking...
          </div>
        ) : status?.connected ? (
          <Link href="/settings/hmrc">
            <Button variant="outline" size="sm" className="w-full">
              Manage Connection
            </Button>
          </Link>
        ) : (
          <Link href="/api/hmrc/auth">
            <Button size="sm" className="w-full">
              <ExternalLink className="h-3 w-3 mr-2" />
              Connect HMRC
            </Button>
          </Link>
        )}
      </CardContent>
    </Card>
  )
}
