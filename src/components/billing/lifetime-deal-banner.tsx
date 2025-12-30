"use client"

import { useState, useEffect } from "react"
import { Zap } from "lucide-react"
import Link from "next/link"

export function LifetimeDealBanner() {
  const [remaining, setRemaining] = useState<number | null>(null)

  useEffect(() => {
    fetch("/api/stripe/lifetime-remaining")
      .then(res => res.json())
      .then(data => {
        if (data.enabled && data.remaining > 0) {
          setRemaining(data.remaining)
        }
      })
  }, [])

  if (remaining === null) return null

  return (
    <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-b border-amber-500/30">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-center gap-4 text-sm">
        <Zap className="h-4 w-4 text-amber-500" />
        <span className="text-amber-200">
          <strong className="text-amber-100">Launch Special:</strong> Get lifetime Pro access for £49.99
        </span>
        <span className="text-amber-400 font-medium">
          Only {remaining} left!
        </span>
        <Link
          href="/signup"
          className="bg-amber-500 hover:bg-amber-400 text-black px-3 py-1 rounded font-medium text-xs"
        >
          Claim Now
        </Link>
      </div>
    </div>
  )
}
