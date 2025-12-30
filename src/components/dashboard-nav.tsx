"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LayoutDashboard, ArrowRightLeft, Building2, Download, CalendarDays, Car, Home, Laptop } from "lucide-react"

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

export function DashboardNav() {
  const pathname = usePathname()

  return (
    <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
      {navItems.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center space-x-2 transition-colors hover:text-foreground/80",
              isActive ? "text-foreground" : "text-foreground/60"
            )}
          >
            <item.icon className="h-4 w-4" />
            <span>{item.title}</span>
          </Link>
        )
      })}
    </nav>
  )
}
