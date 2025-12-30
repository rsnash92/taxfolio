import { createClient } from '@/lib/supabase/server'
import { refreshAccessToken } from './auth'
import type { TrueLayerTokens, StoredConnection } from './types'

/**
 * Store TrueLayer tokens for a user
 */
export async function storeConnection(
  userId: string,
  tokens: TrueLayerTokens,
  bankInfo?: { bankName?: string; bankId?: string; providerId?: string }
): Promise<string> {
  const supabase = await createClient()

  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000)

  // Open Banking consent typically expires in 90 days
  const consentExpiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)

  const { data, error } = await supabase
    .from('bank_connections')
    .insert({
      user_id: userId,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      token_type: tokens.token_type,
      expires_at: expiresAt.toISOString(),
      provider: 'truelayer',
      provider_id: bankInfo?.providerId,
      bank_name: bankInfo?.bankName,
      bank_id: bankInfo?.bankId,
      status: 'active',
      scopes: tokens.scope?.split(' ') || [],
      consent_expires_at: consentExpiresAt.toISOString(),
    })
    .select()
    .single()

  if (error) throw new Error(`Failed to store connection: ${error.message}`)

  return data.id
}

/**
 * Get connection for a user
 */
export async function getConnection(
  userId: string
): Promise<StoredConnection | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('bank_connections')
    .select('*')
    .eq('user_id', userId)
    .eq('provider', 'truelayer')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error || !data) return null
  return data as StoredConnection
}

/**
 * Get all connections for a user
 */
export async function getAllConnections(
  userId: string
): Promise<StoredConnection[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('bank_connections')
    .select('*')
    .eq('user_id', userId)
    .eq('provider', 'truelayer')
    .order('created_at', { ascending: false })

  if (error) return []
  return (data || []) as StoredConnection[]
}

/**
 * Get valid access token (refreshing if needed)
 */
export async function getValidAccessToken(
  userId: string,
  connectionId?: string
): Promise<string> {
  const supabase = await createClient()

  // Get connection
  let query = supabase
    .from('bank_connections')
    .select('*')
    .eq('user_id', userId)
    .eq('provider', 'truelayer')
    .eq('status', 'active')

  if (connectionId) {
    query = query.eq('id', connectionId)
  }

  const { data: connection, error } = await query.single()

  if (error || !connection) {
    throw new Error('BANK_NOT_CONNECTED')
  }

  const expiresAt = new Date(connection.expires_at)
  const now = new Date()

  // Refresh if expires in less than 5 minutes
  if (expiresAt.getTime() - now.getTime() < 5 * 60 * 1000) {
    if (!connection.refresh_token) {
      // No refresh token, connection needs to be re-established
      await supabase
        .from('bank_connections')
        .update({ status: 'expired' })
        .eq('id', connection.id)

      throw new Error('CONNECTION_EXPIRED')
    }

    try {
      const newTokens = await refreshAccessToken(connection.refresh_token)
      const newExpiresAt = new Date(Date.now() + newTokens.expires_in * 1000)

      await supabase
        .from('bank_connections')
        .update({
          access_token: newTokens.access_token,
          refresh_token: newTokens.refresh_token || connection.refresh_token,
          expires_at: newExpiresAt.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', connection.id)

      return newTokens.access_token
    } catch (err) {
      // Refresh failed, mark as expired
      await supabase
        .from('bank_connections')
        .update({
          status: 'expired',
          error_message: err instanceof Error ? err.message : 'Refresh failed',
        })
        .eq('id', connection.id)

      throw new Error('CONNECTION_EXPIRED')
    }
  }

  return connection.access_token
}

/**
 * Update connection status
 */
export async function updateConnectionStatus(
  connectionId: string,
  status: 'active' | 'expired' | 'revoked' | 'error',
  errorMessage?: string
): Promise<void> {
  const supabase = await createClient()

  await supabase
    .from('bank_connections')
    .update({
      status,
      error_message: errorMessage,
      updated_at: new Date().toISOString(),
    })
    .eq('id', connectionId)
}

/**
 * Delete connection
 */
export async function deleteConnection(
  userId: string,
  connectionId: string
): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('bank_connections')
    .delete()
    .eq('id', connectionId)
    .eq('user_id', userId)

  if (error) throw new Error(`Failed to delete connection: ${error.message}`)
}
