import { TRUELAYER_CONFIG } from './config'
import type { TrueLayerApiResponse, TrueLayerError } from './types'

/**
 * Make authenticated request to TrueLayer Data API
 */
export async function truelayerRequest<T>(
  accessToken: string,
  endpoint: string,
  options: {
    method?: 'GET' | 'POST'
    body?: object
    params?: Record<string, string>
  } = {}
): Promise<TrueLayerApiResponse<T>> {
  const url = new URL(`${TRUELAYER_CONFIG.apiUrl}${endpoint}`)

  if (options.params) {
    Object.entries(options.params).forEach(([key, value]) => {
      url.searchParams.set(key, value)
    })
  }

  const response = await fetch(url.toString(), {
    method: options.method || 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  })

  if (!response.ok) {
    const error: TrueLayerError = await response.json().catch(() => ({
      error: 'unknown_error',
      error_description: response.statusText,
    }))

    throw new Error(
      JSON.stringify({
        status: response.status,
        ...error,
      })
    )
  }

  return response.json()
}
