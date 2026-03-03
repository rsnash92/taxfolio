"use client"

import { usePathname } from "next/navigation"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"

const pageTitles: Record<string, string> = {
  "/practice": "Pipeline",
  "/practice/clients": "Clients",
  "/practice/clients/new": "Add Client",
  "/practice/settings": "Settings",
  "/practice/settings/team": "Team",
  "/practice/settings/billing": "Billing",
}

export function PracticePageHeader() {
  const pathname = usePathname()

  // Match dynamic routes like /practice/clients/[id]
  let title = pageTitles[pathname]
  if (!title) {
    if (pathname.startsWith("/practice/clients/") && pathname !== "/practice/clients/new") {
      title = "Client"
    } else {
      title = "Practice"
    }
  }

  return (
    <header className="flex items-center justify-between mb-6">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>

      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" className="bg-card border-border">
          <Bell className="h-4 w-4" />
          <span className="sr-only">Notifications</span>
        </Button>
      </div>
    </header>
  )
}
