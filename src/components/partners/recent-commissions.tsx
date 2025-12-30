"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { createClient } from "@/lib/supabase/client"
import type { Commission } from "@/lib/partners/types"

interface RecentCommissionsProps {
  partnerId: string
}

export function RecentCommissions({ partnerId }: RecentCommissionsProps) {
  const [commissions, setCommissions] = useState<Commission[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchCommissions() {
      const supabase = createClient()
      const { data } = await supabase
        .from("commissions")
        .select("*")
        .eq("partner_id", partnerId)
        .order("created_at", { ascending: false })
        .limit(10)

      setCommissions(data || [])
      setLoading(false)
    }

    fetchCommissions()
  }, [partnerId])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge className="bg-green-500">Paid</Badge>
      case "approved":
        return <Badge variant="secondary">Approved</Badge>
      case "pending":
        return <Badge variant="outline">Pending</Badge>
      case "refunded":
        return <Badge variant="destructive">Refunded</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
    })
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Commissions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Recent Commissions</CardTitle>
      </CardHeader>
      <CardContent>
        {commissions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No commissions yet. Earnings will appear when referrals subscribe.
          </p>
        ) : (
          <div className="space-y-3">
            {commissions.map((commission) => (
              <div
                key={commission.id}
                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
              >
                <div>
                  <p className="text-sm font-medium">
                    £{commission.commission_amount.toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {commission.plan_name} • {formatDate(commission.created_at)}
                  </p>
                </div>
                {getStatusBadge(commission.status)}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
