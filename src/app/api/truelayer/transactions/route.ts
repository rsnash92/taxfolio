import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { syncAllTransactions } from '@/lib/truelayer/transactions'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json().catch(() => ({}))

    const result = await syncAllTransactions(user.id, {
      from: body.from,
      to: body.to,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Failed to sync transactions:', error)

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
      { error: 'Failed to sync transactions' },
      { status: 500 }
    )
  }
}
