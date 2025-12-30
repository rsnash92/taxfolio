import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

const REFERRAL_COOKIE = 'taxfolio_ref'
const ATTRIBUTION_WINDOW_DAYS = 30

interface TrackClickMetadata {
  landingPage?: string
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
  ipAddress?: string
  userAgent?: string
}

/**
 * Track a referral click
 */
export async function trackReferralClick(
  referralCode: string,
  metadata: TrackClickMetadata
): Promise<{ success: boolean; partnerId?: string }> {
  const supabase = await createClient()

  // Find partner by referral code
  const { data: partner } = await supabase
    .from('partners')
    .select('id, status')
    .eq('referral_code', referralCode.toUpperCase())
    .single()

  if (!partner || partner.status !== 'approved') {
    return { success: false }
  }

  // Create referral record
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + ATTRIBUTION_WINDOW_DAYS)

  const { error } = await supabase.from('referrals').insert({
    partner_id: partner.id,
    referral_code: referralCode.toUpperCase(),
    landing_page: metadata.landingPage,
    utm_source: metadata.utmSource,
    utm_medium: metadata.utmMedium,
    utm_campaign: metadata.utmCampaign,
    ip_address: metadata.ipAddress,
    user_agent: metadata.userAgent,
    status: 'clicked',
    expires_at: expiresAt.toISOString(),
  })

  if (error) {
    console.error('Failed to track referral:', error)
    return { success: false }
  }

  // Update partner stats
  await supabase.rpc('increment_partner_referrals', {
    p_partner_id: partner.id,
  })

  return { success: true, partnerId: partner.id }
}

/**
 * Set referral cookie
 */
export async function setReferralCookie(referralCode: string): Promise<void> {
  const cookieStore = await cookies()
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + ATTRIBUTION_WINDOW_DAYS)

  cookieStore.set(REFERRAL_COOKIE, referralCode.toUpperCase(), {
    expires: expiresAt,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  })
}

/**
 * Get referral code from cookie
 */
export async function getReferralCode(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get(REFERRAL_COOKIE)?.value || null
}

/**
 * Clear referral cookie
 */
export async function clearReferralCookie(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(REFERRAL_COOKIE)
}

/**
 * Attribute signup to partner
 */
export async function attributeSignup(
  userId: string,
  email: string,
  referralCode?: string
): Promise<{ partnerId?: string; partnerName?: string }> {
  const supabase = await createClient()

  // Use provided code or get from cookie
  const code = referralCode || (await getReferralCode())
  if (!code) return {}

  // Find partner
  const { data: partner } = await supabase
    .from('partners')
    .select('id, company_name')
    .eq('referral_code', code.toUpperCase())
    .eq('status', 'approved')
    .single()

  if (!partner) return {}

  // Update user with partner reference
  await supabase
    .from('users')
    .update({
      referred_by_partner_id: partner.id,
      referral_code_used: code.toUpperCase(),
    })
    .eq('id', userId)

  // Update referral record
  await supabase
    .from('referrals')
    .update({
      referred_user_id: userId,
      referred_email: email,
      status: 'signed_up',
      signed_up_at: new Date().toISOString(),
    })
    .eq('referral_code', code.toUpperCase())
    .eq('status', 'clicked')
    .order('clicked_at', { ascending: false })
    .limit(1)

  // Clear cookie after attribution
  await clearReferralCookie()

  return { partnerId: partner.id, partnerName: partner.company_name }
}

/**
 * Attribute subscription to partner (when user subscribes)
 */
export async function attributeSubscription(
  userId: string
): Promise<{ partnerId?: string }> {
  const supabase = await createClient()

  // Get user's partner reference
  const { data: user } = await supabase
    .from('users')
    .select('referred_by_partner_id')
    .eq('id', userId)
    .single()

  if (!user?.referred_by_partner_id) return {}

  // Update referral status
  await supabase
    .from('referrals')
    .update({
      status: 'subscribed',
      subscribed_at: new Date().toISOString(),
    })
    .eq('referred_user_id', userId)
    .eq('status', 'signed_up')

  // Update partner conversion count
  await supabase.rpc('increment_partner_conversions', {
    p_partner_id: user.referred_by_partner_id,
  })

  return { partnerId: user.referred_by_partner_id }
}

/**
 * Get partner by referral code (for public lookups)
 */
export async function getPartnerByReferralCode(
  code: string
): Promise<{ id: string; company_name: string; type: string } | null> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('partners')
    .select('id, company_name, type')
    .eq('referral_code', code.toUpperCase())
    .eq('status', 'approved')
    .single()

  return data
}
