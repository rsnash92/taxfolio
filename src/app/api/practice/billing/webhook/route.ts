import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '')

const TIER_LIMITS: Record<string, number> = {
  starter: 10,
  growth: 50,
  practice: 200,
  enterprise: 1000,
}

/**
 * POST /api/practice/billing/webhook
 * Stripe webhook handler for practice subscriptions.
 */
export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')

  if (!sig) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_PRACTICE_WEBHOOK_SECRET || ''
    )
  } catch (err) {
    console.error('[Practice Webhook] Signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  // Use service role to bypass RLS
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const practiceId = session.metadata?.practice_id
        const tier = session.metadata?.tier

        if (practiceId && tier) {
          await supabase
            .from('practices')
            .update({
              subscription_tier: tier,
              subscription_status: 'active',
              stripe_subscription_id: session.subscription as string,
              max_clients: TIER_LIMITS[tier] || 10,
            })
            .eq('id', practiceId)
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const { data: practice } = await supabase
          .from('practices')
          .select('id')
          .eq('stripe_subscription_id', subscription.id)
          .single()

        if (practice) {
          await supabase
            .from('practices')
            .update({
              subscription_status: subscription.status === 'active' ? 'active' : subscription.status,
            })
            .eq('id', practice.id)
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const { data: practice } = await supabase
          .from('practices')
          .select('id')
          .eq('stripe_subscription_id', subscription.id)
          .single()

        if (practice) {
          await supabase
            .from('practices')
            .update({
              subscription_status: 'canceled',
              subscription_tier: 'starter',
              max_clients: 10,
            })
            .eq('id', practice.id)
        }
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('[Practice Webhook] Error:', error)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
}
