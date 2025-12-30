import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { submitSelfEmploymentPeriod } from '@/lib/hmrc/self-employment'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get user's NINO from their profile
  const { data: profile } = await supabase
    .from('users')
    .select('hmrc_nino')
    .eq('id', user.id)
    .single()

  if (!profile?.hmrc_nino) {
    return NextResponse.json(
      { error: 'NINO not configured' },
      { status: 400 }
    )
  }

  try {
    const body = await request.json()
    const { businessId, taxYear, periodFrom, periodTo, income, expenses } = body

    if (!businessId || !taxYear || !periodFrom || !periodTo) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const periodData = {
      from: periodFrom,
      to: periodTo,
      incomes: {
        turnover: income || 0,
      },
      expenses: expenses
        ? {
            otherExpenses: { amount: expenses },
          }
        : undefined,
    }

    await submitSelfEmploymentPeriod(
      user.id,
      profile.hmrc_nino,
      businessId,
      taxYear,
      periodData
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to submit period:', error)
    return NextResponse.json(
      { error: 'Failed to submit to HMRC' },
      { status: 500 }
    )
  }
}
