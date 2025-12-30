export type PartnerType = 'accountant' | 'affiliate'
export type PartnerStatus = 'pending' | 'approved' | 'rejected' | 'suspended'
export type PayoutStatus = 'pending' | 'processing' | 'paid' | 'failed'
export type ReferralStatus = 'clicked' | 'signed_up' | 'subscribed' | 'churned'
export type CommissionType = 'initial' | 'recurring' | 'lifetime'
export type CommissionStatus = 'pending' | 'approved' | 'paid' | 'refunded'

export interface Partner {
  id: string
  user_id: string | null
  type: PartnerType
  status: PartnerStatus
  company_name: string
  contact_name: string
  email: string
  phone: string | null
  website: string | null
  accounting_body: string | null
  registration_number: string | null
  referral_code: string
  commission_rate: number
  commission_recurring: boolean
  payout_email: string | null
  bank_account_name: string | null
  bank_sort_code: string | null
  bank_account_number: string | null
  payout_method: 'bank_transfer' | 'paypal'
  minimum_payout: number
  total_referrals: number
  total_conversions: number
  total_earnings: number
  pending_earnings: number
  created_at: string
  updated_at: string
  approved_at: string | null
  admin_notes: string | null
  rejection_reason: string | null
}

export interface Referral {
  id: string
  partner_id: string
  referred_user_id: string | null
  referred_email: string | null
  referral_code: string
  landing_page: string | null
  utm_source: string | null
  utm_medium: string | null
  utm_campaign: string | null
  ip_address: string | null
  user_agent: string | null
  status: ReferralStatus
  clicked_at: string
  signed_up_at: string | null
  subscribed_at: string | null
  expires_at: string
}

export interface Commission {
  id: string
  partner_id: string
  referral_id: string | null
  stripe_payment_intent_id: string | null
  stripe_invoice_id: string | null
  stripe_subscription_id: string | null
  payment_amount: number
  commission_rate: number
  commission_amount: number
  currency: string
  type: CommissionType
  status: CommissionStatus
  referred_user_id: string | null
  plan_name: string | null
  created_at: string
  approved_at: string | null
  paid_at: string | null
  payout_id: string | null
}

export interface Payout {
  id: string
  partner_id: string
  amount: number
  currency: string
  status: PayoutStatus
  payout_method: string
  payout_reference: string | null
  period_start: string
  period_end: string
  created_at: string
  processed_at: string | null
  paid_at: string | null
  notes: string | null
  failure_reason: string | null
}

export interface PartnerStats {
  totalReferrals: number
  totalConversions: number
  conversionRate: number
  totalEarnings: number
  pendingEarnings: number
  thisMonthEarnings: number
  activeUsers: number
}

export interface PartnerApplication {
  type: PartnerType
  company_name: string
  contact_name: string
  email: string
  phone?: string
  website?: string
  accounting_body?: string
  registration_number?: string
  payout_method: 'bank_transfer' | 'paypal'
  payout_email?: string
  bank_account_name?: string
  bank_sort_code?: string
  bank_account_number?: string
}
