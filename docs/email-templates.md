# TaxFolio Email Templates for Loops

This document contains the email copy for all transactional emails. Create these templates in your Loops dashboard, then add the template IDs to your environment variables.

## Environment Variables Needed

```bash
# Existing emails
LOOPS_WELCOME_EMAIL_ID=
LOOPS_PASSWORD_RESET_EMAIL_ID=
LOOPS_EMAIL_VERIFICATION_ID=
LOOPS_PAYMENT_RECEIPT_ID=
LOOPS_SUBSCRIPTION_CONFIRMED_ID=
LOOPS_SUBSCRIPTION_CANCELLED_ID=
LOOPS_TRIAL_ENDING_ID=
LOOPS_PAYMENT_FAILED_ID=

# HMRC emails
LOOPS_HMRC_CONNECTED_ID=
LOOPS_HMRC_CONNECTION_EXPIRING_ID=
LOOPS_HMRC_SUBMISSION_SUCCESS_ID=
LOOPS_HMRC_SUBMISSION_FAILED_ID=
LOOPS_TAX_DEADLINE_REMINDER_ID=
```

---

## 1. Welcome Email

**Template ID variable:** `LOOPS_WELCOME_EMAIL_ID`

**Subject:** Welcome to TaxFolio, {{firstName}}!

**Data Variables:**
- `firstName` - User's first name
- `loginUrl` - https://app.taxfolio.io/login
- `dashboardUrl` - https://app.taxfolio.io/dashboard
- `supportEmail` - support@taxfolio.io

**Body:**

```
Hi {{firstName}},

Welcome to TaxFolio! We're excited to help you manage your self-assessment tax with ease.

Your 30-day free trial has started. Here's what you can do:

1. Connect your bank accounts to automatically import transactions
2. Let our AI categorise your expenses for tax purposes
3. Track your income and allowable expenses in real-time
4. Generate reports ready for your Self Assessment

Get started now:
{{dashboardUrl}}

If you have any questions, just reply to this email or contact us at {{supportEmail}}.

Cheers,
The TaxFolio Team
```

---

## 2. Password Reset Email

**Template ID variable:** `LOOPS_PASSWORD_RESET_EMAIL_ID`

**Subject:** Reset your TaxFolio password

**Data Variables:**
- `resetUrl` - Password reset link
- `expiresIn` - "1 hour"

**Body:**

```
Hi,

We received a request to reset your TaxFolio password.

Click the link below to set a new password:
{{resetUrl}}

This link will expire in {{expiresIn}}.

If you didn't request this, you can safely ignore this email. Your password won't be changed.

Cheers,
The TaxFolio Team
```

---

## 3. Email Verification

**Template ID variable:** `LOOPS_EMAIL_VERIFICATION_ID`

**Subject:** Verify your email address

**Data Variables:**
- `verifyUrl` - Verification link

**Body:**

```
Hi,

Please verify your email address by clicking the link below:
{{verifyUrl}}

If you didn't create a TaxFolio account, you can safely ignore this email.

Cheers,
The TaxFolio Team
```

---

## 4. Payment Receipt

**Template ID variable:** `LOOPS_PAYMENT_RECEIPT_ID`

**Subject:** Your TaxFolio payment receipt

**Data Variables:**
- `firstName` - User's first name
- `amount` - Payment amount (e.g., "£9.99")
- `plan` - Plan name (e.g., "Pro Monthly")
- `date` - Payment date
- `invoiceUrl` - Link to invoice (optional)

**Body:**

```
Hi {{firstName}},

Thanks for your payment! Here are the details:

Plan: {{plan}}
Amount: {{amount}}
Date: {{date}}

{{#if invoiceUrl}}
View your invoice: {{invoiceUrl}}
{{/if}}

If you have any questions about this payment, just reply to this email.

Cheers,
The TaxFolio Team
```

---

## 5. Subscription Confirmed

**Template ID variable:** `LOOPS_SUBSCRIPTION_CONFIRMED_ID`

**Subject:** Your TaxFolio {{plan}} subscription is active

**Data Variables:**
- `firstName` - User's first name
- `plan` - Plan name
- `amount` - Monthly/yearly amount
- `nextBillingDate` - Next billing date (optional)
- `dashboardUrl` - https://app.taxfolio.io/dashboard

**Body:**

