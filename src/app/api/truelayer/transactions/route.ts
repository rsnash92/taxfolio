import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { syncAllTransactions } from '@/lib/truelayer/transactions'
import { trackFirstTransaction, updateTransactionCount } from '@/lib/loops'

export async function POST(request: NextRequest) {
  console.log('[truelayer/transactions] POST request started')

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  console.log('[truelayer/transactions] User:', user.id)

  try {
    // Check if user has any existing transactions (for first transaction tracking)
    const { count: existingCount } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    const body = await request.json().catch(() => ({}))
    console.log('[truelayer/transactions] Request body:', body)

    const result = await syncAllTransactions(user.id, {
      from: body.from,
      to: body.to,
    })

    console.log('[truelayer/transactions] Sync complete:', result)

    // If no business accounts, return helpful message
    if (result.total === 0 && result.errors.length === 0) {
      return NextResponse.json({
        ...result,
        message: 'No business accounts to sync. Mark at least one account as a business account first.',
      })
    }

    // Track in Loops if transactions were imported
    if (result.total > 0 && user.email) {
      const totalAfterSync = (existingCount || 0) + result.total

      // If this was their first transaction import
      if (existingCount === 0 || existingCount === null) {
        await trackFirstTransaction(user.email, user.id, result.total)
      } else {
        // Just update the transaction count
        await updateTransactionCount(user.email, totalAfterSync)
      }
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('[truelayer/transactions] Failed to sync:', error)

    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    // Handle specific errors
    if (errorMessage.includes('BANK_NOT_CONNECTED')) {
      return NextResponse.json(
        { error: 'No bank connected. Please connect your bank first.' },
        { status: 400 }
      )
    }

    if (errorMessage.includes('CONNECTION_EXPIRED')) {
      return NextResponse.json(
        { error: 'Bank connection expired. Please reconnect your bank.' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to sync transactions', details: errorMessage },
      { status: 500 }
    )
  }
}
