import { createClient } from '@/lib/supabase/client'

/**
 * Check if user has MFA enabled
 */
export async function getMFAStatus() {
  const supabase = createClient()

  const { data, error } = await supabase.auth.mfa.listFactors()

  if (error) {
    console.error('Error checking MFA status:', error)
    return { enabled: false, factors: [] }
  }

  const totp = data.totp || []
  const verified = totp.filter(factor => factor.status === 'verified')

  return {
    enabled: verified.length > 0,
    factors: verified,
  }
}

/**
 * Start MFA enrollment - returns QR code and secret
 */
export async function enrollMFA() {
  const supabase = createClient()

  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: 'totp',
    friendlyName: 'TaxFolio Authenticator',
  })

  if (error) {
    throw new Error(error.message)
  }

  return {
    factorId: data.id,
    qrCode: data.totp.qr_code,
    secret: data.totp.secret,
    uri: data.totp.uri,
  }
}

/**
 * Verify MFA enrollment with code from authenticator app
 */
export async function verifyMFAEnrollment(factorId: string, code: string) {
  const supabase = createClient()

  const { data: challengeData, error: challengeError } =
    await supabase.auth.mfa.challenge({ factorId })

  if (challengeError) {
    throw new Error(challengeError.message)
  }

  const { data, error } = await supabase.auth.mfa.verify({
    factorId,
    challengeId: challengeData.id,
    code,
  })

  if (error) {
    throw new Error(error.message)
  }

  return data
}

/**
 * Verify MFA code during login
 */
export async function verifyMFALogin(factorId: string, code: string) {
  const supabase = createClient()

  const { data: challengeData, error: challengeError } =
    await supabase.auth.mfa.challenge({ factorId })

  if (challengeError) {
    throw new Error(challengeError.message)
  }

  const { data, error } = await supabase.auth.mfa.verify({
    factorId,
    challengeId: challengeData.id,
    code,
  })

  if (error) {
    throw new Error(error.message)
  }

  return data
}

/**
 * Disable MFA (unenroll factor)
 */
export async function disableMFA(factorId: string) {
  const supabase = createClient()

  const { error } = await supabase.auth.mfa.unenroll({
    factorId,
  })

  if (error) {
    throw new Error(error.message)
  }

  return true
}

/**
 * Get current MFA challenge status (for login flow)
 */
export async function getAuthenticatorAssuranceLevel() {
  const supabase = createClient()

  const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()

  if (error) {
    console.error('Error getting AAL:', error)
    return null
  }

  return data
}
