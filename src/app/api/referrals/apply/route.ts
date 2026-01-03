import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { code } = await request.json()

  if (!code) {
    return NextResponse.json(
      { error: 'Referral code required' },
      { status: 400 }
    )
  }

  const { data, error } = await supabase.rpc('apply_referral_code', {
    p_referred_user_id: user.id,
    p_referred_email: user.email,
    p_code: code,
  })

  if (error) {
    console.error('Failed to apply referral code:', error)
    return NextResponse.json(
      { error: 'Failed to apply code' },
      { status: 500 }
    )
  }

  return NextResponse.json(data)
}
