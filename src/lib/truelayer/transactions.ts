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
 * Import transactions into TaxFolio database
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

  let imported = 0
  let skipped = 0

  // Get bank account details
  const { data: bankAccount } = await supabase
    .from('bank_accounts')
    .select('id, display_name')
    .eq('account_id', accountId)
    .eq('user_id', userId)
    .single()

  for (const tx of transactions) {
    // Check if already imported
    const { data: existing } = await supabase
      .from('transactions')
      .select('id')
      .eq('user_id', userId)
      .eq('external_id', tx.transaction_id)
      .single()

    if (existing) {
      skipped++
      continue
    }

    // Determine if income or expense
    const isIncome = tx.transaction_type === 'CREDIT'

    // Map TrueLayer category to TaxFolio category
    const category = mapTrueLayerCategory(
      tx.transaction_category,
      tx.transaction_classification
    )

    // Insert transaction
    const { error } = await supabase.from('transactions').insert({
      user_id: userId,
      external_id: tx.transaction_id,
      date: tx.timestamp.split('T')[0],
      description: tx.description,
      amount: Math.abs(tx.amount),
      type: isIncome ? 'income' : 'expense',
      category: category,
      merchant_name: tx.merchant_name,
      source: 'truelayer',
      source_account: bankAccount?.display_name,
      bank_account_id: bankAccount?.id,
      raw_data: tx,
      tax_year: options?.taxYear || getCurrentTaxYear(),
      needs_review: true,
    })

    if (!error) {
      imported++
    }
  }

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

  // Get all active BUSINESS bank accounts only
  const { data: accounts, error: accountsError } = await supabase
    .from('bank_accounts')
    .select('account_id, connection_id, display_name, is_business_account')
    .eq('user_id', userId)
    .eq('is_active', true)
    .eq('is_business_account', true)

  console.log('[syncAllTransactions] Found accounts:', accounts?.length || 0)

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
