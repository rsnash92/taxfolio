import type { MileageTrip, MileageSummary, VehicleType } from '@/types/database'

// HMRC Approved Mileage Allowance Payment (AMAP) rates 2024-25
export const MILEAGE_RATES = {
  car: { first10k: 0.45, after10k: 0.25 },
  motorcycle: { first10k: 0.24, after10k: 0.24 },
  bicycle: { first10k: 0.20, after10k: 0.20 },
} as const

export const VEHICLE_INFO = {
  car: { label: 'Car/Van', icon: '🚗', rateDisplay: '45p/25p per mile' },
  motorcycle: { label: 'Motorcycle', icon: '🏍️', rateDisplay: '24p per mile' },
  bicycle: { label: 'Bicycle', icon: '🚲', rateDisplay: '20p per mile' },
} as const

/**
 * Calculate the effective miles for a trip (accounting for return journeys)
 */
export function getEffectiveMiles(trip: MileageTrip): number {
  return trip.is_return_journey ? trip.miles * 2 : trip.miles
}

/**
 * Calculate mileage allowance for a list of trips
 *
 * The 10k threshold applies per vehicle type - each vehicle type
 * has its own 10k allowance before the rate drops.
 */
export function calculateMileageAllowance(trips: MileageTrip[]): MileageSummary {
  // Initialize summary by vehicle type
  const byVehicle = {
    car: { miles: 0, allowance: 0 },
    motorcycle: { miles: 0, allowance: 0 },
    bicycle: { miles: 0, allowance: 0 },
  }

  // Sort trips by date to apply threshold correctly
  const sortedTrips = [...trips].sort(
    (a, b) => new Date(a.trip_date).getTime() - new Date(b.trip_date).getTime()
  )

  // Track cumulative miles per vehicle type
  const cumulativeMiles = { car: 0, motorcycle: 0, bicycle: 0 }

  for (const trip of sortedTrips) {
    const effectiveMiles = getEffectiveMiles(trip)
    const vehicleType = trip.vehicle_type
    const rates = MILEAGE_RATES[vehicleType]

    // Calculate allowance based on where we are in the 10k threshold
    let allowance = 0
    const previousMiles = cumulativeMiles[vehicleType]
    const newTotal = previousMiles + effectiveMiles

    if (previousMiles >= 10000) {
      // All miles at lower rate
      allowance = effectiveMiles * rates.after10k
    } else if (newTotal <= 10000) {
      // All miles at higher rate
      allowance = effectiveMiles * rates.first10k
    } else {
      // Split across threshold
      const milesAtHighRate = 10000 - previousMiles
      const milesAtLowRate = effectiveMiles - milesAtHighRate
      allowance = (milesAtHighRate * rates.first10k) + (milesAtLowRate * rates.after10k)
    }

    cumulativeMiles[vehicleType] = newTotal
    byVehicle[vehicleType].miles += effectiveMiles
    byVehicle[vehicleType].allowance += allowance
  }

  const totalMiles = byVehicle.car.miles + byVehicle.motorcycle.miles + byVehicle.bicycle.miles
  const totalAllowance = byVehicle.car.allowance + byVehicle.motorcycle.allowance + byVehicle.bicycle.allowance

  return {
    totalMiles,
    totalAllowance,
    tripCount: trips.length,
    byVehicle,
  }
}

/**
 * Calculate the allowance for a single trip given the current cumulative miles
 */
export function calculateTripAllowance(
  miles: number,
  vehicleType: VehicleType,
  cumulativeMilesBefore: number,
  isReturnJourney: boolean
): number {
  const effectiveMiles = isReturnJourney ? miles * 2 : miles
  const rates = MILEAGE_RATES[vehicleType]
  const newTotal = cumulativeMilesBefore + effectiveMiles

  if (cumulativeMilesBefore >= 10000) {
    return effectiveMiles * rates.after10k
  } else if (newTotal <= 10000) {
    return effectiveMiles * rates.first10k
  } else {
    const milesAtHighRate = 10000 - cumulativeMilesBefore
    const milesAtLowRate = effectiveMiles - milesAtHighRate
    return (milesAtHighRate * rates.first10k) + (milesAtLowRate * rates.after10k)
  }
}

/**
 * Format miles for display
 */
export function formatMiles(miles: number): string {
  return miles.toLocaleString('en-GB', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
}

/**
 * Format currency for display
 */
export function formatAllowance(amount: number): string {
  return `£${amount.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

/**
 * Get vehicle type display info
 */
export function getVehicleInfo(type: VehicleType) {
  return VEHICLE_INFO[type]
}

/**
 * Calculate the progress towards 10k miles for a vehicle type
 */
export function getMileageProgress(miles: number): { percentage: number; remaining: number } {
  const percentage = Math.min((miles / 10000) * 100, 100)
  const remaining = Math.max(10000 - miles, 0)
  return { percentage, remaining }
}
