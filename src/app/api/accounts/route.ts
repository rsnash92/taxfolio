import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Query bank_accounts with connection info (TrueLayer schema)
    const { data: accounts, error } = await supabase
      .from('bank_accounts')
      .select(`
        *,
        connection:bank_connections(bank_name, status, last_synced_at)
      `)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[accounts] Query error:', error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Transform to match expected format
    const transformedAccounts = (accounts || []).map(account => ({
      id: account.id,
      name: account.display_name || 'Bank Account',
      official_name: account.display_name,
      type: account.account_type || 'UNKNOWN',
      subtype: null,
      mask: account.account_number_last4,
      is_business_account: account.is_business_account ?? false,
      current_balance: account.current_balance,
      available_balance: account.available_balance,
      currency: account.currency,
      bank_connections: {
        institution_name: account.connection?.bank_name || 'Connected Bank',
        status: account.connection?.status || 'active',
        last_synced_at: account.connection?.last_synced_at,
      }
    }))

    return NextResponse.json({ accounts: transformedAccounts })
  } catch (err) {
    console.error('[accounts] Error:', err)
    return NextResponse.json(
      { error: 'Failed to fetch accounts' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { account_id, is_business_account } = await request.json()

    console.log('[accounts PATCH] Updating account:', account_id, 'is_business_account:', is_business_account)

    const { data, error } = await supabase
      .from('bank_accounts')
      .update({
        is_business_account: is_business_account as boolean,
        updated_at: new Date().toISOString()
      })
      .eq('id', account_id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('[accounts PATCH] Error:', error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('[accounts PATCH] Updated:', data)
    return NextResponse.json({ account: data })
  } catch {
    return NextResponse.json(
      { error: 'Failed to update account' },
      { status: 500 }
    )
  }
}
