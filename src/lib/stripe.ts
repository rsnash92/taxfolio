import Stripe from 'stripe'

// Lazy-loaded Stripe client to avoid build-time errors
let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not set')
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
  }
  return _stripe
}

// Backwards compatibility - use getStripe() in new code
export const stripe = {
  get checkout() { return getStripe().checkout },
  get customers() { return getStripe().customers },
  get subscriptions() { return getStripe().subscriptions },
  get paymentIntents() { return getStripe().paymentIntents },
  get billingPortal() { return getStripe().billingPortal },
  get webhooks() { return getStripe().webhooks },
}

export const PLANS = {
  free: {
    name: 'Free Trial',
    price: 0,
    period: null,
    limits: {
      bankConnections: 1,
      transactionsPerMonth: 100,
    },
    features: [
      'All Pro features for 30 days',
      'No credit card required',
    ],
  },
  lite: {
    name: 'Lite',
    price: 69.99,
    period: 'year',
    priceId: process.env.STRIPE_PRICE_LITE_ANNUAL || '',
    limits: {
      bankConnections: 1,
      transactionsPerMonth: 100,
    },
    features: [
      '1 bank connection',
      '100 transactions/month',
      'AI categorisation',
      'Full SA103 breakdown',
      'Basic tax summary',
    ],
    notIncluded: [
      'SA105 (Landlords)',
      'MTD quarterly breakdown',
      'Mileage tracker',
      'CSV/PDF export',
    ],
  },
  pro: {
    name: 'Pro',
    price: 129.99,
    period: 'year',
    priceId: process.env.STRIPE_PRICE_PRO_ANNUAL || '',
    limits: {
      bankConnections: Infinity,
      transactionsPerMonth: Infinity,
    },
    features: [
      'Unlimited bank connections',
      'Unlimited transactions',
      'AI categorisation',
      'Full SA103 breakdown',
      'SA105 for landlords',
      'MTD quarterly breakdown',
      'Mileage tracker',
      'CSV & PDF export',
      'Priority support',
    ],
  },
  lifetime: {
    name: 'Lifetime Pro',
    price: 49.99,
    period: 'once',
    priceId: process.env.STRIPE_PRICE_LIFETIME || '',
    limits: {
      bankConnections: Infinity,
      transactionsPerMonth: Infinity,
    },
    features: [
      'All Pro features',
      'Forever - no recurring payments',
      'Early adopter pricing',
      'Priority support',
    ],
  },
} as const

export type PlanType = keyof typeof PLANS

export const LIFETIME_DEAL_LIMIT = parseInt(process.env.LIFETIME_DEAL_LIMIT || '100')
export const LIFETIME_DEAL_ENABLED = process.env.LIFETIME_DEAL_ENABLED === 'true'
