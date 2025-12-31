import { createClient } from '@/lib/supabase/server'
import { truelayerRequest } from './client'
import { getValidAccessToken } from './tokens'
import type { TrueLayerTransaction } from './types'

/**
 * Get transactions for an account
 */
export async function getTransactions(
  userId: string,
  accountId: string,
  options?: {
    from?: string // ISO date
    to?: string // ISO date
    connectionId?: string
  }
): Promise<TrueLayerTransaction[]> {
  const accessToken = await getValidAccessToken(userId, options?.connectionId)

  const params: Record<string, string> = {}
  if (options?.from) params.from = options.from
  if (options?.to) params.to = options.to

  const response = await truelayerRequest<TrueLayerTransaction>(
    accessToken,
    `/data/v1/accounts/${accountId}/transactions`,
    { params }
  )

  return response.results
}

/**
 * Get pending transactions
 */
export async function getPendingTransactions(
  userId: string,
  accountId: string,
  connectionId?: string
): Promise<TrueLayerTransaction[]> {
  const accessToken = await getValidAccessToken(userId, connectionId)

  const response = await truelayerRequest<TrueLayerTransaction>(
    accessToken,
    `/data/v1/accounts/${accountId}/transactions/pending`
  )

  return response.results
}

/**
 * Import transactions into TaxFolio database (optimized batch insert)
 */
export async function importTransactions(
  userId: string,
  accountId: string,
  options?: {
    from?: string
    to?: string
    connectionId?: string
    taxYear?: string
  }
): Promise<{ imported: number; skipped: number }> {
  const supabase = await createClient()

  console.log(`[importTransactions] Fetching transactions for account ${accountId}`)

  // Get transactions from TrueLayer
  const transactions = await getTransactions(userId, accountId, {
    from: options?.from,
    to: options?.to,
    connectionId: options?.connectionId,
  })

  console.log(`[importTransactions] Got ${transactions.length} transactions from TrueLayer`)

  if (transactions.length === 0) {
    return { imported: 0, skipped: 0 }
  }

  // Get bank account details
  const { data: bankAccount } = await supabase
    .from('bank_accounts')
    .select('id, display_name')
    .eq('account_id', accountId)
    .eq('user_id', userId)
    .single()

  // Get all existing external_ids in one query
  const externalIds = transactions.map(tx => tx.transaction_id)
  const { data: existingTxs } = await supabase
    .from('transactions')
    .select('external_id')
    .eq('user_id', userId)
    .in('external_id', externalIds)

  const existingIds = new Set((existingTxs || []).map(t => t.external_id))
  console.log(`[importTransactions] Found ${existingIds.size} existing transactions`)

  // Filter out duplicates and prepare batch
  const taxYear = options?.taxYear || getCurrentTaxYear()
  const newTransactions = transactions
    .filter(tx => !existingIds.has(tx.transaction_id))
    .map(tx => {
      const isIncome = tx.transaction_type === 'CREDIT'
      return {
        user_id: userId,
        external_id: tx.transaction_id,
        date: tx.timestamp.split('T')[0],
        description: tx.description,
        amount: Math.abs(tx.amount),
        type: isIncome ? 'income' : 'expense',
        category: mapTrueLayerCategory(tx.transaction_category, tx.transaction_classification),
        merchant_name: tx.merchant_name,
        source: 'truelayer',
        source_account: bankAccount?.display_name,
        bank_account_id: bankAccount?.id,
        raw_data: tx,
        tax_year: taxYear,
        needs_review: true,
      }
    })

  console.log(`[importTransactions] Inserting ${newTransactions.length} new transactions`)

  let imported = 0
  const skipped = existingIds.size

  // Batch insert (chunks of 100 to avoid payload limits)
  const BATCH_SIZE = 100
  for (let i = 0; i < newTransactions.length; i += BATCH_SIZE) {
    const batch = newTransactions.slice(i, i + BATCH_SIZE)
    const { error } = await supabase.from('transactions').insert(batch)

    if (error) {
      console.error(`[importTransactions] Batch insert error:`, error.message)
    } else {
      imported += batch.length
    }
  }

  console.log(`[importTransactions] Inserted ${imported} transactions`)

  // Update last sync date on bank account
  await supabase
    .from('bank_accounts')
    .update({
      last_transaction_date: new Date().toISOString().split('T')[0],
      updated_at: new Date().toISOString(),
    })
    .eq('account_id', accountId)
    .eq('user_id', userId)

  return { imported, skipped }
}

