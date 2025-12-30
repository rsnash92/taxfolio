import { TRUELAYER_CONFIG } from './config'
import type { TrueLayerTokens } from './types'

/**
 * Generate the authorization URL for TrueLayer
 */
export function getAuthorizationUrl(state: string, providerId?: string): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: TRUELAYER_CONFIG.clientId,
    redirect_uri: TRUELAYER_CONFIG.redirectUri,
    scope: TRUELAYER_CONFIG.scopes.join(' '),
    state: state,
  })

  // If specific provider requested (e.g., from bank selection)
  if (providerId) {
    params.set('providers', providerId)
  }

  // Enable all UK providers in sandbox
  if (TRUELAYER_CONFIG.isSandbox) {
    params.set('providers', 'uk-ob-all uk-oauth-all')
  }

  return `${TRUELAYER_CONFIG.authUrl}/?${params.toString()}`
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForTokens(
  code: string
): Promise<TrueLayerTokens> {
  const response = await fetch(`${TRUELAYER_CONFIG.authUrl}/connect/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: TRUELAYER_CONFIG.clientId,
      client_secret: TRUELAYER_CONFIG.clientSecret,
      redirect_uri: TRUELAYER_CONFIG.redirectUri,
      code: code,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(
      `Token exchange failed: ${error.error_description || error.error}`
    )
  }

  return response.json()
}

/**
 * Refresh an expired access token
 */
export async function refreshAccessToken(
  refreshToken: string
): Promise<TrueLayerTokens> {
  const response = await fetch(`${TRUELAYER_CONFIG.authUrl}/connect/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: TRUELAYER_CONFIG.clientId,
      client_secret: TRUELAYER_CONFIG.clientSecret,
      refresh_token: refreshToken,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(
      `Token refresh failed: ${error.error_description || error.error}`
    )
  }

  return response.json()
}
