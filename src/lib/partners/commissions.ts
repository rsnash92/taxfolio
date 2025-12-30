import { createClient } from '@/lib/supabase/server'
import type { PartnerType, CommissionType } from './types'

// Commission rates configuration
export const COMMISSION_RATES = {
  accountant: {
    rate: 60, // 60%
    recurring: true, // Earns on every payment
  },
  affiliate: {
    rate: 25, // 25%
    recurring: false, // First payment only
  },
} as const

// Plan prices
export const PLAN_PRICES = {
  lite: 49.99,
  pro: 89.99,
  lifetime: 149.99,
} as const

/**
 * Calculate commission for a payment
 */
export function calculateCommission(
  partnerType: PartnerType,
  planName: string,
  paymentAmount: number,
  isRecurring: boolean = false
): { amount: number; rate: number; eligible: boolean } {
  const config = COMMISSION_RATES[partnerType]

  // Affiliates only earn on first payment
  if (partnerType === 'affiliate' && isRecurring) {
    return { amount: 0, rate: config.rate, eligible: false }
  }

  const commissionAmount = (paymentAmount * config.rate) / 100

  return {
    amount: Math.round(commissionAmount * 100) / 100,
    rate: config.rate,
    eligible: true,
  }
}

/**
 * Create commission record when payment is made
 */
export async function createCommission(
  partnerId: string,
  referralId: string | null,
  stripePaymentIntentId: string,
  paymentAmount: number,
  planName: string,
  isRecurring: boolean,
  userId: string
): Promise<void> {
  const supabase = await createClient()

  // Get partner details
  const { data: partner } = await supabase
    .from('partners')
    .select('type, commission_rate, commission_recurring')
    .eq('id', partnerId)
    .single()

  if (!partner) return

  // Check eligibility
  const partnerType = partner.type as PartnerType
  const commission = calculateCommission(partnerType, planName, paymentAmount, isRecurring)

  if (!commission.eligible) return

  // Determine commission type
  let commissionType: CommissionType = 'initial'
  if (isRecurring) {
    commissionType = 'recurring'
  } else if (planName === 'lifetime') {
    commissionType = 'lifetime'
  }

  // Create commission record
  const { error } = await supabase.from('commissions').insert({
    partner_id: partnerId,
    referral_id: referralId,
    stripe_payment_intent_id: stripePaymentIntentId,
    payment_amount: paymentAmount,
    commission_rate: commission.rate,
    commission_amount: commission.amount,
    type: commissionType,
    status: 'pending',
    referred_user_id: userId,
    plan_name: planName,
  })

  if (error) {
    console.error('Failed to create commission:', error)
    return
  }

  // Update partner pending earnings
  await supabase.rpc('increment_partner_pending_earnings', {
    p_partner_id: partnerId,
    p_amount: commission.amount,
  })
}

/**
 * Handle refund - reverse commission
 */
export async function handleCommissionRefund(stripePaymentIntentId: string): Promise<void> {
  const supabase = await createClient()

  // Find the commission
  const { data: commission } = await supabase
    .from('commissions')
    .select('*')
    .eq('stripe_payment_intent_id', stripePaymentIntentId)
    .single()

  if (!commission) return

  // Mark as refunded
  await supabase
    .from('commissions')
    .update({ status: 'refunded' })
    .eq('id', commission.id)

  // Deduct from pending earnings
  await supabase.rpc('decrement_partner_pending_earnings', {
    p_partner_id: commission.partner_id,
    p_amount: commission.commission_amount,
  })
}

/**
 * Get commission breakdown for display
 */
export function getCommissionBreakdown(partnerType: PartnerType) {
  const config = COMMISSION_RATES[partnerType]

  return {
    lite: {
      price: PLAN_PRICES.lite,
      commission: (PLAN_PRICES.lite * config.rate) / 100,
    },
    pro: {
      price: PLAN_PRICES.pro,
      commission: (PLAN_PRICES.pro * config.rate) / 100,
    },
    lifetime: {
      price: PLAN_PRICES.lifetime,
      commission: (PLAN_PRICES.lifetime * config.rate) / 100,
    },
  }
}
