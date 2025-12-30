import { hmrcRequest } from './client'
import { ObligationsResponse } from './types'

/**
 * Get all obligations (deadlines) for a user
 */
export async function getObligations(
  userId: string,
  nino: string,
  params?: {
    from?: string // YYYY-MM-DD
    to?: string
    status?: 'Open' | 'Fulfilled'
  }
): Promise<ObligationsResponse> {
  const queryParams = new URLSearchParams()
  if (params?.from) queryParams.set('from', params.from)
  if (params?.to) queryParams.set('to', params.to)
  if (params?.status) queryParams.set('status', params.status)

  const query = queryParams.toString()
  const endpoint = `/individuals/business/obligations/${nino}${query ? `?${query}` : ''}`

  return hmrcRequest(userId, endpoint)
}

/**
 * Get open obligations (what needs to be submitted)
 */
export async function getOpenObligations(
  userId: string,
  nino: string
): Promise<ObligationsResponse> {
  return getObligations(userId, nino, { status: 'Open' })
}
