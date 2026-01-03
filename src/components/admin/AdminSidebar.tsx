'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Activity,
  Settings,
  ArrowLeft,
  Zap,
  Gift
} from 'lucide-react'

const navItems = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/revenue', label: 'Revenue', icon: CreditCard },
  { href: '/admin/referrals', label: 'Referrals', icon: Gift },
  { href: '/admin/activity', label: 'Activity', icon: Activity },
  { href: '/admin/system', label: 'System', icon: Settings },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 bg-zinc-900 border-r border-zinc-800 p-4 flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 px-2 mb-8">
        <div className="p-1.5 bg-red-500/20 rounded-lg">
          <Zap className="h-5 w-5 text-red-500" />
        </div>
        <div>
          <h1 className="font-bold text-white">TaxFolio</h1>
          <p className="text-xs text-red-400">Admin Panel</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="space-y-1 flex-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== '/admin' && pathname.startsWith(item.href))

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-zinc-800 text-white'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Back to App */}
      <div className="pt-4 border-t border-zinc-800">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to App
        </Link>
      </div>
    </aside>
  )
}
