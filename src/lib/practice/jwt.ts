import { createHmac } from 'crypto'

const JWT_SECRET = process.env.PRACTICE_JWT_SECRET || process.env.PRACTICE_ENCRYPTION_KEY || ''

interface AgentHandoffPayload {
  userId: string
  practiceId: string
  clientId: string
  taxYear: string
}

function base64url(input: string | Buffer): string {
  const buf = typeof input === 'string' ? Buffer.from(input) : input
  return buf.toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
}

function base64urlDecode(input: string): string {
  const padded = input + '='.repeat((4 - (input.length % 4)) % 4)
  return Buffer.from(padded.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString()
}

/**
 * Generate a short-lived JWT for SA100 cross-subdomain handoff.
 * Token is valid for 60 seconds and intended for single use.
 * Uses HMAC-SHA256 without external dependencies.
 */
export function generateAgentHandoffToken(payload: AgentHandoffPayload): string {
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))

  const now = Math.floor(Date.now() / 1000)
  const claims = base64url(JSON.stringify({
    ...payload,
    type: 'agent_handoff',
    iat: now,
    exp: now + 60,
  }))

  const signature = base64url(
    createHmac('sha256', JWT_SECRET).update(`${header}.${claims}`).digest()
  )

  return `${header}.${claims}.${signature}`
}

/**
 * Verify and decode an agent handoff JWT.
 * Returns the payload if valid, throws if expired or invalid.
 */
export function verifyAgentHandoffToken(token: string): AgentHandoffPayload {
  const parts = token.split('.')
  if (parts.length !== 3) {
    throw new Error('Invalid token format')
  }

  const [header, claims, signature] = parts

  // Verify signature
  const expectedSig = base64url(
    createHmac('sha256', JWT_SECRET).update(`${header}.${claims}`).digest()
  )

  if (signature !== expectedSig) {
    throw new Error('Invalid token signature')
  }

  // Decode and validate claims
  const payload = JSON.parse(base64urlDecode(claims))

  if (payload.type !== 'agent_handoff') {
    throw new Error('Invalid token type')
  }

  const now = Math.floor(Date.now() / 1000)
  if (payload.exp && payload.exp < now) {
    throw new Error('Token has expired')
  }

  return {
    userId: payload.userId,
    practiceId: payload.practiceId,
    clientId: payload.clientId,
    taxYear: payload.taxYear,
  }
}
