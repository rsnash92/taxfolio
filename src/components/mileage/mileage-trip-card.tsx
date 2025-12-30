"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import { formatMiles, formatAllowance, getVehicleInfo, getEffectiveMiles } from "@/lib/mileage"
import type { MileageTrip } from "@/types/database"

interface MileageTripCardProps {
  trip: MileageTrip
  onEdit: () => void
  onDelete: () => void
}

export function MileageTripCard({ trip, onEdit, onDelete }: MileageTripCardProps) {
  const vehicleInfo = getVehicleInfo(trip.vehicle_type)
  const effectiveMiles = getEffectiveMiles(trip)
  const formattedDate = new Date(trip.trip_date).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  return (
    <div className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors">
      <div className="flex items-center gap-4">
        <span className="text-2xl">{vehicleInfo.icon}</span>
        <div>
          <p className="font-medium">{trip.description}</p>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{formattedDate}</span>
            <span>•</span>
            <span>
              {formatMiles(effectiveMiles)} miles
              {trip.is_return_journey && ' (return)'}
            </span>
            {(trip.from_location || trip.to_location) && (
              <>
                <span>•</span>
                <span>
                  {trip.from_location && trip.to_location
                    ? `${trip.from_location} → ${trip.to_location}`
                    : trip.from_location || trip.to_location}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <span className="font-semibold text-[#15e49e]">
          {formatAllowance(trip.calculated_allowance || 0)}
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDelete} className="text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