/**
 * Map TrueLayer category to TaxFolio category
 */
function mapTrueLayerCategory(
  category: string,
  classification: string[]
): string | null {
  // TrueLayer categories
  const categoryMap: Record<string, string> = {
    PURCHASE: 'other_expenses',
    ATM: 'other_expenses',
    BILL_PAYMENT: 'admin_costs',
    CASH: 'other_expenses',
    CASHBACK: 'other_income',
    CHEQUE: 'other_expenses',
    CORRECTION: 'other_expenses',
    CREDIT: 'sales',
    DIRECT_DEBIT: 'admin_costs',
    DIVIDEND: 'other_income',
    FEE_CHARGE: 'bank_charges',
    INTEREST: 'interest_received',
    OTHER: 'other_expenses',
    PAYMENT: 'other_expenses',
    STANDING_ORDER: 'admin_costs',
    TRANSFER: 'transfer',
    DEBIT: 'other_expenses',
  }

  // Check classification for more specific mapping
  if (classification.includes('Transport')) return 'travel_costs'
  if (classification.includes('Food & Dining')) return 'other_expenses'
  if (classification.includes('Shopping')) return 'cost_of_goods'
  if (classification.includes('Utilities')) return 'premises_running_costs'
  if (classification.includes('Entertainment')) return 'business_entertainment'
  if (classification.includes('Insurance')) return 'insurance'
  if (classification.includes('Professional Services')) return 'professional_fees'
  if (classification.includes('Software')) return 'admin_costs'

  return categoryMap[category] || 'other_expenses'
}

/**
 * Get current UK tax year
 */
function getCurrentTaxYear(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const day = now.getDate()

  // Tax year starts April 6
  if (month > 4 || (month === 4 && day >= 6)) {
    return `${year}-${(year + 1).toString().slice(-2)}`
  } else {
    return `${year - 1}-${year.toString().slice(-2)}`
  }
}

/**
 * Sync all transactions for a user (business accounts only)
 */
export async function syncAllTransactions(
  userId: string,
  options?: { from?: string; to?: string }
): Promise<{ total: number; imported: number; skipped: number; errors: string[] }> {
  const supabase = await createClient()

  // First, let's see ALL accounts for debugging
  const { data: allAccounts } = await supabase
    .from('bank_accounts')
    .select('account_id, display_name, is_business_account, is_active')
    .eq('user_id', userId)

  console.log('[syncAllTransactions] All user accounts:', JSON.stringify(allAccounts, null, 2))

  // Get all active BUSINESS bank accounts only
  const { data: accounts, error: accountsError } = await supabase
    .from('bank_accounts')
    .select('account_id, connection_id, display_name, is_business_account')
    .eq('user_id', userId)
    .eq('is_active', true)
    .eq('is_business_account', true)

  console.log('[syncAllTransactions] Found business accounts:', accounts?.length || 0)

  if (accountsError) {
    console.error('[syncAllTransactions] Error fetching accounts:', accountsError)
    throw new Error('Failed to fetch accounts')
  }

  if (!accounts || accounts.length === 0) {
    console.log('[syncAllTransactions] No business accounts to sync')
    return { total: 0, imported: 0, skipped: 0, errors: [] }
  }

  let totalImported = 0
  let totalSkipped = 0
  const errors: string[] = []

  for (const account of accounts) {
    console.log(`[syncAllTransactions] Syncing account: ${account.display_name} (${account.account_id})`)

    try {
      const result = await importTransactions(userId, account.account_id, {
        from: options?.from,
        to: options?.to,
        connectionId: account.connection_id,
      })

      console.log(`[syncAllTransactions] Account ${account.display_name}: imported=${result.imported}, skipped=${result.skipped}`)
      totalImported += result.imported
      totalSkipped += result.skipped
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error'
      console.error(`[syncAllTransactions] Error syncing ${account.display_name}:`, errorMsg)
      errors.push(`${account.display_name}: ${errorMsg}`)
    }
  }

  console.log(`[syncAllTransactions] Complete: total=${totalImported + totalSkipped}, imported=${totalImported}, skipped=${totalSkipped}`)

  return {
    total: totalImported + totalSkipped,
    imported: totalImported,
    skipped: totalSkipped,
    errors,
  }
}
