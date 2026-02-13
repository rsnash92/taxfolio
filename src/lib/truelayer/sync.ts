import { SupabaseClient } from '@supabase/supabase-js'
import { getTransactions, refreshAccessToken } from '@/lib/truelayer/client'
import { getCurrentTaxYear, getTaxYearDates } from '@/lib/mtd/quarters'
import { categoriseTransactions } from '@/lib/ai/categorise'

interface TokenBlob {
  accessToken: string
  refreshToken: string
  expiresAt: number
}

interface TrueLayerTransaction {
  transaction_id: string
  timestamp: string
  description: string
  amount: number
  currency: string
  transaction_type: string
  transaction_category: string
  merchant_name?: string
}

/**
 * Sync transactions from TrueLayer into Supabase for a given user.
 * Reads the persisted bank connection, fetches transactions, and upserts them.
 */
export async function syncTransactions(
  userId: string,
  supabase: SupabaseClient,
): Promise<{ synced: number; skipped: number; errors: string[] }> {
  // 1. Read bank connection from Supabase
  const { data: connection, error: connError } = await supabase
    .from('bank_connections')
    .select('id, access_token_blob, last_synced_at')
    .eq('user_id', userId)
    .eq('status', 'active')
    .single()

  if (connError || !connection) {
    return { synced: 0, skipped: 0, errors: ['No active bank connection found'] }
  }

  // 2. Parse token blob
  let tokens: TokenBlob
  try {
    tokens = JSON.parse(connection.access_token_blob)
  } catch {
    return { synced: 0, skipped: 0, errors: ['Invalid token data in bank connection'] }
  }

  // 3. Refresh token if expired
  let accessToken = tokens.accessToken
  if (Date.now() > tokens.expiresAt) {
    try {
      const refreshed = await refreshAccessToken(tokens.refreshToken)
      accessToken = refreshed.access_token
      const newTokenBlob: TokenBlob = {
        accessToken: refreshed.access_token,
        refreshToken: refreshed.refresh_token,
        expiresAt: Date.now() + (refreshed.expires_in || 3600) * 1000,
      }
      await supabase
        .from('bank_connections')
        .update({ access_token_blob: JSON.stringify(newTokenBlob) })
        .eq('id', connection.id)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Token refresh failed'
      return { synced: 0, skipped: 0, errors: [msg] }
    }
  }

  // 4. Get selected accounts linked to this connection
  // Try filtering by is_visible; fall back to all accounts if column doesn't exist
  let accounts: { id: string; external_account_id: string }[] | null = null
  const { data: filtered, error: filtErr } = await supabase
    .from('accounts')
    .select('id, external_account_id')
    .eq('bank_connection_id', connection.id)
    .eq('is_visible', true)

  if (filtErr) {
    // Column doesn't exist yet — sync all accounts
    const { data: all } = await supabase
      .from('accounts')
      .select('id, external_account_id')
      .eq('bank_connection_id', connection.id)
    accounts = all
  } else {
    accounts = filtered
  }

  if (!accounts || accounts.length === 0) {
    return { synced: 0, skipped: 0, errors: ['No selected accounts to sync'] }
  }

  // 5. Build date range chunks (max 89 days each to stay within TrueLayer limits)
  const taxYear = getCurrentTaxYear()
  const { start: fromDate, end: taxYearEnd } = getTaxYearDates(taxYear)
  const today = new Date().toISOString().split('T')[0]
  const toDate = taxYearEnd > today ? today : taxYearEnd
  const dateChunks = buildDateChunks(fromDate, toDate, 89)

  let synced = 0
  let skipped = 0
  const errors: string[] = []
  const newTransactionIds: string[] = []

  for (const account of accounts) {
    try {
      const txList: TrueLayerTransaction[] = []

      for (const chunk of dateChunks) {
        const response = await getTransactions(
          accessToken,
          account.external_account_id,
          chunk.from,
          chunk.to,
        )

        if (response.error) {
          errors.push(`Account ${account.external_account_id}: ${response.error} (${chunk.from} to ${chunk.to})`)
          continue
        }

        txList.push(...(response.results || []))
      }

      for (const tx of txList) {
        const externalId = tx.transaction_id || `tl-${account.external_account_id}-${tx.timestamp}`

        // Check if already exists
        const { data: existing } = await supabase
          .from('transactions')
          .select('id')
          .eq('external_transaction_id', externalId)
          .maybeSingle()

        if (existing) {
          skipped++
          continue
        }

        const isIncome = tx.transaction_type === 'CREDIT'
        const description = tx.description || tx.merchant_name || 'Transaction'
        const amount = isIncome ? Math.abs(tx.amount) : -Math.abs(tx.amount)

        // Compute tax year from transaction date
        const txDate = tx.timestamp.split('T')[0]
        const txTaxYear = computeTaxYear(txDate)

        const { data: inserted, error: insertError } = await supabase.from('transactions').insert({
          user_id: userId,
          account_id: account.id,
          external_transaction_id: externalId,
          date: txDate,
          description,
          amount,
          currency: tx.currency || 'GBP',
          merchant_name: tx.merchant_name || null,
          review_status: 'pending',
          tax_year: txTaxYear,
        }).select('id').single()

        if (insertError) {
          errors.push(`Insert error for ${externalId}: ${insertError.message}`)
        } else {
          synced++
          if (inserted) newTransactionIds.push(inserted.id)
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      errors.push(`Account ${account.external_account_id}: ${msg}`)
    }
  }

  // Update last synced timestamp
  await supabase
    .from('bank_connections')
    .update({ last_synced_at: new Date().toISOString() })
    .eq('id', connection.id)

  // Auto-categorise newly imported transactions via AI
  if (newTransactionIds.length > 0) {
    try {
      console.log('[sync] Auto-categorising', newTransactionIds.length, 'new transactions')
      const catResult = await categoriseTransactions(newTransactionIds, supabase)
      console.log('[sync] AI categorised', catResult.categorised, 'transactions')
      if (catResult.errors.length > 0) {
        errors.push(...catResult.errors.map((e) => `AI categorise: ${e}`))
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'AI categorisation failed'
      errors.push(msg)
    }
  }

  return { synced, skipped, errors }
}

function buildDateChunks(from: string, to: string, maxDays: number): { from: string; to: string }[] {
  const chunks: { from: string; to: string }[] = []
  let cursor = new Date(from)
  const end = new Date(to)

  while (cursor < end) {
    const chunkEnd = new Date(cursor)
    chunkEnd.setDate(chunkEnd.getDate() + maxDays)
    if (chunkEnd > end) chunkEnd.setTime(end.getTime())

    chunks.push({
      from: cursor.toISOString().split('T')[0],
      to: chunkEnd.toISOString().split('T')[0],
    })

    cursor = new Date(chunkEnd)
    cursor.setDate(cursor.getDate() + 1)
  }

  return chunks
}

function computeTaxYear(dateStr: string): string {
  const d = new Date(dateStr)
  const year = d.getFullYear()
  const month = d.getMonth() + 1
  const day = d.getDate()

  // Tax year runs 6 Apr to 5 Apr
  if (month > 4 || (month === 4 && day >= 6)) {
    return `${year}-${(year + 1).toString().slice(-2)}`
  }
  return `${year - 1}-${year.toString().slice(-2)}`
}
