import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * PATCH /api/transactions/bulk
 * Bulk actions on transactions: confirm_all, mark_personal
 */
export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { action, transaction_ids } = body

  if (!action || !transaction_ids || !Array.isArray(transaction_ids) || transaction_ids.length === 0) {
    return NextResponse.json({ error: 'action and transaction_ids required' }, { status: 400 })
  }

  if (action === 'confirm_all') {
    // For each transaction, set category_id = ai_suggested_category_id
    // Supabase doesn't support column-to-column updates in a single call,
    // so we fetch the suggested values first then batch update
    const { data: transactions, error: fetchErr } = await supabase
      .from('transactions')
      .select('id, ai_suggested_category_id')
      .eq('user_id', user.id)
      .in('id', transaction_ids)
      .not('ai_suggested_category_id', 'is', null)

    if (fetchErr) {
      return NextResponse.json({ error: fetchErr.message }, { status: 500 })
    }

    let confirmed = 0
    const errors: string[] = []

    for (const tx of transactions || []) {
      const { error } = await supabase
        .from('transactions')
        .update({
          category_id: tx.ai_suggested_category_id,
          review_status: 'confirmed',
        })
        .eq('id', tx.id)
        .eq('user_id', user.id)

      if (error) {
        errors.push(`${tx.id}: ${error.message}`)
      } else {
        confirmed++
      }
    }

    return NextResponse.json({ ok: true, confirmed, errors })
  }

  if (action === 'mark_personal') {
    // Look up the personal category ID
    const { data: personalCat } = await supabase
      .from('categories')
      .select('id')
      .eq('code', 'personal')
      .single()

    if (!personalCat) {
      return NextResponse.json({ error: 'Personal category not found' }, { status: 500 })
    }

    const { error, count } = await supabase
      .from('transactions')
      .update({
        category_id: personalCat.id,
        review_status: 'confirmed',
      })
      .eq('user_id', user.id)
      .in('id', transaction_ids)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, confirmed: count ?? transaction_ids.length })
  }

  return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
}
