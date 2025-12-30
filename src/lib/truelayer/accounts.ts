import { createClient } from '@/lib/supabase/server'
import { truelayerRequest } from './client'
import { getValidAccessToken } from './tokens'
import type { TrueLayerAccount, TrueLayerBalance, BankAccount } from './types'

/**
 * Get all accounts from TrueLayer
 */
export async function getAccounts(
  userId: string,
  connectionId?: string
): Promise<TrueLayerAccount[]> {
  const accessToken = await getValidAccessToken(userId, connectionId)

  const response = await truelayerRequest<TrueLayerAccount>(
    accessToken,
    '/data/v1/accounts'
  )

  return response.results
}

/**
 * Get balance for an account
 */
export async function getAccountBalance(
  userId: string,
  accountId: string,
  connectionId?: string
): Promise<TrueLayerBalance> {
  const accessToken = await getValidAccessToken(userId, connectionId)

  const response = await truelayerRequest<TrueLayerBalance>(
    accessToken,
    `/data/v1/accounts/${accountId}/balance`
  )

  return response.results[0]
}

/**
 * Sync accounts to database
 */
export async function syncAccounts(
  userId: string,
  connectionId: string
): Promise<{ synced: number; accounts: BankAccount[] }> {
  const supabase = await createClient()

  // Fetch accounts from TrueLayer
  const accounts = await getAccounts(userId, connectionId)

  const syncedAccounts: BankAccount[] = []

  for (const account of accounts) {
    // Get balance
    let balance: TrueLayerBalance | null = null
    try {
      balance = await getAccountBalance(userId, account.account_id, connectionId)
    } catch (err) {
      console.error(`Failed to get balance for ${account.account_id}:`, err)
    }

    // Upsert account
    const { data, error } = await supabase
      .from('bank_accounts')
      .upsert(
        {
          connection_id: connectionId,
          user_id: userId,
          account_id: account.account_id,
          account_type: account.account_type,
          display_name: account.display_name,
          currency: account.currency,
          sort_code: account.account_number?.sort_code,
          account_number_last4: account.account_number?.number?.slice(-4),
          current_balance: balance?.current,
          available_balance: balance?.available,
          balance_updated_at: balance ? new Date().toISOString() : null,
          is_active: true,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'connection_id,account_id',
        }
      )
      .select()
      .single()

    if (!error && data) {
      syncedAccounts.push(data as BankAccount)
    }
  }

  // Update connection bank name from first account's provider
  if (accounts.length > 0 && accounts[0].provider) {
    await supabase
      .from('bank_connections')
      .update({
        bank_name: accounts[0].provider.display_name,
        bank_id: accounts[0].provider.provider_id,
        last_synced_at: new Date().toISOString(),
      })
      .eq('id', connectionId)
  }

  return { synced: syncedAccounts.length, accounts: syncedAccounts }
}

/**
 * Get synced accounts from database
 */
export async function getSyncedAccounts(userId: string): Promise<BankAccount[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('bank_accounts')
    .select(
      `
      *,
      connection:bank_connections(bank_name, status)
    `
    )
    .eq('user_id', userId)
    .eq('is_active', true)

  if (error) return []
  return (data || []) as BankAccount[]
}
