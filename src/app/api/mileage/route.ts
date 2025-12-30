import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { calculateMileageAllowance, calculateTripAllowance } from '@/lib/mileage'
import { getSubscription, canAccessFeature } from '@/lib/subscription'
import type { MileageTrip, VehicleType } from '@/types/database'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check feature access
    const subscription = await getSubscription(user.id)
    if (!canAccessFeature(subscription.tier, subscription.isLifetime, subscription.isTrial, 'mileage')) {
      return NextResponse.json(
        { error: 'Mileage tracking requires a Pro subscription', code: 'FEATURE_GATED' },
        { status: 403 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const taxYear = searchParams.get('tax_year')

    if (!taxYear) {
      return NextResponse.json({ error: 'tax_year is required' }, { status: 400 })
    }

    const { data: trips, error } = await supabase
      .from('mileage_trips')
      .select('*')
      .eq('user_id', user.id)
      .eq('tax_year', taxYear)
      .order('trip_date', { ascending: false })

    if (error) {
      console.error('[mileage] Query error:', error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const summary = calculateMileageAllowance(trips || [])

    return NextResponse.json({ trips: trips || [], summary })
  } catch (error) {
    console.error('[mileage] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch mileage trips' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check feature access
    const subscription = await getSubscription(user.id)
    if (!canAccessFeature(subscription.tier, subscription.isLifetime, subscription.isTrial, 'mileage')) {
      return NextResponse.json(
        { error: 'Mileage tracking requires a Pro subscription', code: 'FEATURE_GATED' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      tax_year,
      trip_date,
      description,
      from_location,
      to_location,
      miles,
      is_return_journey,
      vehicle_type,
    } = body

    // Validation
    if (!tax_year || !trip_date || !description || !miles || !vehicle_type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (miles <= 0 || miles > 1000) {
      return NextResponse.json(
        { error: 'Miles must be between 0.1 and 1000' },
        { status: 400 }
      )
    }

    if (!['car', 'motorcycle', 'bicycle'].includes(vehicle_type)) {
      return NextResponse.json(
        { error: 'Invalid vehicle type' },
        { status: 400 }
      )
    }

    // Get existing trips to calculate the allowance correctly
    const { data: existingTrips } = await supabase
      .from('mileage_trips')
      .select('*')
      .eq('user_id', user.id)
      .eq('tax_year', tax_year)
      .lt('trip_date', trip_date)
      .order('trip_date', { ascending: true })

    // Calculate cumulative miles for this vehicle type before this trip
    const cumulativeMiles = (existingTrips || [])
      .filter((t: MileageTrip) => t.vehicle_type === vehicle_type)
      .reduce((sum: number, t: MileageTrip) => {
        return sum + (t.is_return_journey ? t.miles * 2 : t.miles)
      }, 0)

    const calculatedAllowance = calculateTripAllowance(
      miles,
      vehicle_type as VehicleType,
      cumulativeMiles,
      is_return_journey || false
    )

    const { data: trip, error } = await supabase
      .from('mileage_trips')
      .insert({
        user_id: user.id,
        tax_year,
        trip_date,
        description,
        from_location: from_location || null,
        to_location: to_location || null,
        miles,
        is_return_journey: is_return_journey || false,
        vehicle_type,
        calculated_allowance: calculatedAllowance,
      })
      .select()
      .single()

    if (error) {
      console.error('[mileage] Insert error:', error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ trip })
  } catch (error) {
    console.error('[mileage] Error:', error)
    return NextResponse.json(
      { error: 'Failed to create mileage trip' },
      { status: 500 }
    )
  }
}
