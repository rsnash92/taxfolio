import { createClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/admin/auth'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(request: NextRequest) {
  const supabase = await createClient()

  // Check admin auth
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || !isAdmin(user.email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { payoutId, status, failureReason } = await request.json()

  if (!payoutId || !status) {
    return NextResponse.json(
      { error: 'payoutId and status are required' },
      { status: 400 }
    )
  }

  if (!['processing', 'completed', 'failed'].includes(status)) {
    return NextResponse.json(
      { error: 'Invalid status. Must be processing, completed, or failed' },
      { status: 400 }
    )
  }

  // Build update object
  const updateData: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  }

  if (status === 'completed' || status === 'failed') {
    updateData.processed_at = new Date().toISOString()
  }

  if (status === 'failed' && failureReason) {
    updateData.failure_reason = failureReason
  }

  // Update the payout
  const { data, error } = await supabase
    .from('referral_payouts')
    .update(updateData)
    .eq('id', payoutId)
    .select()
    .single()

  if (error) {
    console.error('Failed to update payout:', error)
    return NextResponse.json(
      { error: 'Failed to update payout' },
      { status: 500 }
    )
  }

  // If marking as failed, we need to refund the balance
  if (status === 'failed') {
    // Get the payout to find the user and amount
    const payout = data as { user_id: string; amount: number }

    // Credit the amount back to the user's balance
    const { error: creditError } = await supabase
      .from('referral_balance_transactions')
      .insert({
        user_id: payout.user_id,
        amount: payout.amount,
        type: 'credit',
        description: 'Payout failed - amount refunded',
        reference_id: payoutId,
      })

    if (creditError) {
      console.error('Failed to refund balance:', creditError)
      // Don't fail the whole operation, just log the error
    }
  }

  return NextResponse.json({ success: true, data })
}

// GET endpoint to fetch all payouts with filters
export async function GET(request: NextRequest) {
  const supabase = await createClient()

  // Check admin auth
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || !isAdmin(user.email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')

  let query = supabase
    .from('referral_payouts')
    .select(`
      *,
      user:users!referral_payouts_user_id_fkey(email, full_name)
    `)
    .order('requested_at', { ascending: false })

  if (status) {
    query = query.eq('status', status)
  }

  const { data, error } = await query.limit(100)

  if (error) {
    console.error('Failed to fetch payouts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch payouts' },
      { status: 500 }
    )
  }

  return NextResponse.json({ payouts: data })
}
