"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { createClient } from "@/lib/supabase/client"
import type { Referral } from "@/lib/partners/types"

interface RecentReferralsProps {
  partnerId: string
}

export function RecentReferrals({ partnerId }: RecentReferralsProps) {
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchReferrals() {
      const supabase = createClient()
      const { data } = await supabase
        .from("referrals")
        .select("*")
        .eq("partner_id", partnerId)
        .order("clicked_at", { ascending: false })
        .limit(10)

      setReferrals(data || [])
      setLoading(false)
    }

    fetchReferrals()
  }, [partnerId])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "subscribed":
        return <Badge className="bg-green-500">Subscribed</Badge>
      case "signed_up":
        return <Badge variant="secondary">Signed Up</Badge>
      case "clicked":
        return <Badge variant="outline">Clicked</Badge>
      case "churned":
        return <Badge variant="destructive">Churned</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Referrals</CardTitle>
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
        <CardTitle className="text-base">Recent Referrals</CardTitle>
      </CardHeader>
      <CardContent>
        {referrals.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No referrals yet. Share your link to get started!
          </p>
        ) : (
          <div className="space-y-3">
            {referrals.map((referral) => (
              <div
                key={referral.id}
                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
              >
                <div>
                  <p className="text-sm font-medium">
                    {referral.referred_email || "Anonymous visitor"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(referral.clicked_at)}
                  </p>
                </div>
                {getStatusBadge(referral.status)}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
