import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DashboardNav } from "@/components/dashboard-nav"
import { UserNav } from "@/components/user-nav"
import { ThemeToggle } from "@/components/theme-toggle"
import { TrialBanner } from "@/components/billing/trial-banner"
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt"
import { getSubscription } from "@/lib/subscription"
import Link from "next/link"
import Image from "next/image"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Check if user has completed onboarding
  const { data: userData } = await supabase
    .from("users")
    .select("onboarding_completed")
    .eq("id", user.id)
    .single()

  // If onboarding not completed, redirect to onboarding
  if (!userData?.onboarding_completed) {
    redirect("/onboarding/welcome")
  }

  // Get subscription info for trial banner
  const subscription = await getSubscription(user.id)

  return (
    <div className="min-h-screen bg-background">
      {/* Trial Banner */}
      {subscription.isTrial && subscription.daysLeftInTrial !== null && (
        <TrialBanner daysLeft={subscription.daysLeftInTrial} />
      )}

      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-14 items-center">
          <Link href="/dashboard" className="mr-6">
            <Image
              src="/logo.webp"
              alt="TaxFolio"
              width={120}
              height={28}
              className="h-7 w-auto"
            />
          </Link>
          <DashboardNav />
          <div className="ml-auto flex items-center space-x-2">
            <ThemeToggle />
            <UserNav user={user} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto py-6">
        {children}
      </main>

      {/* PWA Install Prompt */}
      <PWAInstallPrompt />
    </div>
  )
}
