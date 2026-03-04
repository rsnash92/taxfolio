"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { createClient } from "@/lib/supabase/client"
import { useBranding } from "@/lib/branding-context"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Menu,
  LogOut,
  LayoutDashboard,
  Users,
  Settings,
  CreditCard,
  UserPlus,
  ArrowLeft,
  LucideIcon,
} from "lucide-react"

const navItems: { title: string; href: string; icon: LucideIcon; roles?: string[] }[] = [
  { title: "Pipeline", href: "/practice", icon: LayoutDashboard },
  { title: "Clients", href: "/practice/clients", icon: Users },
  { title: "Team", href: "/practice/settings/team", icon: UserPlus, roles: ["owner", "manager"] },
  { title: "Settings", href: "/practice/settings", icon: Settings, roles: ["owner"] },
  { title: "Billing", href: "/practice/settings/billing", icon: CreditCard, roles: ["owner"] },
]

interface PracticeMobileNavProps {
  user: { id: string; email?: string; user_metadata?: { full_name?: string } }
  practiceName: string
  role: string
}

export function PracticeMobileNav({ user, practiceName, role }: PracticeMobileNavProps) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const { branding } = useBranding()

  const logoSrc = branding.logo_url || "/taxfolio.png"
  const isCustomLogo = !!branding.logo_url

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  const initials = user.user_metadata?.full_name
    ?.split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase() || user.email?.[0].toUpperCase() || "U"

  const userName = user.user_metadata?.full_name || "User"
  const userEmail = user.email || ""

  const visibleItems = navItems.filter(
    item => !item.roles || item.roles.includes(role)
  )

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0 flex flex-col">
        {/* Logo + Practice Name */}
        <div className="px-6 pt-8 pb-2">
          <Link href="/practice" onClick={() => setOpen(false)} className="px-5">
            {isCustomLogo ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={logoSrc}
                alt={practiceName}
                className="h-7 w-auto max-w-[160px] object-contain"
              />
            ) : (
              <Image
                src="/taxfolio.png"
                alt="TaxFolio"
                width={120}
                height={28}
                className="h-7 w-auto"
              />
            )}
          </Link>
        </div>
        <div className="px-6 pb-6">
          <p className="px-5 text-sm text-muted-foreground truncate">{practiceName}</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-2 px-6 overflow-y-auto">
          {visibleItems.map((item) => {
            const isActive = item.href === "/practice"
              ? pathname === "/practice"
              : pathname.startsWith(item.href)
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-5 py-3 text-base font-medium transition-colors",
                  isActive
                    ? "border-l-2 text-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
                style={isActive ? {
                  borderColor: "var(--brand)",
                  backgroundColor: "color-mix(in srgb, var(--brand) 10%, transparent)",
                } : undefined}
              >
                <Icon className="h-5 w-5" />
                {item.title}
              </Link>
            )
          })}
        </nav>

        {/* Bottom Section */}
        <div className="p-4 space-y-3">
          {/* Switch to individual view */}
          <Link href="/dashboard" onClick={() => setOpen(false)}>
            <Button
              variant="ghost"
              className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-muted"
              size="sm"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Individual view
            </Button>
          </Link>

          {/* User Info */}
          <div className="flex items-center gap-3 rounded-lg px-2 py-2">
            <Avatar className="h-9 w-9">
              <AvatarFallback
                style={{
                  backgroundColor: "color-mix(in srgb, var(--brand) 20%, transparent)",
                  color: "var(--brand)",
                }}
              >
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-sm font-medium">{userName}</p>
              <p className="truncate text-xs text-muted-foreground">{userEmail}</p>
            </div>
          </div>

          {/* Sign Out */}
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-sm text-destructive hover:bg-muted transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
