import { Suspense } from "react"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { MobileNav } from "@/components/mobile-nav"
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt"
import { PageHeader } from "@/components/page-header"
import { getSubscription } from "@/lib/subscription"

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

  // Check if user has completed onboarding and get user type
  const { data: userData } = await supabase
    .from("users")
    .select("onboarding_completed, user_type, show_properties")
    .eq("id", user.id)
    .single()

  // If onboarding not completed, redirect to onboarding
  if (!userData?.onboarding_completed) {
    redirect("/onboarding/welcome")
  }

  // Get subscription info for trial banner
  const subscription = await getSubscription(user.id)

  // Determine if properties tab should show
  // Show if: user is landlord, user is both, or user has explicitly enabled it
  const userType = userData?.user_type || 'sole_trader'
  const showProperties = userData?.show_properties ?? (userType === 'landlord' || userType === 'both')

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        {/* Desktop Sidebar - hidden on mobile */}
        <div className="hidden lg:fixed lg:flex lg:w-72 lg:top-0 lg:bottom-0">
          <Sidebar user={user} isTrial={subscription.isTrial} showProperties={showProperties} />
        </div>

        {/* Mobile Header */}
        <div className="fixed inset-x-0 top-0 z-40 lg:hidden">
          <header className="flex h-14 items-center border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4">
            <MobileNav user={user} isTrial={subscription.isTrial} showProperties={showProperties} />
          </header>
        </div>

        {/* Main Content */}
        <main className="flex-1 lg:pl-72">
          {/* Spacer for mobile header */}
          <div className="h-14 lg:hidden" />

          <div className="min-h-screen lg:p-4">
            <div className="bg-muted/40 lg:rounded-2xl lg:min-h-[calc(100vh-2rem)]">
              <div className="container mx-auto py-6 px-4 md:px-6">
                <Suspense fallback={null}>
                  <PageHeader />
                </Suspense>
                {children}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* PWA Install Prompt */}
      <PWAInstallPrompt />
    </div>
  )
}
