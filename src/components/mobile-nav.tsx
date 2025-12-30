"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { createClient } from "@/lib/supabase/client"
import { User } from "@supabase/supabase-js"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Menu,
  LogOut,
  LayoutDashboard,
  Receipt,
  Building2,
  Car,
  Home,
  Landmark,
  Calendar,
  Download,
  LucideIcon,
  Settings,
  Sparkles,
} from "lucide-react"

const navItems: { title: string; href: string; icon: LucideIcon }[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Transactions",
    href: "/transactions",
    icon: Receipt,
  },
  {
    title: "Properties",
    href: "/properties",
    icon: Building2,
  },
  {
    title: "Mileage",
    href: "/mileage",
    icon: Car,
  },
  {
    title: "Home Office",
    href: "/home-office",
    icon: Home,
  },
  {
    title: "Accounts",
    href: "/accounts",
    icon: Landmark,
  },
  {
    title: "MTD Quarters",
    href: "/mtd",
    icon: Calendar,
  },
  {
    title: "Export",
    href: "/export",
    icon: Download,
  },
]

interface MobileNavProps {
  user: User
  isTrial?: boolean
  showProperties?: boolean
}

export function MobileNav({ user, isTrial, showProperties = true }: MobileNavProps) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  // Filter nav items based on user settings
  const filteredNavItems = navItems.filter(item => {
    if (item.href === '/properties' && !showProperties) return false
    return true
  })

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

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0 flex flex-col">
        {/* Logo */}
        <div className="px-6 pt-8 pb-6">
          <Link href="/dashboard" onClick={() => setOpen(false)} className="px-5">
            <Image
              src="/logo.webp"
              alt="TaxFolio"
              width={120}
              height={28}
              className="h-7 w-auto"
            />
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-2 px-6 overflow-y-auto">
          {filteredNavItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-5 py-3 text-base font-medium transition-colors",
                  isActive
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                {item.title}
              </Link>
            )
          })}
        </nav>

        {/* User Section */}
        <div className="p-4 space-y-3">
          {/* Upgrade CTA - only show during trial */}
          {isTrial && (
            <Link href="/settings/billing" onClick={() => setOpen(false)}>
              <Button
                className="w-full bg-[#15e49e] hover:bg-[#12c98a] text-black font-medium"
                size="sm"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Upgrade early for 20% off
              </Button>
            </Link>
          )}

          {/* User Info */}
          <div className="flex items-center gap-3 rounded-lg px-2 py-2">
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-[#15e49e]/20 text-[#15e49e]">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-sm font-medium">{userName}</p>
              <p className="truncate text-xs text-muted-foreground">{userEmail}</p>
            </div>
          </div>

          {/* Settings & Sign Out */}
          <div className="space-y-1">
            <Link
              href="/settings"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-lg px-2 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <Settings className="h-4 w-4" />
              Settings
            </Link>
            <button
              onClick={handleSignOut}
              className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-sm text-destructive hover:bg-muted transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
