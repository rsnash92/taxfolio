import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSubscription } from '@/lib/subscription'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const subscription = await getSubscription(user.id)

    return NextResponse.json({
      tier: subscription.tier,
      status: subscription.status,
      isLifetime: subscription.isLifetime,
      isTrial: subscription.isTrial,
      trialEndsAt: subscription.trialEndsAt?.toISOString() || null,
      daysLeftInTrial: subscription.daysLeftInTrial,
      currentPeriodEnd: subscription.currentPeriodEnd?.toISOString() || null,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
    })
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch subscription' },
      { status: 500 }
    )
  }
}