```
Hi {{firstName}},

Great news! Your {{plan}} subscription is now active.

Plan: {{plan}}
Amount: {{amount}}
{{#if nextBillingDate}}
Next billing date: {{nextBillingDate}}
{{/if}}

You now have full access to all TaxFolio features. Here's what's unlocked:

- Unlimited transaction imports
- AI-powered categorisation
- HMRC MTD submission
- Priority support

Head to your dashboard to get started:
{{dashboardUrl}}

Thanks for choosing TaxFolio!

Cheers,
The TaxFolio Team
```

---

## 6. Subscription Cancelled

**Template ID variable:** `LOOPS_SUBSCRIPTION_CANCELLED_ID`

**Subject:** Your TaxFolio subscription has been cancelled

**Data Variables:**
- `firstName` - User's first name
- `plan` - Plan name
- `accessUntil` - Date access ends
- `resubscribeUrl` - https://app.taxfolio.io/settings/billing

**Body:**

```
Hi {{firstName}},

Your TaxFolio {{plan}} subscription has been cancelled.

You'll continue to have access to your account until {{accessUntil}}. After that, your account will move to our free tier with limited features.

Your data will remain safe and you can resubscribe at any time:
{{resubscribeUrl}}

We'd love to know why you cancelled. Just reply to this email with any feedback - it helps us improve.

Thanks for being a TaxFolio customer.

Cheers,
The TaxFolio Team
```

---

## 7. Trial Ending Reminder

**Template ID variable:** `LOOPS_TRIAL_ENDING_ID`

**Subject:** Your TaxFolio trial ends in {{daysLeft}} days

**Data Variables:**
- `firstName` - User's first name
- `daysLeft` - Number of days remaining
- `upgradeUrl` - https://app.taxfolio.io/settings/billing

**Body:**

```
Hi {{firstName}},

Just a heads up - your TaxFolio free trial ends in {{daysLeft}} days.

To keep all your features and continue managing your taxes effortlessly, upgrade to a paid plan:
{{upgradeUrl}}

What you'll lose if you don't upgrade:
- Bank account syncing
- AI categorisation
- HMRC submission
- Detailed tax reports

Your data is safe and will remain in your account. You can upgrade at any time to unlock everything again.

Questions? Just reply to this email.

Cheers,
The TaxFolio Team
```

---

## 8. Payment Failed

**Template ID variable:** `LOOPS_PAYMENT_FAILED_ID`

**Subject:** Action needed: Your TaxFolio payment failed

**Data Variables:**
- `firstName` - User's first name
- `amount` - Payment amount
- `updatePaymentUrl` - Link to update payment method

**Body:**

```
Hi {{firstName}},

We couldn't process your payment of {{amount}} for TaxFolio.

This might be due to:
- Expired card
- Insufficient funds
- Card declined by your bank

Please update your payment method to keep your subscription active:
{{updatePaymentUrl}}

If we can't collect payment within 7 days, your account will be downgraded to the free tier.

Need help? Just reply to this email.

Cheers,
The TaxFolio Team
```

---

## 9. HMRC Connected

**Template ID variable:** `LOOPS_HMRC_CONNECTED_ID`

**Subject:** HMRC connected successfully

**Data Variables:**
- `firstName` - User's first name
- `expiresAt` - When the connection expires
- `dashboardUrl` - https://app.taxfolio.io/dashboard
- `hmrcSettingsUrl` - https://app.taxfolio.io/settings/hmrc

**Body:**

```
Hi {{firstName}},

Great news! Your HMRC Government Gateway account is now connected to TaxFolio.

You can now:
- Submit your Self Assessment directly to HMRC
- View your tax obligations
- Check submission history

Connection details:
- Status: Connected
- Expires: {{expiresAt}}

You'll need to reconnect before the expiry date to continue submitting returns.

View your HMRC settings:
{{hmrcSettingsUrl}}

Cheers,
The TaxFolio Team
```

---

## 10. HMRC Connection Expiring

**Template ID variable:** `LOOPS_HMRC_CONNECTION_EXPIRING_ID`

**Subject:** Action needed: HMRC connection expires in {{daysUntilExpiry}} days

**Data Variables:**
- `firstName` - User's first name
- `expiresAt` - Expiry date
- `daysUntilExpiry` - Days until expiry
- `reconnectUrl` - https://app.taxfolio.io/settings/hmrc

