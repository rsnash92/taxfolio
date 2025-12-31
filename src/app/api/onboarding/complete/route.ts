import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { trackOnboardingCompleted, trackTrialStarted } from '@/lib/loops'

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Calculate trial end date (30 days from now)
    const trialEndsAt = new Date()
    trialEndsAt.setDate(trialEndsAt.getDate() + 30)

    // Get current user type
    const { data: userData } = await supabase
      .from('users')
      .select('user_type')
      .eq('id', user.id)
      .single()

    // Mark onboarding complete and start free trial
    const { error } = await supabase
      .from('users')
      .update({
        onboarding_completed: true,
        subscription_tier: 'free',
        subscription_status: 'trialing',
        trial_ends_at: trialEndsAt.toISOString(),
      })
      .eq('id', user.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Track in Loops
    if (user.email) {
      const userType = userData?.user_type || 'sole_trader'
      await trackOnboardingCompleted(user.email, user.id, userType)
      await trackTrialStarted(user.email, user.id, trialEndsAt)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error completing onboarding:', error)
    return NextResponse.json(
      { error: 'Failed to complete onboarding' },
      { status: 500 }
    )
  }
}
