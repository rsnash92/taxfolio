import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getObligations } from '@/lib/hmrc/obligations'

export async function GET(request: NextRequest) {
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
      { error: 'NINO not configured. Please add your National Insurance number.' },
      { status: 400 }
    )
  }

  const searchParams = request.nextUrl.searchParams
  const status = searchParams.get('status') as 'Open' | 'Fulfilled' | null

  try {
    const obligations = await getObligations(
      user.id,
      profile.hmrc_nino,
      status ? { status } : undefined
    )

    // Flatten obligations for easier consumption
    const flatObligations = obligations.obligations.flatMap(
      (o) => o.obligationDetails
    )

    return NextResponse.json({ obligations: flatObligations })
  } catch (error) {
    console.error('Failed to get obligations:', error)
    return NextResponse.json(
      { error: 'Failed to get obligations' },
      { status: 500 }
    )
  }
}
