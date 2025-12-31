import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { connectionId } = await request.json()

    if (!connectionId) {
      return NextResponse.json(
        { error: 'Connection ID required' },
        { status: 400 }
      )
    }

    // Get all accounts for this connection
    const { data: accounts } = await supabase
      .from('bank_accounts')
      .select('id')
      .eq('connection_id', connectionId)
      .eq('user_id', user.id)

    const accountIds = accounts?.map(a => a.id) || []

    // Delete all transactions for these accounts
    if (accountIds.length > 0) {
      const { error: txDeleteError, count } = await supabase
        .from('transactions')
        .delete()
        .in('bank_account_id', accountIds)
        .eq('user_id', user.id)

      if (txDeleteError) {
        console.error('Error deleting transactions:', txDeleteError)
      } else {
        console.log(`Deleted ${count} transactions for connection ${connectionId}`)
      }
    }

    // Delete the accounts (will cascade delete due to FK)
    const { error: accountsError } = await supabase
      .from('bank_accounts')
      .delete()
      .eq('connection_id', connectionId)
      .eq('user_id', user.id)

    if (accountsError) {
      console.error('Error deleting accounts:', accountsError)
    }

    // Delete the connection
    const { error: connectionError } = await supabase
      .from('bank_connections')
      .delete()
      .eq('id', connectionId)
      .eq('user_id', user.id)

    if (connectionError) {
      throw new Error(`Failed to delete connection: ${connectionError.message}`)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to disconnect:', error)
    return NextResponse.json(
      { error: 'Failed to disconnect bank' },
      { status: 500 }
    )
  }
}
