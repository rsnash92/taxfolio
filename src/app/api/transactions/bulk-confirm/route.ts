import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { tax_year, transaction_ids } = await request.json()

    // Build query for confirmable transactions
    let query = supabase
      .from('transactions')
      .select('id, ai_suggested_category_id')
      .eq('user_id', user.id)
      .eq('review_status', 'pending')
      .not('ai_suggested_category_id', 'is', null)

    // If tax_year provided, confirm ALL confirmable transactions for that year
    if (tax_year) {
      query = query.eq('tax_year', tax_year)
    } else if (transaction_ids && Array.isArray(transaction_ids) && transaction_ids.length > 0) {
      // Otherwise, use specific IDs if provided
      query = query.in('id', transaction_ids)
    } else {
      return NextResponse.json({ error: 'Either tax_year or transaction_ids required' }, { status: 400 })
    }

    const { data: transactions, error: fetchError } = await query

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    if (!transactions || transactions.length === 0) {
      return NextResponse.json({ message: 'No transactions to confirm', updated: 0 })
    }

    // Update each transaction to confirmed status with its AI suggested category
    // Process in batches to avoid timeout for large numbers
    let updatedCount = 0
    const batchSize = 100

    for (let i = 0; i < transactions.length; i += batchSize) {
      const batch = transactions.slice(i, i + batchSize)

      // Update transactions in parallel within each batch
      const updatePromises = batch.map(tx =>
        supabase
          .from('transactions')
          .update({
            category_id: tx.ai_suggested_category_id,
            review_status: 'confirmed',
          })
          .eq('id', tx.id)
          .eq('user_id', user.id)
      )

      const results = await Promise.all(updatePromises)
      updatedCount += results.filter(r => !r.error).length
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
