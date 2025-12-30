import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { calculateTripAllowance } from '@/lib/mileage'
import type { MileageTrip, VehicleType } from '@/types/database'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const {
      trip_date,
      description,
      from_location,
      to_location,
      miles,
      is_return_journey,
      vehicle_type,
    } = body

    // Validation
    if (miles !== undefined && (miles <= 0 || miles > 1000)) {
      return NextResponse.json(
        { error: 'Miles must be between 0.1 and 1000' },
        { status: 400 }
      )
    }

    if (vehicle_type && !['car', 'motorcycle', 'bicycle'].includes(vehicle_type)) {
      return NextResponse.json(
        { error: 'Invalid vehicle type' },
        { status: 400 }
      )
    }

    // Get the existing trip
    const { data: existingTrip, error: fetchError } = await supabase
      .from('mileage_trips')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !existingTrip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
    }

    // Build update object
    const updateData: Record<string, unknown> = {}
    if (trip_date !== undefined) updateData.trip_date = trip_date
    if (description !== undefined) updateData.description = description
    if (from_location !== undefined) updateData.from_location = from_location
    if (to_location !== undefined) updateData.to_location = to_location
    if (miles !== undefined) updateData.miles = miles
    if (is_return_journey !== undefined) updateData.is_return_journey = is_return_journey
    if (vehicle_type !== undefined) updateData.vehicle_type = vehicle_type

    // Recalculate allowance if miles, vehicle_type, or is_return_journey changed
    if (miles !== undefined || vehicle_type !== undefined || is_return_journey !== undefined) {
      const finalMiles = miles ?? existingTrip.miles
      const finalVehicleType = vehicle_type ?? existingTrip.vehicle_type
      const finalIsReturn = is_return_journey ?? existingTrip.is_return_journey
      const finalTripDate = trip_date ?? existingTrip.trip_date

      // Get trips before this one to calculate cumulative miles
      const { data: priorTrips } = await supabase
        .from('mileage_trips')
        .select('*')
        .eq('user_id', user.id)
        .eq('tax_year', existingTrip.tax_year)
        .lt('trip_date', finalTripDate)
        .neq('id', id)
        .order('trip_date', { ascending: true })

      const cumulativeMiles = (priorTrips || [])
        .filter((t: MileageTrip) => t.vehicle_type === finalVehicleType)
        .reduce((sum: number, t: MileageTrip) => {
          return sum + (t.is_return_journey ? t.miles * 2 : t.miles)
        }, 0)

      updateData.calculated_allowance = calculateTripAllowance(
        finalMiles,
        finalVehicleType as VehicleType,
        cumulativeMiles,
        finalIsReturn
      )
    }

    const { data: trip, error } = await supabase
      .from('mileage_trips')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('[mileage] Update error:', error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ trip })
  } catch (error) {
    console.error('[mileage] Error:', error)
    return NextResponse.json(
      { error: 'Failed to update mileage trip' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const { error } = await supabase
      .from('mileage_trips')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('[mileage] Delete error:', error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[mileage] Error:', error)
    return NextResponse.json(
      { error: 'Failed to delete mileage trip' },
      { status: 500 }
    )
  }
}
