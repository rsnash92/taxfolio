import { NextResponse } from 'next/server'
import { getLifetimeDealsRemaining } from '@/lib/subscription'
import { LIFETIME_DEAL_ENABLED, LIFETIME_DEAL_LIMIT } from '@/lib/stripe'

export async function GET() {
  try {
    if (!LIFETIME_DEAL_ENABLED) {
      return NextResponse.json({
        enabled: false,
        remaining: 0,
        total: LIFETIME_DEAL_LIMIT,
      })
    }

    const remaining = await getLifetimeDealsRemaining()

    return NextResponse.json({
      enabled: true,
      remaining,
      total: LIFETIME_DEAL_LIMIT,
    })
  } catch (error) {
    console.error('Lifetime remaining error:', error)
    return NextResponse.json({ error: 'Failed to get count' }, { status: 500 })
  }
}
