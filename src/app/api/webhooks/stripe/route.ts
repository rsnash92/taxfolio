import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { stripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  const body = await request.text()
  const headersList = await headers()
  const signature = headersList.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        await handleCheckoutCompleted(session)
        break
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionChange(subscription)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionDeleted(subscription)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        await handlePaymentFailed(invoice)
        break
      }
    }

    // Log event
    await logEvent(event)

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook handler error:', error)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  // Handle lifetime deal purchase
  if (session.mode === 'payment') {
    const paymentIntent = session.payment_intent as string

    // Get user from payment intent metadata
    const pi = await stripe.paymentIntents.retrieve(paymentIntent)
    const userId = pi.metadata.supabase_user_id

    if (pi.metadata.plan === 'lifetime' && userId) {
      // Record lifetime deal
      await supabaseAdmin.from('lifetime_deals').insert({
        user_id: userId,
        stripe_payment_intent_id: paymentIntent,
        amount: session.amount_total,
      })

      // Update user to lifetime
      await supabaseAdmin
        .from('users')
        .update({
          subscription_tier: 'pro',
          subscription_status: 'active',
          is_lifetime: true,
          trial_ends_at: null,
        })
        .eq('id', userId)

      console.log(`Lifetime deal purchased by user ${userId}`)
    }
  }
  // Subscription checkouts handled by subscription.created webhook
}

async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  let userId = subscription.metadata.supabase_user_id

  if (!userId) {
    // Try to find by customer ID
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('stripe_customer_id', subscription.customer as string)
      .single()

    if (!user) {
      console.error('No user found for subscription:', subscription.id)
      return
    }
    userId = user.id
  }

  // Determine tier from price
  const priceId = subscription.items.data[0]?.price.id
  let tier: 'lite' | 'pro' = 'lite'
  if (priceId === process.env.STRIPE_PRICE_PRO_ANNUAL) {
    tier = 'pro'
  }

  const status = mapSubscriptionStatus(subscription.status)

  // Access subscription properties with type assertion for newer Stripe SDK
  const subAny = subscription as unknown as {
    currentPeriodEnd: number
    cancelAtPeriodEnd: boolean
  }

  await supabaseAdmin
    .from('users')
    .update({
      subscription_tier: tier,
      subscription_status: status,
      subscription_id: subscription.id,
      subscription_price_id: priceId,
      subscription_current_period_end: new Date(
        subAny.currentPeriodEnd * 1000
      ).toISOString(),
      subscription_cancel_at_period_end: subAny.cancelAtPeriodEnd,
      trial_ends_at: null, // Clear trial when subscribed
    })
    .eq('id', userId)

  console.log(`Subscription ${subscription.id} updated: ${tier} - ${status}`)
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('is_lifetime')
    .eq('stripe_customer_id', subscription.customer as string)
    .single()

  // Don't downgrade lifetime users
  if (user?.is_lifetime) {
    console.log('Ignoring subscription deletion for lifetime user')
    return
  }

  await supabaseAdmin
    .from('users')
    .update({
      subscription_tier: 'free',
      subscription_status: 'canceled',
      subscription_id: null,
      subscription_price_id: null,
      subscription_current_period_end: null,
      subscription_cancel_at_period_end: false,
    })
    .eq('stripe_customer_id', subscription.customer as string)

  console.log(`Subscription ${subscription.id} deleted`)
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  // Access subscription property with type assertion for newer Stripe SDK
  const invoiceAny = invoice as unknown as { subscription?: string }
  if (invoiceAny.subscription) {
    await supabaseAdmin
      .from('users')
      .update({ subscription_status: 'past_due' })
      .eq('stripe_customer_id', invoice.customer as string)
  }
  console.log(`Payment failed for invoice ${invoice.id}`)
}

function mapSubscriptionStatus(stripeStatus: Stripe.Subscription.Status): string {
  const statusMap: Record<string, string> = {
    active: 'active',
    trialing: 'trialing',
    past_due: 'past_due',
    canceled: 'canceled',
    unpaid: 'past_due',
    incomplete: 'none',
    incomplete_expired: 'none',
    paused: 'canceled',
  }
  return statusMap[stripeStatus] || 'none'
}

async function logEvent(event: Stripe.Event) {
  const obj = event.data.object as { customer?: string }
  const customerId = obj.customer

  if (customerId) {
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('stripe_customer_id', customerId)
      .single()

    if (user) {
      await supabaseAdmin.from('subscription_events').insert({
        user_id: user.id,
        event_type: event.type,
        stripe_event_id: event.id,
        data: event.data.object,
      })
    }
  }
}
