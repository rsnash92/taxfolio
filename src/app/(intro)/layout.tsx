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
    <div className="min-h-screen bg-gradient-to-b from-zinc-900 to-black text-white">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {children}
      </div>
    </div>
  )
}
