/**
 * Loops Email Client
 * https://loops.so - Transactional and marketing emails for SaaS
 */

const LOOPS_API_KEY = process.env.LOOPS_API_KEY
const LOOPS_API_URL = 'https://app.loops.so/api/v1'

export interface LoopsContact {
  email: string
  firstName?: string
  lastName?: string
  userId?: string
  userGroup?: string
  subscribed?: boolean
  // Custom properties - must be created in Loops dashboard first
  plan?: string
  trialEndsAt?: string
  bankConnected?: boolean
  transactionCount?: number
  signupSource?: string
  referralCode?: string
  userType?: string
}

interface SendEventOptions {
  email?: string
  userId?: string
  eventName: string
  eventProperties?: Record<string, unknown>
  mailingLists?: Record<string, boolean>
}

interface SendTransactionalOptions {
  email: string
  transactionalId: string
  dataVariables?: Record<string, unknown>
  addToAudience?: boolean
}

/**
 * Check if Loops is configured
 */
export function isLoopsConfigured(): boolean {
  return !!LOOPS_API_KEY
}

/**
 * Create or update a contact in Loops
 */
export async function createContact(
  contact: LoopsContact
): Promise<{ success: boolean; id?: string }> {
  if (!LOOPS_API_KEY) {
    console.warn('[loops] API key not configured, skipping createContact')
    return { success: false }
  }

  try {
    const response = await fetch(`${LOOPS_API_URL}/contacts/create`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOOPS_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(contact),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('[loops] Create contact error:', error)
      return { success: false }
    }

    return response.json()
  } catch (error) {
    console.error('[loops] Create contact failed:', error)
    return { success: false }
  }
}

/**
 * Update an existing contact
 */
export async function updateContact(
  email: string,
  updates: Partial<LoopsContact>
): Promise<{ success: boolean }> {
  if (!LOOPS_API_KEY) {
    console.warn('[loops] API key not configured, skipping updateContact')
    return { success: false }
  }

  try {
    const response = await fetch(`${LOOPS_API_URL}/contacts/update`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${LOOPS_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, ...updates }),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('[loops] Update contact error:', error)
      return { success: false }
    }

    return response.json()
  } catch (error) {
    console.error('[loops] Update contact failed:', error)
    return { success: false }
  }
}

/**
 * Delete a contact (for GDPR compliance)
 */
export async function deleteContact(
  email: string
): Promise<{ success: boolean }> {
  if (!LOOPS_API_KEY) {
    console.warn('[loops] API key not configured, skipping deleteContact')
    return { success: false }
  }

  try {
    const response = await fetch(`${LOOPS_API_URL}/contacts/delete`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOOPS_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('[loops] Delete contact error:', error)
      return { success: false }
    }

    return response.json()
  } catch (error) {
    console.error('[loops] Delete contact failed:', error)
    return { success: false }
  }
}

/**
 * Send an event to trigger automations
 */
export async function sendEvent(
  options: SendEventOptions
): Promise<{ success: boolean }> {
  if (!LOOPS_API_KEY) {
    console.warn('[loops] API key not configured, skipping sendEvent')
    return { success: false }
  }

  try {
    const response = await fetch(`${LOOPS_API_URL}/events/send`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOOPS_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(options),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('[loops] Send event error:', error)
      return { success: false }
    }

    return response.json()
  } catch (error) {
    console.error('[loops] Send event failed:', error)
    return { success: false }
  }
}

/**
 * Send a transactional email
 */
export async function sendTransactionalEmail(
  options: SendTransactionalOptions
): Promise<{ success: boolean }> {
  if (!LOOPS_API_KEY) {
    console.warn('[loops] API key not configured, skipping transactional email')
    return { success: false }
  }

  try {
    const response = await fetch(`${LOOPS_API_URL}/transactional`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOOPS_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(options),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('[loops] Transactional email error:', error)
      return { success: false }
    }

    return response.json()
  } catch (error) {
    console.error('[loops] Transactional email failed:', error)
    return { success: false }
  }
}

/**
 * Find a contact by email
 */
export async function findContact(
  email: string
): Promise<LoopsContact | null> {
  if (!LOOPS_API_KEY) {
    console.warn('[loops] API key not configured, skipping findContact')
    return null
  }

  try {
    const response = await fetch(
      `${LOOPS_API_URL}/contacts/find?email=${encodeURIComponent(email)}`,
      {
        headers: {
          Authorization: `Bearer ${LOOPS_API_KEY}`,
        },
      }
    )

    if (!response.ok) {
      if (response.status === 404) return null
      const error = await response.json()
      console.error('[loops] Find contact error:', error)
      return null
    }

    const data = await response.json()
    return data[0] || null
  } catch (error) {
    console.error('[loops] Find contact failed:', error)
    return null
  }
}
