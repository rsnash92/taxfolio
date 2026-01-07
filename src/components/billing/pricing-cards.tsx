"use client"

import { useState } from "react"
import { Check, X, Loader2, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface PricingCardsProps {
  currentTier: string
  isLifetime: boolean
  isTrial?: boolean
}

// Pricing configuration matching assessment wizard
const PLANS = [
  {
    id: 'lite',
    name: 'Lite',
    price: 29,
    description: 'Perfect for simple tax returns',
    priceLabel: 'per return',
    popular: false,
    features: [
      { text: '1 bank connection', included: true },
      { text: '100 transactions/month', included: true },
      { text: 'AI categorisation', included: true },
      { text: 'Full SA103 breakdown', included: true },
      { text: 'Direct HMRC submission', included: true },
      { text: 'SA105 (Landlords)', included: false },
      { text: 'MTD quarterly breakdown', included: false },
      { text: 'Priority support', included: false },
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 99,
    description: 'Most comprehensive option',
    priceLabel: 'per return',
    popular: true,
    features: [
      { text: 'Unlimited bank connections', included: true },
      { text: 'Unlimited transactions', included: true },
      { text: 'AI categorisation', included: true },
      { text: 'Full SA103 & SA105', included: true },
      { text: 'Direct HMRC submission', included: true },
      { text: 'MTD quarterly breakdown', included: true },
      { text: 'Mileage tracker', included: true },
      { text: 'Priority support', included: true },
    ],
  },
  {
    id: 'lifetime',
    name: 'Lifetime',
    price: 249,
    description: 'Best value for ongoing filers',
    priceLabel: 'one-time payment',
    popular: false,
    features: [
      { text: 'Everything in Pro', included: true },
      { text: 'All future updates', included: true },
      { text: 'Lifetime access', included: true },
      { text: 'No recurring fees', included: true, highlight: true },
      { text: 'Best value!', included: true, highlight: true },
    ],
  },
]

export function PricingCards({ currentTier, isLifetime, isTrial = false }: PricingCardsProps) {
  const [loading, setLoading] = useState<string | null>(null)

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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
      {PLANS.map((plan) => {
        const isCurrent = isCurrentPlan(plan.id)
        const isDisabled = isLifetime || isCurrent

        return (
          <div
            key={plan.id}
            className={cn(
              'relative flex flex-col p-4 sm:p-6 rounded-2xl border-2 text-left transition-all bg-white',
              isCurrent
                ? 'border-[#00e3ec] ring-2 ring-[#00e3ec]/20'
                : 'border-gray-200 hover:border-gray-300',
              plan.popular && 'lg:scale-105 lg:shadow-lg lg:z-10'
            )}
          >
            {/* Popular Badge */}
            {plan.popular && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#00e3ec] to-[#00c4d4] text-white text-[10px] sm:text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap">
                MOST POPULAR
              </span>
            )}

            {/* Selection Indicator */}
            {isCurrent && (
              <div className="absolute top-3 right-3 sm:top-4 sm:right-4 w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 border-[#00e3ec] bg-[#00e3ec] flex items-center justify-center">
                <Check className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
              </div>
            )}

            {/* Plan Name */}
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1 pr-8">
              {plan.name}
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4">
              {plan.description}
            </p>

            {/* Price */}
            <div className="mb-3 sm:mb-4">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-bold text-gray-900">
                  £{plan.price}
                </span>
                <span className="text-xs sm:text-sm text-gray-500">
                  {plan.priceLabel}
                </span>
              </div>
            </div>

            {/* Features */}
            <ul className="space-y-1.5 sm:space-y-2 mb-4 sm:mb-6 flex-1">
              {plan.features.map((feature, index) => {
                const isHighlight = 'highlight' in feature && feature.highlight

                return (
                  <li key={index} className="flex items-start gap-2 text-xs sm:text-sm">
                    {isHighlight ? (
                      <Star className="h-4 w-4 sm:h-5 sm:w-5 shrink-0 mt-0.5 text-amber-400 fill-amber-400" />
                    ) : feature.included ? (
                      <Check className="h-4 w-4 sm:h-5 sm:w-5 shrink-0 mt-0.5 text-[#00e3ec]" />
                    ) : (
                      <X className="h-4 w-4 sm:h-5 sm:w-5 shrink-0 mt-0.5 text-gray-300" />
                    )}
                    <span className={cn(
                      feature.included ? 'text-gray-600' : 'text-gray-400'
                    )}>
                      {feature.text}
                    </span>
                  </li>
                )
              })}
            </ul>

            {/* CTA Button */}
            <div className="mt-auto">
              <Button
                onClick={() => handleCheckout(plan.id as "lite" | "pro" | "lifetime")}
                disabled={loading === plan.id || isDisabled}
                className={cn(
                  'w-full',
                  plan.popular
                    ? 'bg-[#00e3ec] hover:bg-[#00c4d4] text-black'
                    : ''
                )}
                variant={plan.popular ? 'default' : 'outline'}
              >
                {loading === plan.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isCurrent
                  ? 'Current Plan'
                  : isLifetime
                    ? 'You have lifetime'
                    : loading === plan.id
                      ? 'Loading...'
                      : `Subscribe to ${plan.name}`}
              </Button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
