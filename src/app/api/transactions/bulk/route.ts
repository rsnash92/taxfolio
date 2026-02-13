import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * PATCH /api/transactions/bulk
 * Bulk actions on transactions: confirm_all, mark_personal
 *
 * confirm_all: No IDs needed — confirms ALL pending AI suggestions for the user.
 * mark_personal: Accepts optional transaction_ids (small batches only).
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

  if (!action) {
    return NextResponse.json({ error: 'action is required' }, { status: 400 })
  }

  if (action === 'confirm_all') {
    // Fetch all unconfirmed transactions that have an AI suggestion.
    // No .in() needed — we query by user_id + conditions directly.
    const { data: transactions, error: fetchErr } = await supabase
      .from('transactions')
      .select('id, ai_suggested_category_id')
      .eq('user_id', user.id)
      .not('ai_suggested_category_id', 'is', null)
      .neq('review_status', 'confirmed')

    if (fetchErr) {
      return NextResponse.json({ error: fetchErr.message }, { status: 500 })
    }

    if (!transactions || transactions.length === 0) {
      return NextResponse.json({ ok: true, confirmed: 0 })
    }

    // Group transactions by ai_suggested_category_id for efficient bulk updates.
    // One UPDATE per unique category instead of one per transaction.
    const byCategory = new Map<string, string[]>()
    for (const tx of transactions) {
      const catId = tx.ai_suggested_category_id
      if (!catId) continue
      const ids = byCategory.get(catId) || []
      ids.push(tx.id)
      byCategory.set(catId, ids)
    }

    let confirmed = 0
    const errors: string[] = []

    for (const [categoryId, ids] of byCategory) {
      // Process in chunks of 50 to stay within PostgREST limits
      for (let i = 0; i < ids.length; i += 50) {
        const chunk = ids.slice(i, i + 50)
        const { error, count } = await supabase
          .from('transactions')
          .update({
            category_id: categoryId,
            review_status: 'confirmed',
          })
          .eq('user_id', user.id)
          .in('id', chunk)

        if (error) {
          errors.push(`Category ${categoryId}: ${error.message}`)
        } else {
          confirmed += count ?? chunk.length
        }
      }
    }

    return NextResponse.json({ ok: true, confirmed, errors })
  }

  if (action === 'mark_personal') {
    if (!transaction_ids || !Array.isArray(transaction_ids) || transaction_ids.length === 0) {
      return NextResponse.json({ error: 'transaction_ids required for mark_personal' }, { status: 400 })
    }

    const { data: personalCat } = await supabase
      .from('categories')
      .select('id')
      .eq('code', 'personal')
      .single()

    if (!personalCat) {
      return NextResponse.json({ error: 'Personal category not found' }, { status: 500 })
    }

    // Process in chunks of 50
    let confirmed = 0
    const errors: string[] = []

    for (let i = 0; i < transaction_ids.length; i += 50) {
      const chunk = transaction_ids.slice(i, i + 50)
      const { error, count } = await supabase
        .from('transactions')
        .update({
          category_id: personalCat.id,
          review_status: 'confirmed',
        })
        .eq('user_id', user.id)
        .in('id', chunk)

      if (error) {
        errors.push(error.message)
      } else {
        confirmed += count ?? chunk.length
      }
    }

    return NextResponse.json({ ok: true, confirmed, errors })
  }

  return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
}
