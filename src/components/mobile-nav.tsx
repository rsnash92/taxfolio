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
  Calendar,
  LucideIcon,
  Settings,
  Sparkles,
  Users,
  CreditCard,
  FileText,
} from "lucide-react"

const navItems: { title: string; href: string; icon: LucideIcon }[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Personal Tax",
    href: "/personal-tax",
    icon: FileText,
  },
  {
    title: "Making Tax Digital",
    href: "/mtd",
    icon: Calendar,
  },
  {
    title: "Referrals",
    href: "/partners",
    icon: Users,
  },
  {
    title: "Billing",
    href: "/settings/billing",
    icon: CreditCard,
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
  },
]

interface MobileNavProps {
  user: User
  isTrial?: boolean
}

export function MobileNav({ user, isTrial }: MobileNavProps) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

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
          {navItems.map((item) => {
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
                    ? "border-l-2 border-[#15e49e] bg-[#15e49e]/10 text-foreground"
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
                Upgrade early for 10% off
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
