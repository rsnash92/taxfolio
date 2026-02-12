"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { User } from "@supabase/supabase-js"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  LogOut,
  LayoutDashboard,
  ArrowLeftRight,
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
    // TODO: Future /transactions page with full filtering, search, pagination
    title: "Transactions",
    href: "/dashboard#transactions",
    icon: ArrowLeftRight,
  },
  {
    title: "Referrals",
    href: "/referrals",
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

interface SidebarProps {
  user: User
  className?: string
  isTrial?: boolean
}

export function Sidebar({ user, className, isTrial }: SidebarProps) {
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
    <aside
      className={cn(
        "flex h-screen w-72 flex-col bg-gradient-to-b from-[#0f172a] to-[#1e293b]",
        className
      )}
    >
      {/* Logo */}
      <div className="px-6 pt-8 pb-6">
        <Link href="/dashboard" className="block px-5">
          <Image
            src="/taxfolio-light.png"
            alt="Taxfolio"
            width={120}
            height={28}
            className="h-7 w-auto"
          />
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2 px-6">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-5 py-3 text-base font-medium transition-colors",
                isActive
                  ? "border-l-2 border-[#00e3ec] bg-white/10 text-white"
                  : "text-gray-400 hover:bg-white/5 hover:text-white"
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
          <Link href="/settings/billing">
            <Button
              className="w-full bg-[#00e3ec] hover:bg-[#00c4d4] text-black font-medium"
              size="sm"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Upgrade early for 10% off
            </Button>
          </Link>
        )}

        {/* User Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex w-full items-center gap-3 rounded-lg px-2 py-2 hover:bg-white/5 transition-colors">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-[#00e3ec]/20 text-[#00e3ec]">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 overflow-hidden text-left">
                <p className="truncate text-sm font-medium text-white">{userName}</p>
                <p className="truncate text-xs text-gray-400">{userEmail}</p>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuItem asChild>
              <Link href="/settings" className="cursor-pointer">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive focus:text-destructive">
              <LogOut className="h-4 w-4 mr-2" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  )
}

// Export nav items for use in mobile nav
export { navItems }
