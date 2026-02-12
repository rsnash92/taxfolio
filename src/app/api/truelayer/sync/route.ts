import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { syncTransactions } from '@/lib/truelayer/sync'

/**
 * POST /api/truelayer/sync
 * Sync transactions from TrueLayer into Supabase for the authenticated user.
 */
export async function POST() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await syncTransactions(user.id, supabase)
    return NextResponse.json(result)
  } catch (err) {
    console.error('[TrueLayer Sync] Error:', err)
    return NextResponse.json(
      { error: 'Sync failed', details: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    )
  }
}
