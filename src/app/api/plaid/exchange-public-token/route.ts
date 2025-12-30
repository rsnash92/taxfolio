import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { plaidClient } from '@/lib/plaid'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { public_token, institution } = await request.json()

    // Exchange public token for access token
    const exchangeResponse = await plaidClient.itemPublicTokenExchange({
      public_token,
    })

    const accessToken = exchangeResponse.data.access_token
    const itemId = exchangeResponse.data.item_id

    // Store the bank connection
    const { data: bankConnection, error: connectionError } = await supabase
      .from('bank_connections')
      .insert({
        user_id: user.id,
        plaid_item_id: itemId,
        plaid_access_token: accessToken,
        institution_name: institution?.name,
        institution_id: institution?.institution_id,
        status: 'active',
      })
      .select()
      .single()

    if (connectionError) {
      console.error('Error storing bank connection:', connectionError)
      return NextResponse.json(
        { error: 'Failed to store bank connection' },
        { status: 500 }
      )
    }

    // Fetch accounts from Plaid
    const accountsResponse = await plaidClient.accountsGet({
      access_token: accessToken,
    })

    // Store accounts
    const accountsToInsert = accountsResponse.data.accounts.map((account) => ({
      user_id: user.id,
      bank_connection_id: bankConnection.id,
      plaid_account_id: account.account_id,
      name: account.name,
      official_name: account.official_name,
      type: account.type,
      subtype: account.subtype,
      mask: account.mask,
      is_business_account: false, // User will configure this
    }))

    const { error: accountsError } = await supabase
      .from('accounts')
      .insert(accountsToInsert)

    if (accountsError) {
      console.error('Error storing accounts:', accountsError)
      return NextResponse.json(
        { error: 'Failed to store accounts' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      connection_id: bankConnection.id,
      accounts_count: accountsToInsert.length,
    })
  } catch (error) {
    console.error('Error exchanging public token:', error)
    return NextResponse.json(
      { error: 'Failed to exchange public token' },
      { status: 500 }
    )
  }
}
