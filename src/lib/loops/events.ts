/**
 * Loops Event Tracking
 * Track user actions to trigger email sequences and automations
 */

import { sendEvent, updateContact, createContact } from './client'

/**
 * TaxFolio event names - must match Loops dashboard
 */
export const EVENTS = {
  // Onboarding
  SIGNUP: 'signup',
  ONBOARDING_COMPLETED: 'onboarding_completed',
  BANK_CONNECTED: 'bank_connected',
  FIRST_TRANSACTION: 'first_transaction',
  FIRST_CATEGORISATION: 'first_categorisation',

  // Engagement
  TAX_SUMMARY_VIEWED: 'tax_summary_viewed',
  EXPORT_CREATED: 'export_created',
  AI_CHAT_USED: 'ai_chat_used',

  // Trial & Subscription
  TRIAL_STARTED: 'trial_started',
  TRIAL_ENDING_SOON: 'trial_ending_soon', // 3-5 days left
  TRIAL_ENDED: 'trial_ended',
  SUBSCRIPTION_STARTED: 'subscription_started',
  SUBSCRIPTION_CANCELLED: 'subscription_cancelled',
  PAYMENT_FAILED: 'payment_failed',

  // Re-engagement
  INACTIVE_7_DAYS: 'inactive_7_days',
  INACTIVE_30_DAYS: 'inactive_30_days',
} as const

export type EventName = (typeof EVENTS)[keyof typeof EVENTS]

/**
 * Track user signup - creates contact and triggers welcome sequence
 */
export async function trackSignup(
  email: string,
  userId: string,
  metadata?: {
    firstName?: string
    lastName?: string
    signupSource?: string
    referralCode?: string
    userType?: string
  }
): Promise<void> {
  // Calculate trial end date (30 days from now)
  const trialEndsAt = new Date()
  trialEndsAt.setDate(trialEndsAt.getDate() + 30)

  // Create contact in Loops
  await createContact({
    email,
    firstName: metadata?.firstName,
    lastName: metadata?.lastName,
    userId,
    userGroup: 'users',
    subscribed: true,
    plan: 'trial',
    trialEndsAt: trialEndsAt.toISOString(),
    bankConnected: false,
    transactionCount: 0,
    signupSource: metadata?.signupSource,
    referralCode: metadata?.referralCode,
    userType: metadata?.userType,
  })

  // Send signup event to trigger welcome sequence
  await sendEvent({
    email,
    userId,
    eventName: EVENTS.SIGNUP,
    eventProperties: {
      signupDate: new Date().toISOString(),
      firstName: metadata?.firstName || '',
      userType: metadata?.userType || 'sole_trader',
    },
  })
}

/**
 * Track onboarding completed
 */
export async function trackOnboardingCompleted(
  email: string,
  userId: string,
  userType: string
): Promise<void> {
  await updateContact(email, { userType })

  await sendEvent({
    email,
    userId,
    eventName: EVENTS.ONBOARDING_COMPLETED,
    eventProperties: {
      userType,
      completedAt: new Date().toISOString(),
    },
  })
}

/**
 * Track bank connection
 */
export async function trackBankConnected(
  email: string,
  userId: string,
  bankName: string,
  accountCount: number
): Promise<void> {
  // Update contact property
  await updateContact(email, { bankConnected: true })

  // Send event
  await sendEvent({
    email,
    userId,
    eventName: EVENTS.BANK_CONNECTED,
    eventProperties: {
      bankName,
      accountCount,
      connectedAt: new Date().toISOString(),
    },
  })
}

/**
 * Track first transaction imported
 */
export async function trackFirstTransaction(
  email: string,
  userId: string,
  transactionCount: number
): Promise<void> {
  await updateContact(email, { transactionCount })

  await sendEvent({
    email,
    userId,
    eventName: EVENTS.FIRST_TRANSACTION,
    eventProperties: {
      transactionCount,
      importedAt: new Date().toISOString(),
    },
  })
}

/**
 * Track first AI categorisation
 */
export async function trackFirstCategorisation(
  email: string,
  userId: string,
  categorisedCount: number
): Promise<void> {
  await sendEvent({
    email,
    userId,
    eventName: EVENTS.FIRST_CATEGORISATION,
    eventProperties: {
      categorisedCount,
      categorisedAt: new Date().toISOString(),
    },
  })
}

/**
 * Track trial started (called when user first signs up)
 */
export async function trackTrialStarted(
  email: string,
  userId: string,
  trialEndsAt: Date
): Promise<void> {
  await updateContact(email, {
    trialEndsAt: trialEndsAt.toISOString(),
    plan: 'trial',
  })

  await sendEvent({
    email,
    userId,
    eventName: EVENTS.TRIAL_STARTED,
    eventProperties: {
      trialEndsAt: trialEndsAt.toISOString(),
      trialDays: 30,
    },
  })
}

/**
 * Track trial ending soon (call from cron job 3-5 days before end)
 */
export async function trackTrialEndingSoon(
  email: string,
  userId: string,
  daysLeft: number
): Promise<void> {
  await sendEvent({
    email,
    userId,
    eventName: EVENTS.TRIAL_ENDING_SOON,
    eventProperties: {
      daysLeft,
    },
  })
}

/**
 * Track trial ended
 */
export async function trackTrialEnded(
  email: string,
  userId: string
): Promise<void> {
  await sendEvent({
    email,
    userId,
    eventName: EVENTS.TRIAL_ENDED,
    eventProperties: {
      endedAt: new Date().toISOString(),
    },
  })
}

/**
 * Track subscription started
 */
export async function trackSubscriptionStarted(
  email: string,
  userId: string,
  plan: 'lite' | 'pro' | 'lifetime'
): Promise<void> {
  await updateContact(email, { plan })

  await sendEvent({
    email,
    userId,
    eventName: EVENTS.SUBSCRIPTION_STARTED,
    eventProperties: {
      plan,
      subscribedAt: new Date().toISOString(),
    },
  })
}

/**
 * Track subscription cancelled
 */
export async function trackSubscriptionCancelled(
  email: string,
  userId: string,
  reason?: string
): Promise<void> {
  await sendEvent({
    email,
    userId,
    eventName: EVENTS.SUBSCRIPTION_CANCELLED,
    eventProperties: {
      cancelledAt: new Date().toISOString(),
      reason,
    },
  })
}

/**
 * Track payment failed
 */
export async function trackPaymentFailed(
  email: string,
  userId: string,
  amount: string
): Promise<void> {
  await sendEvent({
    email,
    userId,
    eventName: EVENTS.PAYMENT_FAILED,
    eventProperties: {
      amount,
      failedAt: new Date().toISOString(),
    },
  })
}

/**
 * Track export created
 */
export async function trackExportCreated(
  email: string,
  userId: string,
  exportType: 'pdf' | 'csv' | 'accountant'
): Promise<void> {
  await sendEvent({
    email,
    userId,
    eventName: EVENTS.EXPORT_CREATED,
    eventProperties: {
      exportType,
      createdAt: new Date().toISOString(),
    },
  })
}

/**
 * Update transaction count for a contact
 */
export async function updateTransactionCount(
  email: string,
  transactionCount: number
): Promise<void> {
  await updateContact(email, { transactionCount })
}
