import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { plaidClient } from '@/lib/plaid'

// Helper to determine tax year from a date
function getTaxYear(date: string): string {
  const d = new Date(date)
  const year = d.getFullYear()
  const month = d.getMonth() + 1 // 0-indexed
  const day = d.getDate()

  // UK tax year runs from 6 April to 5 April
  if (month > 4 || (month === 4 && day >= 6)) {
    return `${year}-${(year + 1).toString().slice(-2)}`
  } else {
    return `${year - 1}-${year.toString().slice(-2)}`
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { account_id } = await request.json()

    // Get the account and its connection
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .select('*, bank_connections(*)')
      .eq('id', account_id)
      .eq('user_id', user.id)
      .single()

    if (accountError || !account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    }

    const accessToken = account.bank_connections.plaid_access_token

    // Fetch transactions from Plaid (last 365 days)
    const now = new Date()
    const startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
      .toISOString()
      .split('T')[0]
    const endDate = now.toISOString().split('T')[0]

    const transactionsResponse = await plaidClient.transactionsGet({
      access_token: accessToken,
      start_date: startDate,
      end_date: endDate,
      options: {
        account_ids: [account.plaid_account_id],
        count: 500,
        offset: 0,
      },
    })

    const transactions = transactionsResponse.data.transactions

    // Prepare transactions for insertion
    const transactionsToInsert = transactions.map((tx) => ({
      user_id: user.id,
      account_id: account.id,
      plaid_transaction_id: tx.transaction_id,
      date: tx.date,
      description: tx.name,
      amount: tx.amount, // Plaid: positive = money out, negative = money in
      currency: tx.iso_currency_code || 'GBP',
      merchant_name: tx.merchant_name,
      review_status: 'pending',
      tax_year: getTaxYear(tx.date),
    }))

    // Upsert transactions (avoid duplicates)
    let insertedCount = 0
    for (const tx of transactionsToInsert) {
      const { error } = await supabase
        .from('transactions')
        .upsert(tx, {
          onConflict: 'plaid_transaction_id',
          ignoreDuplicates: true,
        })

      if (!error) {
        insertedCount++
      }
    }

    // Update last synced timestamp
    await supabase
      .from('bank_connections')
      .update({ last_synced_at: new Date().toISOString() })
      .eq('id', account.bank_connection_id)

    return NextResponse.json({
      success: true,
      synced_count: transactions.length,
      inserted_count: insertedCount,
    })
  } catch (error) {
    console.error('Error syncing transactions:', error)
    return NextResponse.json(
      { error: 'Failed to sync transactions' },
      { status: 500 }
    )
  }
}
