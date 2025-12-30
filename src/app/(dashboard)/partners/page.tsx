import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ReferralStats } from "@/components/partners/referral-stats"
import { ReferralLink } from "@/components/partners/referral-link"
import { RecentReferrals } from "@/components/partners/recent-referrals"
import { RecentCommissions } from "@/components/partners/recent-commissions"
import { Button } from "@/components/ui/button"
import { Building2, Users, Clock, ExternalLink } from "lucide-react"
import Link from "next/link"

export default async function PartnerDashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  // Get partner profile
  const { data: partner } = await supabase
    .from("partners")
    .select("*")
    .eq("user_id", user.id)
    .single()

  // No partner - show apply prompt
  if (!partner) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center">
        <div className="p-3 bg-primary/10 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
          <Users className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Become a Partner</h1>
        <p className="text-muted-foreground mb-6">
          Earn commissions by referring users to TaxFolio. Choose from our
          Accountant Partner (60% revenue share) or Affiliate Partner (25%
          first-year commission) programs.
        </p>
        <Link href="/partners/apply">
          <Button>
            <ExternalLink className="h-4 w-4 mr-2" />
            Apply Now
          </Button>
        </Link>
      </div>
    )
  }

  // Pending application
  if (partner.status === "pending") {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center">
        <div className="p-3 bg-amber-500/20 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
          <Clock className="h-8 w-8 text-amber-500" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Application Under Review</h1>
        <p className="text-muted-foreground">
          We&apos;re reviewing your partner application. You&apos;ll hear from
          us within 2-3 business days.
        </p>
      </div>
    )
  }

  // Rejected application
  if (partner.status === "rejected") {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center">
        <h1 className="text-2xl font-bold mb-2">Application Not Approved</h1>
        <p className="text-muted-foreground mb-4">
          Unfortunately, your application wasn&apos;t approved.
        </p>
        {partner.rejection_reason && (
          <p className="text-muted-foreground">
            Reason: {partner.rejection_reason}
          </p>
        )}
      </div>
    )
  }

  // Suspended
  if (partner.status === "suspended") {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center">
        <h1 className="text-2xl font-bold mb-2">Account Suspended</h1>
        <p className="text-muted-foreground">
          Your partner account has been suspended. Please contact support for
          more information.
        </p>
      </div>
    )
  }

  // Approved partner - show dashboard
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div
            className={`p-3 rounded-lg ${
              partner.type === "accountant" ? "bg-green-500/20" : "bg-blue-500/20"
            }`}
          >
            {partner.type === "accountant" ? (
              <Building2 className="h-6 w-6 text-green-500" />
            ) : (
              <Users className="h-6 w-6 text-blue-500" />
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{partner.company_name}</h1>
            <p className="text-muted-foreground capitalize">
              {partner.type} Partner
            </p>
          </div>
        </div>

        <div className="text-right">
          <p className="text-sm text-muted-foreground">Commission Rate</p>
          <p className="text-2xl font-bold text-green-500">
            {partner.commission_rate}%
          </p>
        </div>
      </div>

      {/* Referral Link */}
      <ReferralLink code={partner.referral_code} />

      {/* Stats */}
      <ReferralStats
        totalReferrals={partner.total_referrals}
        totalConversions={partner.total_conversions}
        totalEarnings={partner.total_earnings}
        pendingEarnings={partner.pending_earnings}
      />

      {/* Recent Activity */}
      <div className="grid md:grid-cols-2 gap-6">
        <RecentReferrals partnerId={partner.id} />
        <RecentCommissions partnerId={partner.id} />
      </div>

      {/* Settings Link */}
      <div className="flex justify-end">
        <Link href="/partners/settings">
          <Button variant="outline">Partner Settings</Button>
        </Link>
      </div>
    </div>
  )
}
