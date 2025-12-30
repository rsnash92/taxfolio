import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { transaction_ids } = await request.json()

    if (!transaction_ids || !Array.isArray(transaction_ids) || transaction_ids.length === 0) {
      return NextResponse.json({ error: 'No transaction IDs provided' }, { status: 400 })
    }

    // Fetch transactions to confirm (only those with AI suggestions)
    const { data: transactions, error: fetchError } = await supabase
      .from('transactions')
      .select('id, ai_suggested_category_id')
      .eq('user_id', user.id)
      .eq('review_status', 'pending')
      .not('ai_suggested_category_id', 'is', null)
      .in('id', transaction_ids)

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    if (!transactions || transactions.length === 0) {
      return NextResponse.json({ message: 'No transactions to confirm', updated: 0 })
    }

    // Update each transaction to confirmed status with its AI suggested category
    let updatedCount = 0
    for (const tx of transactions) {
      const { error: updateError } = await supabase
        .from('transactions')
        .update({
          category_id: tx.ai_suggested_category_id,
          review_status: 'confirmed',
        })
        .eq('id', tx.id)
        .eq('user_id', user.id)

      if (!updateError) {
        updatedCount++
      }
    }

    return NextResponse.json({
      success: true,
      updated: updatedCount,
      total: transactions.length,
    })
  } catch (error) {
    console.error('Error in bulk confirm:', error)
    return NextResponse.json(
      { error: 'Failed to confirm transactions' },
      { status: 500 }
    )
  }
}
