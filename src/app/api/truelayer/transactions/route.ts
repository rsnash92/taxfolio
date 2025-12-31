import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { syncAllTransactions } from '@/lib/truelayer/transactions'

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
