import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateYearEndReport } from '@/lib/year-end'

function getCurrentTaxYear(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const day = now.getDate()

  if (month > 4 || (month === 4 && day >= 6)) {
    return `${year}-${(year + 1).toString().slice(-2)}`
  } else {
    return `${year - 1}-${year.toString().slice(-2)}`
  }
}

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const searchParams = request.nextUrl.searchParams
  const taxYear = searchParams.get('tax_year') || getCurrentTaxYear()
  const refresh = searchParams.get('refresh') === 'true'

  try {
    const report = await generateYearEndReport(user.id, taxYear, {
      useAI: true,
      forceRefresh: refresh,
    })

    return NextResponse.json(report)
  } catch (error) {
    console.error('Failed to generate year-end report:', error)
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    )
  }
}
