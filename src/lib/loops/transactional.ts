/**
 * Loops Transactional Emails
 * One-off emails triggered by specific actions
 *
 * IMPORTANT: You must create these templates in the Loops dashboard first,
 * then update the TRANSACTIONAL_IDS with the actual IDs from Loops.
 */

import { sendTransactionalEmail } from './client'

/**
 * Transactional email IDs from Loops dashboard
 * Replace these with actual IDs after creating templates in Loops
 */
const TRANSACTIONAL_IDS = {
  WELCOME: process.env.LOOPS_WELCOME_EMAIL_ID || '',
  PASSWORD_RESET: process.env.LOOPS_PASSWORD_RESET_EMAIL_ID || '',
  EMAIL_VERIFICATION: process.env.LOOPS_EMAIL_VERIFICATION_ID || '',
  PAYMENT_RECEIPT: process.env.LOOPS_PAYMENT_RECEIPT_ID || '',
  SUBSCRIPTION_CONFIRMED: process.env.LOOPS_SUBSCRIPTION_CONFIRMED_ID || '',
  SUBSCRIPTION_CANCELLED: process.env.LOOPS_SUBSCRIPTION_CANCELLED_ID || '',
  TRIAL_ENDING: process.env.LOOPS_TRIAL_ENDING_ID || '',
  PAYMENT_FAILED: process.env.LOOPS_PAYMENT_FAILED_ID || '',
}

/**
 * Send welcome email (immediate, not part of sequence)
 */
export async function sendWelcomeEmail(
  email: string,
  firstName: string
): Promise<void> {
  if (!TRANSACTIONAL_IDS.WELCOME) {
    console.warn('[loops] Welcome email ID not configured')
    return
  }

  await sendTransactionalEmail({
    email,
    transactionalId: TRANSACTIONAL_IDS.WELCOME,
    dataVariables: {
      firstName: firstName || 'there',
      loginUrl: 'https://app.taxfolio.io/login',
      dashboardUrl: 'https://app.taxfolio.io/dashboard',
      supportEmail: 'support@taxfolio.io',
    },
  })
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  email: string,
  resetUrl: string
): Promise<void> {
  if (!TRANSACTIONAL_IDS.PASSWORD_RESET) {
    console.warn('[loops] Password reset email ID not configured')
    return
  }

  await sendTransactionalEmail({
    email,
    transactionalId: TRANSACTIONAL_IDS.PASSWORD_RESET,
    dataVariables: {
      resetUrl,
      expiresIn: '1 hour',
    },
  })
}

/**
 * Send email verification
 */
export async function sendEmailVerification(
  email: string,
  verifyUrl: string
): Promise<void> {
  if (!TRANSACTIONAL_IDS.EMAIL_VERIFICATION) {
    console.warn('[loops] Email verification ID not configured')
    return
  }

  await sendTransactionalEmail({
    email,
    transactionalId: TRANSACTIONAL_IDS.EMAIL_VERIFICATION,
    dataVariables: {
      verifyUrl,
    },
  })
}

/**
 * Send payment receipt
 */
export async function sendPaymentReceipt(
  email: string,
  data: {
    firstName: string
    amount: string
    plan: string
    date: string
    invoiceUrl?: string
  }
): Promise<void> {
  if (!TRANSACTIONAL_IDS.PAYMENT_RECEIPT) {
    console.warn('[loops] Payment receipt email ID not configured')
    return
  }

  await sendTransactionalEmail({
    email,
    transactionalId: TRANSACTIONAL_IDS.PAYMENT_RECEIPT,
    dataVariables: {
      firstName: data.firstName || 'Customer',
      amount: data.amount,
      plan: data.plan,
      date: data.date,
      invoiceUrl: data.invoiceUrl || '',
    },
  })
}

/**
 * Send subscription confirmed email
 */
export async function sendSubscriptionConfirmed(
  email: string,
  data: {
    firstName: string
    plan: string
    amount: string
    nextBillingDate?: string
  }
): Promise<void> {
  if (!TRANSACTIONAL_IDS.SUBSCRIPTION_CONFIRMED) {
    console.warn('[loops] Subscription confirmed email ID not configured')
    return
  }

  await sendTransactionalEmail({
    email,
    transactionalId: TRANSACTIONAL_IDS.SUBSCRIPTION_CONFIRMED,
    dataVariables: {
      firstName: data.firstName || 'there',
      plan: data.plan,
      amount: data.amount,
      nextBillingDate: data.nextBillingDate || '',
      dashboardUrl: 'https://app.taxfolio.io/dashboard',
    },
  })
}

/**
 * Send subscription cancelled email
 */
export async function sendSubscriptionCancelled(
  email: string,
  data: {
    firstName: string
    plan: string
    accessUntil: string
  }
): Promise<void> {
  if (!TRANSACTIONAL_IDS.SUBSCRIPTION_CANCELLED) {
    console.warn('[loops] Subscription cancelled email ID not configured')
    return
  }

  await sendTransactionalEmail({
    email,
    transactionalId: TRANSACTIONAL_IDS.SUBSCRIPTION_CANCELLED,
    dataVariables: {
      firstName: data.firstName || 'there',
      plan: data.plan,
      accessUntil: data.accessUntil,
      resubscribeUrl: 'https://app.taxfolio.io/settings/billing',
    },
  })
}

/**
 * Send trial ending reminder
 */
export async function sendTrialEndingReminder(
  email: string,
  data: {
    firstName: string
    daysLeft: number
  }
): Promise<void> {
  if (!TRANSACTIONAL_IDS.TRIAL_ENDING) {
    console.warn('[loops] Trial ending email ID not configured')
    return
  }

  await sendTransactionalEmail({
    email,
    transactionalId: TRANSACTIONAL_IDS.TRIAL_ENDING,
    dataVariables: {
      firstName: data.firstName || 'there',
      daysLeft: data.daysLeft.toString(),
      upgradeUrl: 'https://app.taxfolio.io/settings/billing',
    },
  })
}

/**
 * Send payment failed notification
 */
export async function sendPaymentFailedEmail(
  email: string,
  data: {
    firstName: string
    amount: string
    updatePaymentUrl: string
  }
): Promise<void> {
  if (!TRANSACTIONAL_IDS.PAYMENT_FAILED) {
    console.warn('[loops] Payment failed email ID not configured')
    return
  }

  await sendTransactionalEmail({
    email,
    transactionalId: TRANSACTIONAL_IDS.PAYMENT_FAILED,
    dataVariables: {
      firstName: data.firstName || 'there',
      amount: data.amount,
      updatePaymentUrl: data.updatePaymentUrl,
    },
  })
}
