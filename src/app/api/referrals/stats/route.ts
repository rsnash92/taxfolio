import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase.rpc('get_referral_stats', {
    p_user_id: user.id,
  })

  if (error) {
    console.error('Failed to get referral stats:', error)
    return NextResponse.json({ error: 'Failed to get stats' }, { status: 500 })
  }

  return NextResponse.json(data)
}
