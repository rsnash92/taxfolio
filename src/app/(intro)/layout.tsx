"use client"

import { useEffect } from "react"

export default function IntroLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Capture UTM params and referrer on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const utmData = {
      source: params.get('utm_source'),
      medium: params.get('utm_medium'),
      campaign: params.get('utm_campaign'),
    }
    const referrer = document.referrer

    // Store for later use
    if (utmData.source || utmData.medium || utmData.campaign || referrer) {
      const existing = localStorage.getItem('taxfolio_intro_data')
      const data = existing ? JSON.parse(existing) : {}
      localStorage.setItem('taxfolio_intro_data', JSON.stringify({
        ...data,
        utm: utmData,
        referrer,
      }))
    }
  }, [])

  return (
    <div className="min-h-screen bg-[#f8f9fc] text-gray-900 relative overflow-hidden">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#00e3ec]/5 via-transparent to-violet-500/5 pointer-events-none" />
      <div className="relative z-10 container mx-auto px-4 py-8 max-w-2xl">
        {children}
      </div>
    </div>
  )
}
