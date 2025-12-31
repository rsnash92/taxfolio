import { createClient } from '@/lib/supabase/server'
import { PLANS, PlanType, LIFETIME_DEAL_LIMIT } from './stripe'

export interface SubscriptionInfo {
  tier: PlanType
  status: string
  isLifetime: boolean
  isTrial: boolean
  trialEndsAt: Date | null
  currentPeriodEnd: Date | null
  cancelAtPeriodEnd: boolean
  limits: {
    bankConnections: number
    transactionsPerMonth: number
  }
  daysLeftInTrial: number | null
}

export async function getSubscription(userId: string): Promise<SubscriptionInfo> {
  const supabase = await createClient()

  const { data: user } = await supabase
    .from('users')
    .select(`
      subscription_tier,
      subscription_status,
      subscription_current_period_end,
      subscription_cancel_at_period_end,
      trial_ends_at,
      is_lifetime
    `)
    .eq('id', userId)
    .single()

  const tier = (user?.subscription_tier || 'free') as PlanType
  const isLifetime = user?.is_lifetime || false
  const trialEndsAt = user?.trial_ends_at ? new Date(user.trial_ends_at) : null
  const isTrial = tier === 'free' && trialEndsAt !== null && trialEndsAt > new Date()

  // Calculate days left in trial
  let daysLeftInTrial: number | null = null
  if (isTrial && trialEndsAt) {
    const msLeft = trialEndsAt.getTime() - Date.now()
    daysLeftInTrial = Math.max(0, Math.ceil(msLeft / (1000 * 60 * 60 * 24)))
  }

  // Determine effective limits
  let limits: { bankConnections: number; transactionsPerMonth: number }
  if (isLifetime || tier === 'pro') {
    limits = { bankConnections: Infinity, transactionsPerMonth: Infinity }
  } else if (tier === 'lite' || isTrial) {
    limits = { bankConnections: 1, transactionsPerMonth: 100 } // Trial gets Lite limits
  } else {
    limits = { bankConnections: 1, transactionsPerMonth: 100 } // Default to Lite limits
  }

  return {
    tier: isLifetime ? 'lifetime' : tier,
    status: user?.subscription_status || 'none',
    isLifetime,
    isTrial,
    trialEndsAt,
    currentPeriodEnd: user?.subscription_current_period_end
      ? new Date(user.subscription_current_period_end)
      : null,
    cancelAtPeriodEnd: user?.subscription_cancel_at_period_end || false,
    limits,
    daysLeftInTrial,
  }
}

export async function checkLimit(
  userId: string,
  limitType: 'bankConnections' | 'transactionsPerMonth'
): Promise<{ allowed: boolean; current: number; limit: number }> {
  const subscription = await getSubscription(userId)
  const limit = subscription.limits[limitType]

  const supabase = await createClient()
  let current = 0

  if (limitType === 'bankConnections') {
    const { count } = await supabase
      .from('bank_connections')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
    current = count || 0
  } else if (limitType === 'transactionsPerMonth') {
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const { count } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', startOfMonth.toISOString())
    current = count || 0
  }

  return {
    allowed: limit === Infinity || current < limit,
    current,
    limit: limit === Infinity ? -1 : limit,
  }
}

export function canAccessFeature(
  tier: PlanType,
  isLifetime: boolean,
  isTrial: boolean,
  feature: string
): boolean {
  // In development, allow all features for easier testing
  if (process.env.NODE_ENV === 'development') return true

  const proFeatures = [
    'sa105',
    'mtd_quarters',
    'csv_export',
    'pdf_export',
    'mileage',
    'priority_support',
    'unlimited_banks',
    'unlimited_transactions',
  ]

  // Lifetime and Pro get everything
  if (isLifetime || tier === 'pro') return true

  // Trial can ACCESS features (view mileage, SA105, etc.)
  // but usage LIMITS are still enforced via checkLimit()
  if (isTrial) return true

  // Lite and free don't get pro features
  return !proFeatures.includes(feature)
}

export async function getLifetimeDealsRemaining(): Promise<number> {
  const supabase = await createClient()

  const { count } = await supabase
    .from('lifetime_deals')
    .select('*', { count: 'exact', head: true })

  return Math.max(0, LIFETIME_DEAL_LIMIT - (count || 0))
}

export async function startFreeTrial(userId: string): Promise<void> {
  const supabase = await createClient()

  const trialEndsAt = new Date()
  trialEndsAt.setDate(trialEndsAt.getDate() + 30)

  await supabase
    .from('users')
    .update({
      subscription_tier: 'free',
      subscription_status: 'trialing',
      trial_ends_at: trialEndsAt.toISOString(),
    })
    .eq('id', userId)
}
