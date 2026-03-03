"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2 } from "lucide-react"

interface BillingSettingsProps {
  currentTier: string
  subscriptionStatus: string
  maxClients: number
  currentClients: number
  isOwner: boolean
}

const TIERS = [
  { id: "starter", name: "Starter", price: "Free", clients: 10, features: ["10 clients", "MTD quarterly", "SA100 annual", "Email support"] },
  { id: "growth", name: "Growth", price: "£49/mo", clients: 50, features: ["50 clients", "Everything in Starter", "AI email drafting", "Priority support"] },
  { id: "practice", name: "Practice", price: "£149/mo", clients: 200, features: ["200 clients", "Everything in Growth", "Team management", "Custom branding"] },
  { id: "enterprise", name: "Enterprise", price: "£399/mo", clients: 1000, features: ["1,000 clients", "Everything in Practice", "API access", "Dedicated support"] },
]

export function BillingSettings({ currentTier, subscriptionStatus, maxClients, currentClients, isOwner }: BillingSettingsProps) {
  const [loading, setLoading] = useState<string | null>(null)

  async function handleSubscribe(tier: string) {
    setLoading(tier)
    try {
      const res = await fetch("/api/practice/billing/create-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier }),
      })

      if (!res.ok) {
        const data = await res.json()
        alert(data.error || "Failed to create subscription")
        return
      }

      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch {
      alert("Something went wrong")
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Current plan</CardTitle>
          <CardDescription>
            {currentClients} of {maxClients} clients used
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <span className="text-lg font-semibold capitalize">{currentTier}</span>
            <Badge variant={subscriptionStatus === 'active' ? 'default' : 'secondary'}>
              {subscriptionStatus}
            </Badge>
          </div>
          <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${Math.min(100, (currentClients / maxClients) * 100)}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {isOwner && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {TIERS.map((tier) => (
            <Card key={tier.id} className={tier.id === currentTier ? "border-primary" : ""}>
              <CardHeader>
                <CardTitle className="text-lg">{tier.name}</CardTitle>
                <CardDescription className="text-xl font-bold text-foreground">
                  {tier.price}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1 text-sm text-muted-foreground mb-4">
                  {tier.features.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
                {tier.id === currentTier ? (
                  <Button variant="outline" className="w-full" disabled>
                    Current plan
                  </Button>
                ) : tier.id === "starter" ? (
                  <Button variant="outline" className="w-full" disabled>
                    Free tier
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    onClick={() => handleSubscribe(tier.id)}
                    disabled={loading !== null}
                  >
                    {loading === tier.id ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    {currentTier === "starter" ? "Subscribe" : "Switch"}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
