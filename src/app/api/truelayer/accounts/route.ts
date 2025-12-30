import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSyncedAccounts, syncAccounts } from '@/lib/truelayer/accounts'
import { getAllConnections } from '@/lib/truelayer/tokens'

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const accounts = await getSyncedAccounts(user.id)
    const connections = await getAllConnections(user.id)

    return NextResponse.json({
      accounts,
      connections: connections.map((c) => ({
        id: c.id,
        bank_name: c.bank_name,
        status: c.status,
        last_synced_at: c.last_synced_at,
        consent_expires_at: c.consent_expires_at,
      })),
    })
  } catch (error) {
    console.error('Failed to get accounts:', error)
    return NextResponse.json({ error: 'Failed to get accounts' }, { status: 500 })
  }
}

// Refresh accounts
export async function POST() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const connections = await getAllConnections(user.id)

    for (const connection of connections) {
      if (connection.status === 'active') {
        await syncAccounts(user.id, connection.id)
      }
    }

    const accounts = await getSyncedAccounts(user.id)

    return NextResponse.json({ accounts })
  } catch (error) {
    console.error('Failed to refresh accounts:', error)
    return NextResponse.json(
      { error: 'Failed to refresh accounts' },
      { status: 500 }
    )
  }
}
