import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: partner, error } = await supabase
    .from('partners')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (error || !partner) {
    return NextResponse.json({ error: 'Partner not found' }, { status: 404 })
  }

  return NextResponse.json(partner)
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()

  // Only allow updating certain fields
  const allowedFields = [
    'phone',
    'website',
    'payout_method',
    'payout_email',
    'bank_account_name',
    'bank_sort_code',
    'bank_account_number',
  ]

  const updates: Record<string, string | null> = {}
  for (const field of allowedFields) {
    if (field in body) {
      updates[field] = body[field]
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  updates.updated_at = new Date().toISOString()

  const { data: partner, error } = await supabase
    .from('partners')
    .update(updates)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) {
    console.error('Failed to update partner:', error)
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    )
  }

  return NextResponse.json(partner)
}
