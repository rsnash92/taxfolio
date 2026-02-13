import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * PATCH /api/truelayer/accounts/[id]
 * Toggle account sync selection. When deselecting (is_visible: false),
 * also deletes all transactions from that account.
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

  // Update account visibility
  const { error } = await supabase
    .from('accounts')
    .update({ is_visible })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  let deletedCount = 0

  // When deselecting, delete all transactions from this account
  if (!is_visible) {
    const { count, error: delError } = await supabase
      .from('transactions')
      .delete({ count: 'exact' })
      .eq('account_id', id)
      .eq('user_id', user.id)

    if (delError) {
      console.error('[Accounts PATCH] Transaction delete error:', delError)
    } else {
      deletedCount = count ?? 0
    }
  }

  return NextResponse.json({ ok: true, deleted_transactions: deletedCount })
}
