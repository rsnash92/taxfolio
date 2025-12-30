import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/properties/finance-costs - Get finance costs for a tax year
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

  const { data: financeCosts, error } = await supabase
    .from('property_finance_costs')
    .select('*, property:properties(id, name)')
    .eq('user_id', user.id)
    .eq('tax_year', taxYear)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ finance_costs: financeCosts })
}

// POST /api/properties/finance-costs - Upsert finance costs for a property
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

    if (!body.property_id || !body.tax_year) {
      return NextResponse.json(
        { error: 'property_id and tax_year are required' },
        { status: 400 }
      )
    }

    // Verify property belongs to user
    const { data: property } = await supabase
      .from('properties')
      .select('id')
      .eq('id', body.property_id)
      .eq('user_id', user.id)
      .single()

    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 })
    }

    // Upsert finance costs
    const { data: financeCost, error } = await supabase
      .from('property_finance_costs')
      .upsert(
        {
          user_id: user.id,
          property_id: body.property_id,
          tax_year: body.tax_year,
          mortgage_interest: body.mortgage_interest || 0,
          other_finance_costs: body.other_finance_costs || 0,
        },
        {
          onConflict: 'property_id,tax_year',
        }
      )
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ finance_cost: financeCost })
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}
