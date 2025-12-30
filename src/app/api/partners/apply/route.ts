import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { COMMISSION_RATES } from '@/lib/partners/commissions'
import type { PartnerApplication, PartnerType } from '@/lib/partners/types'

export async function POST(request: NextRequest) {
  try {
    const body: PartnerApplication = await request.json()

    // Validate required fields
    if (!body.type || !body.company_name || !body.contact_name || !body.email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate partner type
    if (!['accountant', 'affiliate'].includes(body.type)) {
      return NextResponse.json(
        { error: 'Invalid partner type' },
        { status: 400 }
      )
    }

    // Validate payout method
    if (body.payout_method === 'bank_transfer') {
      if (!body.bank_account_name || !body.bank_sort_code || !body.bank_account_number) {
        return NextResponse.json(
          { error: 'Bank details required for bank transfer' },
          { status: 400 }
        )
      }
    } else if (body.payout_method === 'paypal') {
      if (!body.payout_email) {
        return NextResponse.json(
          { error: 'PayPal email required' },
          { status: 400 }
        )
      }
    }

    const supabase = await createClient()

    // Check if email already exists
    const { data: existing } = await supabase
      .from('partners')
      .select('id')
      .eq('email', body.email)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'An application with this email already exists' },
        { status: 400 }
      )
    }

    // Generate referral code
    const { data: codeResult } = await supabase.rpc('generate_referral_code', {
      partner_name: body.company_name,
    })

    const referralCode = codeResult || body.company_name.toUpperCase().slice(0, 8)

    // Get commission config
    const config = COMMISSION_RATES[body.type as PartnerType]

    // Get current user if logged in
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Create partner application
    const { data: partner, error } = await supabase
      .from('partners')
      .insert({
        user_id: user?.id || null,
        type: body.type,
        status: 'pending',
        company_name: body.company_name,
        contact_name: body.contact_name,
        email: body.email,
        phone: body.phone || null,
        website: body.website || null,
        accounting_body: body.accounting_body || null,
        registration_number: body.registration_number || null,
        referral_code: referralCode,
        commission_rate: config.rate,
        commission_recurring: config.recurring,
        payout_method: body.payout_method,
        payout_email: body.payout_email || null,
        bank_account_name: body.bank_account_name || null,
        bank_sort_code: body.bank_sort_code || null,
        bank_account_number: body.bank_account_number || null,
      })
      .select()
      .single()

    if (error) {
      console.error('Failed to create partner application:', error)
      return NextResponse.json(
        { error: 'Failed to submit application' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      partnerId: partner.id,
      referralCode: partner.referral_code,
    })
  } catch (error) {
    console.error('Partner application error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
