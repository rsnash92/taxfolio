import { SupabaseClient } from '@supabase/supabase-js'
import { getTransactions, refreshAccessToken } from '@/lib/truelayer/client'
import { getMtdCategory } from '@/lib/mtd/category-mapping'
import { getCurrentTaxYear, getTaxYearDates } from '@/lib/mtd/quarters'

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

  // 4. Get accounts linked to this connection
  const { data: accounts } = await supabase
    .from('accounts')
    .select('id, external_account_id')
    .eq('bank_connection_id', connection.id)

  if (!accounts || accounts.length === 0) {
    return { synced: 0, skipped: 0, errors: ['No accounts linked to bank connection'] }
  }

  // 5. Load categories for mapping
  const { data: categories } = await supabase
    .from('categories')
    .select('id, code')

  const categoryByCode = new Map<string, string>()
  for (const cat of categories || []) {
    categoryByCode.set(cat.code, cat.id)
  }

  // 6. Fetch transactions for current tax year
  const taxYear = getCurrentTaxYear()
  const { start: fromDate, end: toDate } = getTaxYearDates(taxYear)

  let synced = 0
  let skipped = 0
  const errors: string[] = []

  for (const account of accounts) {
    try {
      const response = await getTransactions(
        accessToken,
        account.external_account_id,
        fromDate,
        toDate,
      )

      if (response.error) {
        errors.push(`Account ${account.external_account_id}: ${response.error}`)
        continue
      }

      const txList: TrueLayerTransaction[] = response.results || []

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

        // Auto-categorise via keyword matching
        const mtdCategoryCode = getMtdCategory(description, 'self-employment')
        const categoryId = mtdCategoryCode ? categoryByCode.get(mtdCategoryCode) : undefined

        // Compute tax year from transaction date
        const txDate = tx.timestamp.split('T')[0]
        const txTaxYear = computeTaxYear(txDate)

        const { error: insertError } = await supabase.from('transactions').insert({
          user_id: userId,
          account_id: account.id,
          external_transaction_id: externalId,
          date: txDate,
          description,
          amount,
          currency: tx.currency || 'GBP',
          merchant_name: tx.merchant_name || null,
          ai_suggested_category_id: categoryId || null,
          ai_confidence: categoryId ? 0.8 : null,
          review_status: 'pending',
          tax_year: txTaxYear,
        })

        if (insertError) {
          errors.push(`Insert error for ${externalId}: ${insertError.message}`)
        } else {
          synced++
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

  return { synced, skipped, errors }
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
