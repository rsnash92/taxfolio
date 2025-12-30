import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getSubscription, checkLimit } from "@/lib/subscription"
import { PricingCards } from "@/components/billing/pricing-cards"
import { ManageSubscriptionButton } from "@/components/billing/manage-subscription-button"
import { UsageMeter } from "@/components/billing/usage-meter"
import { Zap, Calendar, CreditCard, CheckCircle, XCircle } from "lucide-react"

interface BillingPageProps {
  searchParams: Promise<{ success?: string; canceled?: string; plan?: string }>
}

export default async function BillingPage({ searchParams }: BillingPageProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const params = await searchParams
  const subscription = await getSubscription(user.id)
  const bankUsage = await checkLimit(user.id, "bankConnections")
  const transactionUsage = await checkLimit(user.id, "transactionsPerMonth")

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold text-white">Billing & Subscription</h1>

      {/* Success Message */}
      {params.success && (
        <div className="p-4 bg-[#15e49e]/10 border border-[#15e49e]/20 rounded-lg text-[#15e49e] flex items-center gap-2">
          <CheckCircle className="h-5 w-5" />
          {params.plan === "lifetime"
            ? "Welcome to TaxFolio! You now have lifetime Pro access."
            : "Your subscription is now active. Welcome to TaxFolio!"
          }
        </div>
      )}

      {params.canceled && (
        <div className="p-4 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-300 flex items-center gap-2">
          <XCircle className="h-5 w-5" />
          Checkout was canceled. No charges were made.
        </div>
      )}

      {/* Current Plan */}
      <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-xl">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Current Plan
        </h2>

        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-xl font-bold text-white">
                {subscription.isLifetime ? "Lifetime Pro" :
                  subscription.isTrial ? "Free Trial" :
                    subscription.tier === "pro" ? "Pro" :
                      subscription.tier === "lite" ? "Lite" : "Free"}
              </p>
              {subscription.isLifetime && (
                <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs font-medium rounded">
                  LIFETIME
                </span>
              )}
            </div>

            {subscription.isTrial && subscription.daysLeftInTrial !== null && (
              <p className="text-sm text-amber-400 mt-1 flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {subscription.daysLeftInTrial} days left in trial
              </p>
            )}

            {!subscription.isLifetime && subscription.currentPeriodEnd && (
              <p className="text-sm text-zinc-400 mt-1">
                {subscription.cancelAtPeriodEnd
                  ? `Cancels on ${subscription.currentPeriodEnd.toLocaleDateString("en-GB")}`
                  : `Renews on ${subscription.currentPeriodEnd.toLocaleDateString("en-GB")}`
                }
              </p>
            )}
          </div>

          {!subscription.isLifetime && subscription.tier !== "free" && !subscription.isTrial && (
            <ManageSubscriptionButton />
          )}
        </div>
      </div>

      {/* Usage */}
      {!subscription.isLifetime && subscription.tier !== "pro" && (
        <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-xl">
          <h2 className="text-lg font-semibold text-white mb-4">Usage</h2>
          <div className="space-y-4">
            <UsageMeter
              label="Bank Connections"
              current={bankUsage.current}
              limit={bankUsage.limit}
            />
            <UsageMeter
              label="Transactions This Month"
              current={transactionUsage.current}
              limit={transactionUsage.limit}
            />
          </div>
        </div>
      )}

      {/* Pricing Cards */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Zap className="h-5 w-5" />
          {subscription.isLifetime ? "Your Plan" : subscription.isTrial ? "Choose a Plan" : "Upgrade"}
        </h2>
        <PricingCards
          currentTier={subscription.tier}
          isLifetime={subscription.isLifetime}
          showLifetimeDeal={!subscription.isLifetime}
          isTrial={subscription.isTrial}
        />
      </div>
    </div>
  )
}
