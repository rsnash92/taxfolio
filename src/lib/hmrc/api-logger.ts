/**
 * HMRC API Logger
 *
 * Logs all HMRC API requests and responses for debugging and audit purposes.
 * Stores logs in Supabase for viewing in the admin/debug panel.
 */

import { createClient } from '@/lib/supabase/server'

export interface ApiLogEntry {
  id?: string
  user_id: string
  timestamp: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  endpoint: string
  request_body?: unknown
  response_status: number
  response_body?: unknown
  error_code?: string
  error_message?: string
  duration_ms: number
  correlation_id?: string
  gov_test_scenario?: string
}

export interface ApiLogFilter {
  userId?: string
  endpoint?: string
  status?: 'success' | 'error' | 'all'
  startDate?: string
  endDate?: string
  limit?: number
}

/**
 * Log an API request/response
 */
export async function logApiCall(entry: Omit<ApiLogEntry, 'id'>): Promise<void> {
  try {
    const supabase = await createClient()

    // Sanitize sensitive data before logging
    const sanitizedEntry = {
      ...entry,
      request_body: sanitizeBody(entry.request_body),
      response_body: sanitizeBody(entry.response_body),
    }

    const { error } = await supabase.from('hmrc_api_logs').insert(sanitizedEntry)

    if (error) {
      console.error('[HMRC Logger] Failed to log API call:', error)
    }
  } catch (err) {
    // Don't let logging failures affect the main flow
    console.error('[HMRC Logger] Error logging API call:', err)
  }
}

/**
 * Get API logs for a user
 */
export async function getApiLogs(filter: ApiLogFilter = {}): Promise<ApiLogEntry[]> {
  const supabase = await createClient()
  const { userId, endpoint, status, startDate, endDate, limit = 100 } = filter

  let query = supabase
    .from('hmrc_api_logs')
    .select('*')
    .order('timestamp', { ascending: false })
    .limit(limit)

  if (userId) {
    query = query.eq('user_id', userId)
  }

  if (endpoint) {
    query = query.ilike('endpoint', `%${endpoint}%`)
  }

  if (status === 'success') {
    query = query.gte('response_status', 200).lt('response_status', 300)
  } else if (status === 'error') {
    query = query.or('response_status.gte.400,error_code.not.is.null')
  }

  if (startDate) {
    query = query.gte('timestamp', startDate)
  }

  if (endDate) {
    query = query.lte('timestamp', endDate)
  }

  const { data, error } = await query

  if (error) {
    console.error('[HMRC Logger] Failed to get logs:', error)
    return []
  }

  return data || []
}

/**
 * Get error summary for a user
 */
export async function getErrorSummary(
  userId: string,
  days: number = 7
): Promise<{
  totalErrors: number
  errorsByCode: Record<string, number>
  recentErrors: ApiLogEntry[]
}> {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const logs = await getApiLogs({
    userId,
    status: 'error',
    startDate: startDate.toISOString(),
    limit: 50,
  })

  const errorsByCode: Record<string, number> = {}
  for (const log of logs) {
    const code = log.error_code || `HTTP_${log.response_status}`
    errorsByCode[code] = (errorsByCode[code] || 0) + 1
  }

  return {
    totalErrors: logs.length,
    errorsByCode,
    recentErrors: logs.slice(0, 10),
  }
}

/**
 * Clear old logs (for cleanup)
 */
export async function clearOldLogs(daysToKeep: number = 30): Promise<number> {
  const supabase = await createClient()
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)

  const { data, error } = await supabase
    .from('hmrc_api_logs')
    .delete()
    .lt('timestamp', cutoffDate.toISOString())
    .select('id')

  if (error) {
    console.error('[HMRC Logger] Failed to clear old logs:', error)
    return 0
  }

  return data?.length || 0
}

// =============================================================================
// Helpers
// =============================================================================

/**
 * Remove sensitive data from request/response bodies
 */
function sanitizeBody(body: unknown): unknown {
  if (!body || typeof body !== 'object') return body

  const sensitiveKeys = [
    'password',
    'access_token',
    'refresh_token',
    'client_secret',
    'authorization',
    'nino',
  ]

  const sanitized = { ...(body as Record<string, unknown>) }

  for (const key of Object.keys(sanitized)) {
    const lowerKey = key.toLowerCase()
    if (sensitiveKeys.some((sk) => lowerKey.includes(sk))) {
      sanitized[key] = '[REDACTED]'
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeBody(sanitized[key])
    }
  }

  return sanitized
}

/**
 * Create a logger wrapper that automatically logs requests
 */
export function createLoggingFetch(userId: string) {
  return async (
    url: string,
    options: RequestInit & { govTestScenario?: string } = {}
  ): Promise<Response> => {
    const startTime = Date.now()
    const method = (options.method || 'GET') as ApiLogEntry['method']
    const endpoint = new URL(url).pathname

    let requestBody: unknown
    if (options.body) {
      try {
        requestBody = JSON.parse(options.body as string)
      } catch {
        requestBody = options.body
      }
    }

    try {
      const response = await fetch(url, options)
      const duration = Date.now() - startTime

      let responseBody: unknown
      const clonedResponse = response.clone()
      try {
        responseBody = await clonedResponse.json()
      } catch {
        responseBody = await clonedResponse.text()
      }

      // Extract error info if present
      let errorCode: string | undefined
      let errorMessage: string | undefined
      if (!response.ok && typeof responseBody === 'object' && responseBody !== null) {
        const errBody = responseBody as Record<string, unknown>
        errorCode = errBody.code as string | undefined
        errorMessage = errBody.message as string | undefined
      }

      // Log the call
      await logApiCall({
        user_id: userId,
        timestamp: new Date().toISOString(),
        method,
        endpoint,
        request_body: requestBody,
        response_status: response.status,
        response_body: responseBody,
        error_code: errorCode,
        error_message: errorMessage,
        duration_ms: duration,
        gov_test_scenario: options.govTestScenario,
      })

      return response
    } catch (error) {
      const duration = Date.now() - startTime

      // Log the error
      await logApiCall({
        user_id: userId,
        timestamp: new Date().toISOString(),
        method,
        endpoint,
        request_body: requestBody,
        response_status: 0,
        error_code: 'NETWORK_ERROR',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        duration_ms: duration,
        gov_test_scenario: options.govTestScenario,
      })

      throw error
    }
  }
}
