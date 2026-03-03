import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { getPracticeContext } from "@/lib/practice"
import { PracticeSidebar } from "@/components/practice/PracticeSidebar"
import { PracticeMobileNav } from "@/components/practice/PracticeMobileNav"
import { PracticePageHeader } from "@/components/practice/PracticePageHeader"
import { InactivityModal } from "@/components/InactivityModal"

export default async function PracticeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const context = await getPracticeContext(supabase, user.id)

  // No practice context — render children without sidebar (for setup page)
  if (!context) {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        {/* Desktop Sidebar - hidden on mobile */}
        <div className="hidden lg:fixed lg:flex lg:w-72 lg:top-0 lg:bottom-0">
          <PracticeSidebar
            user={user}
            practiceName={context.practice.name}
            role={context.membership.role}
          />
        </div>

        {/* Mobile Header */}
        <div className="fixed inset-x-0 top-0 z-40 lg:hidden">
          <header className="flex h-14 items-center border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4">
            <PracticeMobileNav
              user={user}
              practiceName={context.practice.name}
              role={context.membership.role}
            />
          </header>
        </div>

        {/* Main Content */}
        <main className="flex-1 lg:pl-72">
          {/* Spacer for mobile header */}
          <div className="h-14 lg:hidden" />

          <div className="min-h-screen">
            <div className="bg-content-area min-h-screen">
              <div className="container mx-auto py-6 px-6 md:px-10 lg:px-16">
                <PracticePageHeader />
                {children}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Inactivity Timeout Modal */}
      <InactivityModal />
    </div>
  )
}
