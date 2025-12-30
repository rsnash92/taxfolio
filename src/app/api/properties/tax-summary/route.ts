import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { calculatePropertyTax, generateSA105 } from '@/lib/property-tax'

// GET /api/properties/tax-summary - Get property tax summary and SA105 data
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const taxYear = searchParams.get('tax_year')

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!taxYear) {
    return NextResponse.json({ error: 'tax_year is required' }, { status: 400 })
  }

  try {
    const summary = await calculatePropertyTax(user.id, taxYear)
    const sa105 = await generateSA105(user.id, taxYear)

    return NextResponse.json({
      summary,
      sa105,
    })
  } catch (error) {
    console.error('Error calculating property tax:', error)
    return NextResponse.json(
      { error: 'Failed to calculate property tax' },
      { status: 500 }
    )
  }
}
