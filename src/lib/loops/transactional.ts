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
  // HMRC emails
  HMRC_CONNECTED: process.env.LOOPS_HMRC_CONNECTED_ID || '',
  HMRC_CONNECTION_EXPIRING: process.env.LOOPS_HMRC_CONNECTION_EXPIRING_ID || '',
  HMRC_SUBMISSION_SUCCESS: process.env.LOOPS_HMRC_SUBMISSION_SUCCESS_ID || '',
  HMRC_SUBMISSION_FAILED: process.env.LOOPS_HMRC_SUBMISSION_FAILED_ID || '',
  TAX_DEADLINE_REMINDER: process.env.LOOPS_TAX_DEADLINE_REMINDER_ID || '',
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

// =============================================================================
// HMRC Emails
// =============================================================================

/**
 * Send HMRC connected confirmation email
 */
export async function sendHmrcConnectedEmail(
  email: string,
  data: {
    firstName: string
    expiresAt: string
  }
): Promise<void> {
  if (!TRANSACTIONAL_IDS.HMRC_CONNECTED) {
    console.warn('[loops] HMRC connected email ID not configured')
    return
  }

  await sendTransactionalEmail({
    email,
    transactionalId: TRANSACTIONAL_IDS.HMRC_CONNECTED,
    dataVariables: {
      firstName: data.firstName || 'there',
      expiresAt: data.expiresAt,
      dashboardUrl: 'https://app.taxfolio.io/dashboard',
      hmrcSettingsUrl: 'https://app.taxfolio.io/settings/hmrc',
    },
  })
}

/**
 * Send HMRC connection expiring warning
 */
export async function sendHmrcConnectionExpiringEmail(
  email: string,
  data: {
    firstName: string
    expiresAt: string
    daysUntilExpiry: number
  }
): Promise<void> {
  if (!TRANSACTIONAL_IDS.HMRC_CONNECTION_EXPIRING) {
    console.warn('[loops] HMRC connection expiring email ID not configured')
    return
  }

  await sendTransactionalEmail({
    email,
    transactionalId: TRANSACTIONAL_IDS.HMRC_CONNECTION_EXPIRING,
    dataVariables: {
      firstName: data.firstName || 'there',
      expiresAt: data.expiresAt,
      daysUntilExpiry: data.daysUntilExpiry.toString(),
      reconnectUrl: 'https://app.taxfolio.io/settings/hmrc',
    },
  })
}

/**
 * Send HMRC submission success email
 */
export async function sendHmrcSubmissionSuccessEmail(
  email: string,
  data: {
    firstName: string
    taxYear: string
    submissionReference: string
    submittedAt: string
  }
): Promise<void> {
  if (!TRANSACTIONAL_IDS.HMRC_SUBMISSION_SUCCESS) {
    console.warn('[loops] HMRC submission success email ID not configured')
    return
  }

  await sendTransactionalEmail({
    email,
    transactionalId: TRANSACTIONAL_IDS.HMRC_SUBMISSION_SUCCESS,
    dataVariables: {
      firstName: data.firstName || 'there',
      taxYear: data.taxYear,
      submissionReference: data.submissionReference,
      submittedAt: data.submittedAt,
      dashboardUrl: 'https://app.taxfolio.io/dashboard',
    },
  })
}

/**
 * Send HMRC submission failed email
 */
export async function sendHmrcSubmissionFailedEmail(
  email: string,
  data: {
    firstName: string
    taxYear: string
    errorMessage: string
  }
): Promise<void> {
  if (!TRANSACTIONAL_IDS.HMRC_SUBMISSION_FAILED) {
    console.warn('[loops] HMRC submission failed email ID not configured')
    return
  }

  await sendTransactionalEmail({
    email,
    transactionalId: TRANSACTIONAL_IDS.HMRC_SUBMISSION_FAILED,
    dataVariables: {
      firstName: data.firstName || 'there',
      taxYear: data.taxYear,
      errorMessage: data.errorMessage,
      dashboardUrl: 'https://app.taxfolio.io/dashboard',
      supportEmail: 'support@taxfolio.io',
    },
  })
}

/**
 * Send tax deadline reminder email
 */
export async function sendTaxDeadlineReminderEmail(
  email: string,
  data: {
    firstName: string
    deadlineDate: string
    daysUntilDeadline: number
    taxYear: string
  }
): Promise<void> {
  if (!TRANSACTIONAL_IDS.TAX_DEADLINE_REMINDER) {
    console.warn('[loops] Tax deadline reminder email ID not configured')
    return
  }

  await sendTransactionalEmail({
    email,
    transactionalId: TRANSACTIONAL_IDS.TAX_DEADLINE_REMINDER,
    dataVariables: {
      firstName: data.firstName || 'there',
      deadlineDate: data.deadlineDate,
      daysUntilDeadline: data.daysUntilDeadline.toString(),
      taxYear: data.taxYear,
      dashboardUrl: 'https://app.taxfolio.io/dashboard',
    },
  })
}
