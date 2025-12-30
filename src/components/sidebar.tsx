"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { User } from "@supabase/supabase-js"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { useTheme } from "next-themes"
import {
  LayoutDashboard,
  ArrowRightLeft,
  Building2,
  Download,
  CalendarDays,
  Car,
  Home,
  Laptop,
  Settings,
  LogOut,
  Moon,
  Sun,
} from "lucide-react"

const navItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Transactions",
    href: "/transactions",
    icon: ArrowRightLeft,
  },
  {
    title: "Properties",
    href: "/properties",
    icon: Home,
  },
  {
    title: "Mileage",
    href: "/mileage",
    icon: Car,
  },
  {
    title: "Home Office",
    href: "/home-office",
    icon: Laptop,
  },
  {
    title: "Accounts",
    href: "/accounts",
    icon: Building2,
  },
  {
    title: "MTD Quarters",
    href: "/mtd",
    icon: CalendarDays,
  },
  {
    title: "Export",
    href: "/export",
    icon: Download,
  },
]

interface SidebarProps {
  user: User
  className?: string
}

export function Sidebar({ user, className }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const { theme, setTheme } = useTheme()

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
    <aside
      className={cn(
        "flex h-screen w-64 flex-col bg-background",
        className
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center px-6">
        <Link href="/dashboard">
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
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "border-l-2 border-[#15e49e] bg-[#15e49e]/10 text-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.title}
            </Link>
          )
        })}

        {/* Settings - separate section */}
        <div className="pt-4">
          <Link
            href="/settings"
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              pathname.startsWith("/settings")
                ? "border-l-2 border-[#15e49e] bg-[#15e49e]/10 text-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Settings className="h-4 w-4" />
            Settings
          </Link>
        </div>
      </nav>

      {/* User Section */}
      <div className="p-4">
        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="sm"
          className="mb-3 w-full justify-start gap-3 text-muted-foreground hover:text-foreground"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          {theme === "dark" ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
          {theme === "dark" ? "Light mode" : "Dark mode"}
        </Button>

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
        <Button
          variant="ghost"
          size="sm"
          className="mt-2 w-full justify-start gap-3 text-muted-foreground hover:text-foreground"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
      </div>
    </aside>
  )
}

// Export nav items for use in mobile nav
export { navItems }
