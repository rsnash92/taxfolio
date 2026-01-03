import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

function maskEmail(email: string | null): string {
  if (!email) return 'Anonymous'
  const [local, domain] = email.split('@')
  if (!domain) return 'Anonymous'
  if (local.length <= 2) return `${local[0]}***@${domain}`
  return `${local[0]}${local[1]}***@${domain}`
}

export async function GET() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: referrals, error } = await supabase
    .from('referrals')
    .select(
      `
      id,
      referred_email,
      status,
      signed_up_at,
      started_return_at,
      submitted_at,
      paid_at,
      product_type,
      reward_amount,
      reward_status
    `
    )
    .eq('referrer_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Failed to get referrals:', error)
    return NextResponse.json(
      { error: 'Failed to get referrals' },
      { status: 500 }
    )
  }

  // Mask emails for privacy
  const maskedReferrals = (referrals || []).map((r) => ({
    ...r,
    referred_email: maskEmail(r.referred_email),
  }))

  return NextResponse.json({ referrals: maskedReferrals })
}
