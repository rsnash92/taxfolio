"use client"

import { useState, useEffect } from "react"

interface SubscriptionState {
  tier: string
  isLifetime: boolean
  isTrial: boolean
  loading: boolean
}

const PRO_FEATURES = [
  'sa105',
  'mtd_quarters',
  'csv_export',
  'pdf_export',
  'mileage',
  'priority_support',
  'unlimited_banks',
  'unlimited_transactions',
]

export function useSubscription() {
  const [subscription, setSubscription] = useState<SubscriptionState>({
    tier: 'free',
    isLifetime: false,
    isTrial: false,
    loading: true,
  })

  useEffect(() => {
    async function fetchSubscription() {
      try {
        const res = await fetch('/api/subscription')
        if (res.ok) {
          const data = await res.json()
          setSubscription({
            tier: data.tier || 'free',
            isLifetime: data.isLifetime || false,
            isTrial: data.isTrial || false,
            loading: false,
          })
        } else {
          setSubscription(prev => ({ ...prev, loading: false }))
        }
      } catch {
        setSubscription(prev => ({ ...prev, loading: false }))
      }
    }

    fetchSubscription()
  }, [])

  const canAccessFeature = (feature: string): boolean => {
    // In development, allow all features
    if (process.env.NODE_ENV === 'development') return true

    // Lifetime and Pro get everything
    if (subscription.isLifetime || subscription.tier === 'pro') return true

    // Trial can access features
    if (subscription.isTrial) return true

    // Lite and free don't get pro features
    return !PRO_FEATURES.includes(feature)
  }

  return {
    ...subscription,
    canAccessFeature,
  }
}
