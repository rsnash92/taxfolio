/**
 * Loops Email Integration
 * Export all Loops functionality from a single entry point
 */

// Client functions
export {
  isLoopsConfigured,
  createContact,
  updateContact,
  deleteContact,
  sendEvent,
  sendTransactionalEmail,
  findContact,
  type LoopsContact,
} from './client'

// Event tracking
export {
  EVENTS,
  type EventName,
  trackSignup,
  trackOnboardingCompleted,
  trackBankConnected,
  trackFirstTransaction,
  trackFirstCategorisation,
  trackTrialStarted,
  trackTrialEndingSoon,
  trackTrialEnded,
  trackSubscriptionStarted,
  trackSubscriptionCancelled,
  trackPaymentFailed,
  trackExportCreated,
  updateTransactionCount,
} from './events'

// Transactional emails
export {
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendEmailVerification,
  sendPaymentReceipt,
  sendSubscriptionConfirmed,
  sendSubscriptionCancelled,
  sendTrialEndingReminder,
  sendPaymentFailedEmail,
} from './transactional'
