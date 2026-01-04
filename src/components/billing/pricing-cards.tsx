"use client"

import { useState, useEffect } from "react"
import { Check, X, Zap, Loader2 } from "lucide-react"
import { PLANS } from "@/lib/stripe"
import { Button } from "@/components/ui/button"

interface PricingCardsProps {
  currentTier: string
  isLifetime: boolean
  showLifetimeDeal?: boolean
  isTrial?: boolean
}

// Calculate discounted prices (10% off)
const EARLY_BIRD_DISCOUNT = 0.10
const LITE_PRICE = 69.99
const PRO_PRICE = 129.99
const LITE_DISCOUNTED = Math.round(LITE_PRICE * (1 - EARLY_BIRD_DISCOUNT) * 100) / 100
const PRO_DISCOUNTED = Math.round(PRO_PRICE * (1 - EARLY_BIRD_DISCOUNT) * 100) / 100

export function PricingCards({ currentTier, isLifetime, showLifetimeDeal = true, isTrial = false }: PricingCardsProps) {
  const [lifetimeRemaining, setLifetimeRemaining] = useState<number | null>(null)
  const [loading, setLoading] = useState<string | null>(null)

  useEffect(() => {
    if (showLifetimeDeal) {
      fetch("/api/stripe/lifetime-remaining")
        .then(res => res.json())
        .then(data => {
          if (data.enabled) {
            setLifetimeRemaining(data.remaining)
          }
        })
    }
  }, [showLifetimeDeal])

  const handleCheckout = async (plan: "lite" | "pro" | "lifetime") => {
    setLoading(plan)
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      })
      const { url, error } = await res.json()
      if (error) throw new Error(error)
      window.location.href = url
    } catch (err) {
      console.error("Checkout error:", err)
    } finally {
      setLoading(null)
    }
  }

  const isCurrentPlan = (plan: string) => {
    if (isLifetime && plan === "lifetime") return true
    return currentTier === plan
  }

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Lifetime Deal - Show first if available */}
      {showLifetimeDeal && lifetimeRemaining !== null && lifetimeRemaining > 0 && (
        <div className="md:col-span-2 mb-4">
          <div className="relative rounded-xl border-2 border-amber-500 bg-amber-500/10 p-6">
            <div className="absolute -top-3 left-4 px-2 py-1 bg-amber-500 text-black text-xs font-bold rounded">
              LAUNCH SPECIAL
            </div>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Zap className="h-5 w-5 text-amber-500" />
                  Lifetime Pro Access
                </h3>
                <p className="text-amber-700 dark:text-amber-200 mt-1">
                  Pay once, use forever. All Pro features included.
                </p>
                <p className="text-amber-600 dark:text-amber-400 text-sm mt-2 font-medium">
                  Only {lifetimeRemaining} of 100 remaining!
                </p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">£49.99</div>
                <div className="text-amber-700 dark:text-amber-200 text-sm">one-time payment</div>
                <Button
                  onClick={() => handleCheckout("lifetime")}
                  disabled={loading === "lifetime" || isLifetime}
                  className="mt-3 bg-amber-500 hover:bg-amber-400 text-black"
                >
                  {loading === "lifetime" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isLifetime ? "You have lifetime access" : loading === "lifetime" ? "Loading..." : "Get Lifetime Access"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lite Plan */}
      <div className={`rounded-xl border p-6 ${
        isCurrentPlan("lite") ? "border-[#00e3ec] bg-[#00e3ec]/5" : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
      }`}>
        <h3 className="text-lg font-semibold">Lite</h3>
        <div className="mt-2">
          {isTrial ? (
            <>
              <span className="text-3xl font-bold text-[#00e3ec]">£{LITE_DISCOUNTED}</span>
              <span className="text-muted-foreground line-through ml-2">£{LITE_PRICE}</span>
              <span className="text-muted-foreground">/year</span>
            </>
          ) : (
            <>
              <span className="text-3xl font-bold">£{LITE_PRICE}</span>
              <span className="text-muted-foreground">/year</span>
            </>
          )}
        </div>
        {isTrial && (
          <div className="mt-1">
            <span className="text-xs font-medium text-[#00e3ec] bg-[#00e3ec]/10 px-2 py-0.5 rounded">
              10% off during trial
            </span>
          </div>
        )}
        <p className="text-muted-foreground text-sm mt-2">Perfect for simple freelancers</p>

        <ul className="mt-6 space-y-3">
          {PLANS.lite.features.map((feature) => (
            <li key={feature} className="flex items-start text-sm">
              <Check className="h-4 w-4 text-[#00e3ec] mr-2 mt-0.5 flex-shrink-0" />
              {feature}
            </li>
          ))}
          {PLANS.lite.notIncluded?.map((feature) => (
            <li key={feature} className="flex items-start text-sm text-muted-foreground">
              <X className="h-4 w-4 text-muted-foreground mr-2 mt-0.5 flex-shrink-0" />
              {feature}
            </li>
          ))}
        </ul>

        <div className="mt-6">
          <Button
            variant={isCurrentPlan("lite") ? "outline" : "default"}
            className="w-full"
            onClick={() => handleCheckout("lite")}
            disabled={loading === "lite" || isCurrentPlan("lite") || isLifetime}
          >
            {loading === "lite" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isCurrentPlan("lite") ? "Current Plan" : isLifetime ? "You have lifetime" : loading === "lite" ? "Loading..." : "Subscribe to Lite"}
          </Button>
        </div>
      </div>

      {/* Pro Plan */}
      <div className={`rounded-xl border p-6 relative ${
        isCurrentPlan("pro") && !isLifetime ? "border-[#00e3ec] bg-[#00e3ec]/5" : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
      }`}>
        <div className="absolute -top-3 right-4 px-2 py-1 bg-[#00e3ec] text-black text-xs font-bold rounded">
          MOST POPULAR
        </div>
        <h3 className="text-lg font-semibold">Pro</h3>
        <div className="mt-2">
          {isTrial ? (
            <>
              <span className="text-3xl font-bold text-[#00e3ec]">£{PRO_DISCOUNTED}</span>
              <span className="text-muted-foreground line-through ml-2">£{PRO_PRICE}</span>
              <span className="text-muted-foreground">/year</span>
            </>
          ) : (
            <>
              <span className="text-3xl font-bold">£{PRO_PRICE}</span>
              <span className="text-muted-foreground">/year</span>
            </>
          )}
        </div>
        {isTrial && (
          <div className="mt-1">
            <span className="text-xs font-medium text-[#00e3ec] bg-[#00e3ec]/10 px-2 py-0.5 rounded">
              10% off during trial
            </span>
          </div>
        )}
        <p className="text-muted-foreground text-sm mt-2">For landlords & serious freelancers</p>

        <ul className="mt-6 space-y-3">
          {PLANS.pro.features.map((feature) => (
            <li key={feature} className="flex items-start text-sm">
              <Check className="h-4 w-4 text-[#00e3ec] mr-2 mt-0.5 flex-shrink-0" />
              {feature}
            </li>
          ))}
        </ul>

        <div className="mt-6">
          <Button
            className="w-full bg-[#00e3ec] hover:bg-[#00c4d4] text-black"
            onClick={() => handleCheckout("pro")}
            disabled={loading === "pro" || (isCurrentPlan("pro") && !isLifetime) || isLifetime}
          >
            {loading === "pro" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isCurrentPlan("pro") && !isLifetime ? "Current Plan" : isLifetime ? "You have lifetime" : loading === "pro" ? "Loading..." : "Subscribe to Pro"}
          </Button>
        </div>
      </div>

      {/* Lifetime Info (if already purchased) */}
      {isLifetime && (
        <div className="md:col-span-2 rounded-xl border border-[#00e3ec] bg-[#00e3ec]/5 p-6">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-[#00e3ec]" />
            <h3 className="text-lg font-semibold">Lifetime Pro</h3>
          </div>
          <div className="mt-4 text-[#00e3ec] font-medium">
            You have lifetime access!
          </div>
          <p className="text-muted-foreground text-sm mt-2">
            All Pro features, forever. No recurring payments.
          </p>
        </div>
      )}
    </div>
  )
}
