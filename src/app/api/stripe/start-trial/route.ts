import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { startFreeTrial, getSubscription } from '@/lib/subscription'

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if already has subscription or used trial
    const subscription = await getSubscription(user.id)

    if (subscription.isLifetime) {
      return NextResponse.json({ error: 'Already have lifetime access' }, { status: 400 })
    }

    if (subscription.tier !== 'free' && subscription.status === 'active') {
      return NextResponse.json({ error: 'Already subscribed' }, { status: 400 })
    }

    await startFreeTrial(user.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Start trial error:', error)
    return NextResponse.json(
      { error: 'Failed to start trial' },
      { status: 500 }
    )
  }
}
