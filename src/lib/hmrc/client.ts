import { createClient } from '@/lib/supabase/server'
import { generateFraudHeaders, ClientInfo } from './fraud-headers'
import { HMRCTokens, StoredHMRCTokens, HMRCError } from './types'

const HMRC_BASE_URL = process.env.HMRC_API_BASE_URL || 'https://test-api.service.hmrc.gov.uk'
const HMRC_CLIENT_ID = process.env.HMRC_CLIENT_ID!
const HMRC_CLIENT_SECRET = process.env.HMRC_CLIENT_SECRET!

/**
 * Get stored HMRC tokens for a user
 */
export async function getHMRCTokens(userId: string): Promise<StoredHMRCTokens | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('hmrc_tokens')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error || !data) return null
  return data
}

/**
 * Store HMRC tokens for a user
 */
export async function storeHMRCTokens(userId: string, tokens: HMRCTokens): Promise<void> {
  const supabase = await createClient()

  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString()

  const { error } = await supabase.from('hmrc_tokens').upsert(
    {
      user_id: userId,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      token_type: tokens.token_type,
      expires_at: expiresAt,
      scope: tokens.scope,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: 'user_id',
    }
  )

  if (error) throw new Error(`Failed to store tokens: ${error.message}`)
}

/**
 * Refresh expired tokens
 */
export async function refreshHMRCTokens(refreshToken: string): Promise<HMRCTokens> {
  const response = await fetch(`${HMRC_BASE_URL}/oauth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: HMRC_CLIENT_ID,
      client_secret: HMRC_CLIENT_SECRET,
      refresh_token: refreshToken,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Token refresh failed: ${error.error_description || error.error}`)
  }

  return response.json()
}

/**
 * Get valid access token (refreshing if needed)
 */
export async function getValidAccessToken(userId: string): Promise<string> {
  const tokens = await getHMRCTokens(userId)

  if (!tokens) {
    throw new Error('HMRC_NOT_CONNECTED')
  }

  const expiresAt = new Date(tokens.expires_at)
  const now = new Date()

  // Refresh if expires in less than 5 minutes
  if (expiresAt.getTime() - now.getTime() < 5 * 60 * 1000) {
    const newTokens = await refreshHMRCTokens(tokens.refresh_token)
    await storeHMRCTokens(userId, newTokens)
    return newTokens.access_token
  }

  return tokens.access_token
}

/**
 * Delete HMRC connection
 */
export async function disconnectHMRC(userId: string): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase.from('hmrc_tokens').delete().eq('user_id', userId)

  if (error) throw new Error(`Failed to disconnect: ${error.message}`)
}

/**
 * Check if user has valid HMRC connection
 */
export async function isHMRCConnected(userId: string): Promise<boolean> {
  try {
    await getValidAccessToken(userId)
    return true
  } catch {
    return false
  }
}

/**
 * Make authenticated request to HMRC API
 */
export async function hmrcRequest<T>(
  userId: string,
  endpoint: string,
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
    body?: object
    clientInfo?: ClientInfo
  } = {}
): Promise<T> {
  const accessToken = await getValidAccessToken(userId)
  const fraudHeaders = generateFraudHeaders(userId, options.clientInfo)

  const response = await fetch(`${HMRC_BASE_URL}${endpoint}`, {
    method: options.method || 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/vnd.hmrc.2.0+json',
      'Content-Type': 'application/json',
      ...fraudHeaders,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  })

  if (!response.ok) {
    const error: HMRCError = await response.json().catch(() => ({
      code: 'UNKNOWN',
      message: response.statusText,
    }))

    throw new Error(
      JSON.stringify({
        status: response.status,
        ...error,
      })
    )
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return {} as T
  }

  return response.json()
}