**Body:**

```
Hi {{firstName}},

Your HMRC Government Gateway connection expires on {{expiresAt}} ({{daysUntilExpiry}} days from now).

Once expired, you won't be able to submit your Self Assessment to HMRC until you reconnect.

Reconnect now to avoid any interruption:
{{reconnectUrl}}

It only takes a minute and ensures you can continue submitting tax returns seamlessly.

Cheers,
The TaxFolio Team
```

---

## 11. HMRC Submission Success

**Template ID variable:** `LOOPS_HMRC_SUBMISSION_SUCCESS_ID`

**Subject:** Tax return submitted successfully - Reference: {{submissionReference}}

**Data Variables:**
- `firstName` - User's first name
- `taxYear` - Tax year (e.g., "2023-24")
- `submissionReference` - HMRC reference number
- `submittedAt` - Submission date/time
- `dashboardUrl` - https://app.taxfolio.io/dashboard

**Body:**

```
Hi {{firstName}},

Your Self Assessment tax return has been successfully submitted to HMRC.

Submission details:
- Tax year: {{taxYear}}
- Reference: {{submissionReference}}
- Submitted: {{submittedAt}}

Important: Keep this reference number safe. HMRC may ask for it if you have any queries about your return.

What happens next:
1. HMRC will process your return
2. You'll receive a tax calculation (usually within 72 hours)
3. Any tax due must be paid by the deadline

View your submission history:
{{dashboardUrl}}

Well done on getting your taxes sorted!

Cheers,
The TaxFolio Team
```

---

## 12. HMRC Submission Failed

**Template ID variable:** `LOOPS_HMRC_SUBMISSION_FAILED_ID`

**Subject:** Tax return submission failed - Action required

**Data Variables:**
- `firstName` - User's first name
- `taxYear` - Tax year
- `errorMessage` - Error details from HMRC
- `dashboardUrl` - https://app.taxfolio.io/dashboard
- `supportEmail` - support@taxfolio.io

**Body:**

```
Hi {{firstName}},

Unfortunately, your Self Assessment submission for {{taxYear}} couldn't be completed.

Error from HMRC:
{{errorMessage}}

What to do next:
1. Review the error message above
2. Check your tax return for any missing or incorrect information
3. Try submitting again

Common issues:
- Missing UTR (Unique Taxpayer Reference)
- Incorrect National Insurance number
- Invalid figures in your return

Go to your dashboard to review and resubmit:
{{dashboardUrl}}

If you're stuck, reply to this email or contact us at {{supportEmail}} and we'll help you sort it out.

Cheers,
The TaxFolio Team
```

---

## 13. Tax Deadline Reminder

**Template ID variable:** `LOOPS_TAX_DEADLINE_REMINDER_ID`

**Subject:** {{daysUntilDeadline}} days until your Self Assessment deadline

**Data Variables:**
- `firstName` - User's first name
- `deadlineDate` - The deadline date
- `daysUntilDeadline` - Days remaining
- `taxYear` - Tax year
- `dashboardUrl` - https://app.taxfolio.io/dashboard

**Body:**

```
Hi {{firstName}},

Your Self Assessment deadline for {{taxYear}} is {{deadlineDate}} - that's just {{daysUntilDeadline}} days away.

Don't leave it to the last minute! Late submissions can result in:
- £100 initial penalty
- Daily penalties after 3 months
- Interest on any tax owed

If you haven't already:
1. Make sure all your transactions are categorised
2. Review your tax summary
3. Connect to HMRC if you haven't already
4. Submit your return

Get it done now:
{{dashboardUrl}}

Need help? Reply to this email and we'll assist you.

Cheers,
The TaxFolio Team
```

---

## Notes for Loops Setup

### Creating Templates in Loops

1. Go to **Transactional** in your Loops dashboard
2. Click **Create new email**
3. Give it a name (e.g., "Welcome Email")
4. Design your email using the content above
5. Add data variables using `{{variableName}}` syntax
6. Save and publish
7. Copy the **Transactional ID** and add it to your `.env` file

### Testing

You can test each email in Loops by:
1. Going to the template
2. Clicking "Send test"
3. Entering your email and sample data variables

### Conditional Content

For conditional content like `{{#if invoiceUrl}}`, Loops uses its own syntax. Check their docs for the exact format, or simplify by always including all fields.
