import { createClient } from '@supabase/supabase-js'
import { MtdApiService, refreshToken as refreshHmrcToken } from '@/lib/mtd/api-service'
import type { FraudPreventionHeaders } from '@/types/mtd'
import { decryptNINO } from './encryption'

function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/**
 * Get a valid HMRC access token for a practice.
 * Auto-refreshes if expired.
 */
export async function getPracticeHMRCToken(practiceId: string): Promise<string> {
  const supabase = createServiceClient()

  const { data: tokenRow, error } = await supabase
    .from('practice_hmrc_tokens')
    .select('*')
    .eq('practice_id', practiceId)
    .single()

  if (error || !tokenRow) {
    throw new Error('Practice HMRC connection not found. Please connect HMRC first.')
  }

  // Check if token is still valid (with 60s buffer)
  const expiresAt = new Date(tokenRow.expires_at).getTime()
  if (Date.now() < expiresAt - 60_000) {
    return tokenRow.access_token
  }

  // Token expired — refresh it
  const newTokens = await refreshHmrcToken(tokenRow.refresh_token)

  const { error: updateError } = await supabase
    .from('practice_hmrc_tokens')
    .update({
      access_token: newTokens.accessToken,
      refresh_token: newTokens.refreshToken,
      expires_at: new Date(newTokens.expiresAt).toISOString(),
      scope: newTokens.scope,
    })
    .eq('practice_id', practiceId)

  if (updateError) {
    console.error('[Practice HMRC] Failed to update refreshed tokens:', updateError)
  }

  return newTokens.accessToken
}

/**
 * Create an MtdApiService instance for a practice client.
 * Uses the agent's token but makes requests on behalf of the client's NINO.
 */
export async function createPracticeApiService(
  practiceId: string,
  fraudHeaders?: FraudPreventionHeaders
): Promise<MtdApiService> {
  const accessToken = await getPracticeHMRCToken(practiceId)
  return new MtdApiService(accessToken, fraudHeaders)
}

/**
 * Decrypt a client's NINO from the clients table for HMRC API calls.
 */
export async function getClientNINO(clientId: string): Promise<string> {
  const supabase = createServiceClient()

  const { data: client, error } = await supabase
    .from('clients')
    .select('nino_encrypted')
    .eq('id', clientId)
    .single()

  if (error || !client?.nino_encrypted) {
    throw new Error('Client NINO not found')
  }

  return decryptNINO(client.nino_encrypted)
}

/**
 * Check if a practice has a valid HMRC connection.
 */
export async function hasPracticeHMRCConnection(practiceId: string): Promise<boolean> {
  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('practice_hmrc_tokens')
    .select('id, expires_at')
    .eq('practice_id', practiceId)
    .single()

  if (error || !data) return false

  // Has a token row — even if expired, refresh may work
  return true
}
