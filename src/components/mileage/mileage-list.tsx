"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MileageTripCard } from "./mileage-trip-card"
import type { MileageTrip } from "@/types/database"

interface MileageListProps {
  trips: MileageTrip[]
  onEdit: (trip: MileageTrip) => void
  onDelete: (trip: MileageTrip) => void
}

export function MileageList({ trips, onEdit, onDelete }: MileageListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Trips</CardTitle>
        <CardDescription>
          {trips.length} trip{trips.length !== 1 ? 's' : ''} logged this tax year
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {trips.map((trip) => (
          <MileageTripCard
            key={trip.id}
            trip={trip}
            onEdit={() => onEdit(trip)}
            onDelete={() => onDelete(trip)}
          />
        ))}
      </CardContent>
    </Card>
  )
}
