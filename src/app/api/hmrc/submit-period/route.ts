import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  getSelfEmploymentBusinesses,
  createSelfEmploymentBusiness,
  submitSelfEmploymentPeriod,
} from '@/lib/hmrc/self-employment'

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
    const { taxYear, periodFrom, periodTo, income, expenses } = body

    if (!taxYear || !periodFrom || !periodTo) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get or create business and submit (uses Gov-Test-Scenario: STATEFUL in sandbox)
    let businessId: string

    try {
      const { businesses } = await getSelfEmploymentBusinesses(user.id, profile.hmrc_nino)
      if (businesses && businesses.length > 0) {
        businessId = businesses[0].businessId
      } else {
        const newBusiness = await createSelfEmploymentBusiness(user.id, profile.hmrc_nino, {
          accountingPeriodStartDate: `${taxYear.split('-')[0]}-04-06`,
          accountingPeriodEndDate: `${parseInt(taxYear.split('-')[0]) + 1}-04-05`,
          tradingName: 'Self Employment',
          addressLineOne: 'Business Address',
          countryCode: 'GB',
          commencementDate: '2020-01-01',
        })
        businessId = newBusiness.businessId
      }
    } catch (bizError) {
      console.error('Failed to get/create business:', bizError)
      return NextResponse.json(
        { error: 'Failed to find or create business with HMRC' },
        { status: 500 }
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
    const errorMessage = error instanceof Error ? error.message : 'Failed to submit to HMRC'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
