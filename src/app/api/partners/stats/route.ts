import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get partner profile
  const { data: partner } = await supabase
    .from('partners')
    .select('id, status')
    .eq('user_id', user.id)
    .single()

  if (!partner) {
    return NextResponse.json({ error: 'Partner not found' }, { status: 404 })
  }

  if (partner.status !== 'approved') {
    return NextResponse.json(
      { error: 'Partner not approved' },
      { status: 403 }
    )
  }

  // Get stats using database function
  const { data: stats, error } = await supabase.rpc('get_partner_stats', {
    p_partner_id: partner.id,
  })

  if (error) {
    console.error('Failed to get partner stats:', error)
    return NextResponse.json(
      { error: 'Failed to get stats' },
      { status: 500 }
    )
  }

  return NextResponse.json(stats)
}
