import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * PATCH /api/truelayer/accounts/[id]
 * Toggle account visibility (is_visible) for sync selection
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { is_visible } = body

  if (typeof is_visible !== 'boolean') {
    return NextResponse.json({ error: 'is_visible must be a boolean' }, { status: 400 })
  }

  const { error } = await supabase
    .from('accounts')
    .update({ is_visible })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
