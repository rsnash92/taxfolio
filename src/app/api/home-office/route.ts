import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/home-office - Get use of home data for current tax year
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

  const { data, error } = await supabase
    .from('use_of_home')
    .select('*')
    .eq('user_id', user.id)
    .eq('tax_year', taxYear)
    .single()

  if (error && error.code !== 'PGRST116') {
    // PGRST116 is "no rows returned" - that's OK
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}

// POST /api/home-office - Save use of home data
export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()

    if (!body.tax_year) {
      return NextResponse.json({ error: 'tax_year is required' }, { status: 400 })
    }

    // Upsert use of home record
    const { data, error } = await supabase
      .from('use_of_home')
      .upsert(
        {
          user_id: user.id,
          tax_year: body.tax_year,
          calculation_method: body.calculation_method || 'simplified',
          hours_per_week: body.hours_per_week,
          weeks_per_year: body.weeks_per_year || 48,
          total_rooms: body.total_rooms,
          business_rooms: body.business_rooms || 1,
          cost_electricity: body.cost_electricity || 0,
          cost_gas: body.cost_gas || 0,
          cost_water: body.cost_water || 0,
          cost_council_tax: body.cost_council_tax || 0,
          cost_mortgage_interest: body.cost_mortgage_interest || 0,
          cost_rent: body.cost_rent || 0,
          cost_insurance: body.cost_insurance || 0,
          cost_broadband: body.cost_broadband || 0,
          cost_repairs: body.cost_repairs || 0,
          cost_other: body.cost_other || 0,
          simplified_amount: body.simplified_amount,
          actual_amount: body.actual_amount,
          recommended_method: body.recommended_method,
          final_amount: body.final_amount,
        },
        {
          onConflict: 'user_id,tax_year',
        }
      )
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}
