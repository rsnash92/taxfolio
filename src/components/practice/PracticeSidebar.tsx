"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
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
  Users,
  Settings,
  CreditCard,
  UserPlus,
  ArrowLeft,
  LucideIcon,
} from "lucide-react"

interface PracticeSidebarProps {
  user: { id: string; email?: string; user_metadata?: { full_name?: string } }
  practiceName: string
  role: string
  className?: string
}

const navItems: { title: string; href: string; icon: LucideIcon; roles?: string[] }[] = [
  {
    title: "Pipeline",
    href: "/practice",
    icon: LayoutDashboard,
  },
  {
    title: "Clients",
    href: "/practice/clients",
    icon: Users,
  },
  {
    title: "Team",
    href: "/practice/settings/team",
    icon: UserPlus,
    roles: ["owner", "manager"],
  },
  {
    title: "Settings",
    href: "/practice/settings",
    icon: Settings,
    roles: ["owner"],
  },
  {
    title: "Billing",
    href: "/practice/settings/billing",
    icon: CreditCard,
    roles: ["owner"],
  },
]

export function PracticeSidebar({ user, practiceName, role, className }: PracticeSidebarProps) {
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

  const visibleItems = navItems.filter(
    item => !item.roles || item.roles.includes(role)
  )

  return (
    <aside
      className={cn(
        "flex h-screen w-72 flex-col bg-gradient-to-b from-[#0f172a] to-[#1e293b]",
        className
      )}
    >
      {/* Logo + Practice Name */}
      <div className="px-6 pt-8 pb-2">
        <Link href="/practice" className="block px-5">
          <Image
            src="/taxfolio-light.png"
            alt="Taxfolio"
            width={120}
            height={28}
            className="h-7 w-auto"
          />
        </Link>
      </div>
      <div className="px-6 pb-6">
        <p className="px-5 text-sm text-gray-400 truncate">{practiceName}</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2 px-6">
        {visibleItems.map((item) => {
          const isActive = item.href === "/practice"
            ? pathname === "/practice"
            : pathname.startsWith(item.href)
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

      {/* Bottom Section */}
      <div className="p-4 space-y-3">
        {/* Switch to individual view */}
        <Link href="/dashboard">
          <Button
            variant="ghost"
            className="w-full justify-start text-gray-400 hover:text-white hover:bg-white/5"
            size="sm"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Individual view
          </Button>
        </Link>

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
              <Link href="/practice/settings" className="cursor-pointer">
                <Settings className="h-4 w-4 mr-2" />
                Practice Settings
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
