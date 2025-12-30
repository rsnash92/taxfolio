import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface RouteContext {
  params: Promise<{ id: string }>
}

// GET /api/properties/[id] - Get a single property
export async function GET(request: NextRequest, context: RouteContext) {
  const supabase = await createClient()
  const { id } = await context.params

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: property, error } = await supabase
    .from('properties')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error) {
    return NextResponse.json({ error: 'Property not found' }, { status: 404 })
  }

  return NextResponse.json({ property })
}

// PUT /api/properties/[id] - Update a property
export async function PUT(request: NextRequest, context: RouteContext) {
  const supabase = await createClient()
  const { id } = await context.params

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()

    const { data: property, error } = await supabase
      .from('properties')
      .update({
        name: body.name,
        address_line1: body.address_line1,
        address_line2: body.address_line2,
        city: body.city,
        postcode: body.postcode,
        country: body.country,
        property_type: body.property_type,
        ownership_percentage: body.ownership_percentage,
        ownership_start_date: body.ownership_start_date,
        ownership_end_date: body.ownership_end_date,
        has_mortgage: body.has_mortgage,
        is_active: body.is_active,
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ property })
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}

// DELETE /api/properties/[id] - Delete a property (soft delete)
export async function DELETE(request: NextRequest, context: RouteContext) {
  const supabase = await createClient()
  const { id } = await context.params

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Soft delete by setting is_active to false
  const { error } = await supabase
    .from('properties')
    .update({ is_active: false })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
