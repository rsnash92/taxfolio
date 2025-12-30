import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe, PLANS, LIFETIME_DEAL_ENABLED } from '@/lib/stripe'
import { getLifetimeDealsRemaining } from '@/lib/subscription'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { plan } = await request.json() as { plan: 'lite' | 'pro' | 'lifetime' }

    if (!['lite', 'pro', 'lifetime'].includes(plan)) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    // Check lifetime deal availability
    if (plan === 'lifetime') {
      if (!LIFETIME_DEAL_ENABLED) {
        return NextResponse.json({ error: 'Lifetime deal is no longer available' }, { status: 400 })
      }
      const remaining = await getLifetimeDealsRemaining()
      if (remaining <= 0) {
        return NextResponse.json({ error: 'Lifetime deals sold out' }, { status: 400 })
      }
    }

    // Get or create Stripe customer
    const { data: userData } = await supabase
      .from('users')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single()

    let customerId = userData?.stripe_customer_id

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id },
      })
      customerId = customer.id

      await supabase
        .from('users')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id)
    }

    const priceId = PLANS[plan].priceId
    const isLifetime = plan === 'lifetime'

    if (!priceId) {
      return NextResponse.json({ error: 'Price not configured' }, { status: 500 })
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: isLifetime ? 'payment' : 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing?success=true&plan=${plan}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing?canceled=true`,
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      tax_id_collection: { enabled: true },
      ...(isLifetime ? {
        payment_intent_data: {
          metadata: {
            supabase_user_id: user.id,
            plan: 'lifetime',
          },
        },
      } : {
        subscription_data: {
          metadata: { supabase_user_id: user.id },
        },
      }),
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Checkout error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
