import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ExternalLink, FileText, Calendar, Users, CreditCard } from "lucide-react"
import Link from "next/link"
import { HMRCWidgetWrapper } from "@/components/hmrc"
import { getSubscription } from "@/lib/subscription"

function getCurrentTaxYear(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const day = now.getDate()

  if (month > 4 || (month === 4 && day >= 6)) {
    return `${year}-${(year + 1).toString().slice(-2)}`
  } else {
    return `${year - 1}-${year.toString().slice(-2)}`
  }
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const taxYear = getCurrentTaxYear()

  // Get user name and subscription
  const { data: userData } = await supabase
    .from("users")
    .select("full_name")
    .eq("id", user?.id)
    .single()

  const subscription = user ? await getSubscription(user.id) : null
  const firstName = userData?.full_name?.split(" ")[0] || "there"

  const assessmentUrl = process.env.NEXT_PUBLIC_ASSESSMENT_URL || "https://assessment.taxfolio.io"

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Welcome back, {firstName}</h1>
        <p className="text-muted-foreground mt-1">
          Tax year {taxYear} • Manage your self-assessment and Making Tax Digital
        </p>
      </div>

      {/* Primary CTA - Go to Assessment */}
      <Card className="border-[#00e3ec]/50 bg-[#00e3ec]/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-[#00e3ec]" />
            Self Assessment Tax Return
          </CardTitle>
          <CardDescription>
            Prepare and submit your self-assessment tax return with our guided wizard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <a href={assessmentUrl} target="_blank" rel="noopener noreferrer">
            <Button className="bg-[#00e3ec] hover:bg-[#00c4d4] text-black">
              Go to Tax Return Wizard
              <ExternalLink className="ml-2 h-4 w-4" />
            </Button>
          </a>
        </CardContent>
      </Card>

      {/* Quick Links Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Link href="/personal-tax">
          <Card className="hover:border-[#00e3ec]/50 transition-colors cursor-pointer h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Personal Tax</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">View your tax summary and history</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/mtd">
          <Card className="hover:border-[#00e3ec]/50 transition-colors cursor-pointer h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Making Tax Digital</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">Quarterly submissions to HMRC</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/partners">
          <Card className="hover:border-[#00e3ec]/50 transition-colors cursor-pointer h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Referrals</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">Earn rewards by inviting others</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/settings/billing">
          <Card className="hover:border-[#00e3ec]/50 transition-colors cursor-pointer h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Billing</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                {subscription?.isTrial
                  ? `Trial ends ${subscription.trialEndsAt ? new Date(subscription.trialEndsAt).toLocaleDateString() : 'soon'}`
                  : 'Manage your subscription'}
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* MTD Status */}
      <div className="grid gap-6 lg:grid-cols-2">
        <HMRCWidgetWrapper taxYear={taxYear} />

        {/* Subscription Status */}
        <Card>
          <CardHeader>
            <CardTitle>Your Plan</CardTitle>
            <CardDescription>Current subscription status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium capitalize">
                    {subscription?.isTrial ? 'Free Trial' : subscription?.tier?.replace('_', ' ') || 'Free'}
                  </p>
                  {subscription?.isTrial && subscription.trialEndsAt && (
                    <p className="text-sm text-muted-foreground">
                      Trial ends {new Date(subscription.trialEndsAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <Link href="/settings/billing">
                  <Button variant="outline" size="sm">
                    Manage
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
