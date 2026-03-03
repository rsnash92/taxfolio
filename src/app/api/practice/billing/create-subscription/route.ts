import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getPracticeContext } from '@/lib/practice'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '')

const PRICE_IDS: Record<string, string> = {
  starter: process.env.STRIPE_PRICE_STARTER || '',
  growth: process.env.STRIPE_PRICE_GROWTH || '',
  practice: process.env.STRIPE_PRICE_PRACTICE || '',
  enterprise: process.env.STRIPE_PRICE_ENTERPRISE || '',
}

/**
 * POST /api/practice/billing/create-subscription
 * Creates a Stripe checkout session for a practice subscription.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const context = await getPracticeContext(supabase, user.id)
    if (!context || context.membership.role !== 'owner') {
      return NextResponse.json({ error: 'Only practice owners can manage billing' }, { status: 403 })
    }

    const body = await request.json()
    const { tier } = body

    if (!tier || !PRICE_IDS[tier]) {
      return NextResponse.json({ error: 'Invalid subscription tier' }, { status: 400 })
    }

    const priceId = PRICE_IDS[tier]
    if (!priceId) {
      return NextResponse.json({ error: 'Pricing not configured for this tier' }, { status: 503 })
    }

    // Get or create Stripe customer
    let customerId: string | undefined

    const { data: practice } = await supabase
      .from('practices')
      .select('stripe_customer_id')
      .eq('id', context.practice.id)
      .single()

    if (practice?.stripe_customer_id) {
      customerId = practice.stripe_customer_id
    } else {
      const customer = await stripe.customers.create({
        email: user.email || undefined,
        metadata: {
          practice_id: context.practice.id,
          practice_name: context.practice.name,
        },
      })
      customerId = customer.id

      await supabase
        .from('practices')
        .update({ stripe_customer_id: customerId })
        .eq('id', context.practice.id)
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/practice/settings/billing?success=true`,
      cancel_url: `${appUrl}/practice/settings/billing?canceled=true`,
      metadata: {
        practice_id: context.practice.id,
        tier,
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('[Practice Billing] Error:', error)
    return NextResponse.json({ error: 'Failed to create subscription' }, { status: 500 })
  }
}
