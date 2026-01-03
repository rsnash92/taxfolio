import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { amount, accountHolderName, sortCode, accountNumber } =
    await request.json()

  // Validate inputs
  if (!amount || !accountHolderName || !sortCode || !accountNumber) {
    return NextResponse.json({ error: 'All fields required' }, { status: 400 })
  }

  // Validate sort code format (XX-XX-XX or XXXXXX)
  const cleanSortCode = sortCode.replace(/-/g, '')
  if (!/^\d{6}$/.test(cleanSortCode)) {
    return NextResponse.json({ error: 'Invalid sort code' }, { status: 400 })
  }

  // Validate account number (8 digits)
  if (!/^\d{8}$/.test(accountNumber)) {
    return NextResponse.json(
      { error: 'Invalid account number' },
      { status: 400 }
    )
  }

  const { data, error } = await supabase.rpc('request_referral_payout', {
    p_user_id: user.id,
    p_amount: amount,
    p_account_holder_name: accountHolderName,
    p_sort_code: cleanSortCode,
    p_account_number: accountNumber,
  })

  if (error) {
    console.error('Failed to request payout:', error)
    return NextResponse.json(
      { error: 'Failed to request payout' },
      { status: 500 }
    )
  }

  return NextResponse.json(data)
}

// GET payout history
export async function GET() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: payouts, error } = await supabase
    .from('referral_payouts')
    .select('*')
    .eq('user_id', user.id)
    .order('requested_at', { ascending: false })

  if (error) {
    console.error('Failed to get payouts:', error)
    return NextResponse.json(
      { error: 'Failed to get payouts' },
      { status: 500 }
    )
  }

  return NextResponse.json({ payouts })
}
