import { createClient } from '@/lib/supabase/server'

export interface HMRCConnectionStatus {
  isConnected: boolean
  status: 'connected' | 'disconnected' | 'expired'
  connectedAt: string | null
  expiresAt: string | null
  needsReauth: boolean
}

/**
 * Get HMRC connection status for a user (server-side)
 */
export async function getHMRCConnectionStatus(
  userId: string
): Promise<HMRCConnectionStatus> {
  const supabase = await createClient()

  const { data: tokens } = await supabase
    .from('hmrc_tokens')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (!tokens) {
    return {
      isConnected: false,
      status: 'disconnected',
      connectedAt: null,
      expiresAt: null,
      needsReauth: false,
    }
  }

  // Check if token is expired
  const isExpired = tokens.expires_at
    ? new Date(tokens.expires_at) < new Date()
    : false

  return {
    isConnected: !isExpired,
    status: isExpired ? 'expired' : 'connected',
    connectedAt: tokens.created_at,
    expiresAt: tokens.expires_at,
    needsReauth: isExpired,
  }
}

/**
 * Check if user has HMRC connected (simple boolean, server-side)
 */
export async function checkHMRCConnected(userId: string): Promise<boolean> {
  const status = await getHMRCConnectionStatus(userId)
  return status.isConnected
}
