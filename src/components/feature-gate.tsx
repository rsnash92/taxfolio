"use client"

import { Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface FeatureGateProps {
  feature: string
  title: string
  description: string
  children: React.ReactNode
  hasAccess: boolean
}

export function FeatureGate({
  feature,
  title,
  description,
  children,
  hasAccess,
}: FeatureGateProps) {
  if (hasAccess) {
    return <>{children}</>
  }

  return (
    <div className="relative">
      {/* Faded content behind */}
      <div className="opacity-20 pointer-events-none blur-[2px] select-none">
        {children}
      </div>

      {/* Overlay with upgrade prompt */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="bg-background/95 backdrop-blur-sm border rounded-xl p-8 max-w-md text-center shadow-lg">
          <div className="w-12 h-12 rounded-full bg-[#15e49e]/10 flex items-center justify-center mx-auto mb-4">
            <Lock className="h-6 w-6 text-[#15e49e]" />
          </div>
          <h3 className="text-xl font-semibold mb-2">{title}</h3>
          <p className="text-muted-foreground mb-6">{description}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild className="bg-[#15e49e] hover:bg-[#12c98a] text-black">
              <Link href="/settings/billing">Upgrade to Pro</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/settings/billing">View Plans</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Smaller inline version for cards/sections
export function FeatureGateBadge({ feature }: { feature: string }) {
  return (
    <Link
      href="/settings/billing"
      className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-[#15e49e]/10 text-[#15e49e] text-xs font-medium hover:bg-[#15e49e]/20 transition-colors"
    >
      <Lock className="h-3 w-3" />
      Pro
    </Link>
  )
}
