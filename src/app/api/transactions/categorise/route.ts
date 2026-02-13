import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  loadCategoryMap,
  categoriseTransactionsStreaming,
} from '@/lib/ai/categorise'

/**
 * POST /api/transactions/categorise
 * AI-categorise uncategorised transactions using Claude 3.5 Haiku.
 * Accepts { transaction_ids?: string[], stream?: boolean }
 * If no transaction_ids provided, categorises all uncategorised transactions.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { transaction_ids, stream } = body

  // Fetch all uncategorised transactions for this user.
  // We avoid .in() with large ID lists as PostgREST has URL length limits.
  // If specific IDs are provided (small batch), filter by them.
  let query = supabase
    .from('transactions')
    .select('id, description, amount, date, merchant_name')
    .eq('user_id', user.id)
    .is('ai_suggested_category_id', null)

  if (transaction_ids && Array.isArray(transaction_ids) && transaction_ids.length > 0 && transaction_ids.length <= 100) {
    query = query.in('id', transaction_ids)
  }

  const { data: transactions, error: fetchErr } = await query

  if (fetchErr) {
    return NextResponse.json({ error: fetchErr.message }, { status: 500 })
  }

  if (!transactions || transactions.length === 0) {
    return NextResponse.json({ message: 'No uncategorised transactions found', categorised: 0 })
  }

  // Load category mapping
  const { categoryMap, personalCategoryId } = await loadCategoryMap(supabase)

  // Format for AI
  const transactionList = transactions.map((tx) => ({
    id: tx.id,
    description: tx.merchant_name || tx.description,
    amount: Math.abs(tx.amount),
    type: (tx.amount >= 0 ? 'income' : 'expense') as 'income' | 'expense',
    date: tx.date,
  }))

  console.log('[categorise API] Processing', transactionList.length, 'transactions, stream:', !!stream)

  if (stream) {
    const readable = categoriseTransactionsStreaming(
      transactionList,
      categoryMap,
      personalCategoryId,
      supabase,
    )

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  }

  // Non-streaming: use the shared categorise function
  const { categoriseTransactions } = await import('@/lib/ai/categorise')
  const result = await categoriseTransactions(
    transactions.map((t) => t.id),
    supabase,
  )

  return NextResponse.json({
    categorised: result.categorised,
    errors: result.errors,
    total: transactions.length,
  })
}
