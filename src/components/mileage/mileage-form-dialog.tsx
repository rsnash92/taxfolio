"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { VehicleSelector } from "./vehicle-selector"
import { calculateTripAllowance, formatAllowance, MILEAGE_RATES } from "@/lib/mileage"
import type { MileageTrip, VehicleType } from "@/types/database"
import { Loader2 } from "lucide-react"

interface MileageFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  trip?: MileageTrip | null
  taxYear: string
  cumulativeMiles: { car: number; motorcycle: number; bicycle: number }
  onSave: (data: {
    trip_date: string
    description: string
    from_location: string
    to_location: string
    miles: number
    is_return_journey: boolean
    vehicle_type: VehicleType
  }) => Promise<void>
}

export function MileageFormDialog({
  open,
  onOpenChange,
  trip,
  taxYear,
  cumulativeMiles,
  onSave,
}: MileageFormDialogProps) {
  const [loading, setLoading] = useState(false)
  const [vehicleType, setVehicleType] = useState<VehicleType>('car')
  const [tripDate, setTripDate] = useState('')
  const [description, setDescription] = useState('')
  const [fromLocation, setFromLocation] = useState('')
  const [toLocation, setToLocation] = useState('')
  const [miles, setMiles] = useState('')
  const [isReturnJourney, setIsReturnJourney] = useState(false)

  const isEditing = !!trip

  // Reset form when dialog opens/closes or trip changes
  useEffect(() => {
    if (open) {
      if (trip) {
        setVehicleType(trip.vehicle_type)
        setTripDate(trip.trip_date)
        setDescription(trip.description)
        setFromLocation(trip.from_location || '')
        setToLocation(trip.to_location || '')
        setMiles(trip.miles.toString())
        setIsReturnJourney(trip.is_return_journey)
      } else {
        setVehicleType('car')
        setTripDate(new Date().toISOString().split('T')[0])
        setDescription('')
        setFromLocation('')
        setToLocation('')
        setMiles('')
        setIsReturnJourney(false)
      }
    }
  }, [open, trip])

  // Calculate preview allowance
  const milesNum = parseFloat(miles) || 0
  const previewAllowance = milesNum > 0
    ? calculateTripAllowance(
        milesNum,
        vehicleType,
        cumulativeMiles[vehicleType],
        isReturnJourney
      )
    : 0

  const effectiveMiles = isReturnJourney ? milesNum * 2 : milesNum
  const rates = MILEAGE_RATES[vehicleType]
  const rateUsed = cumulativeMiles[vehicleType] + effectiveMiles <= 10000
    ? rates.first10k
    : rates.after10k

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!description || !miles || !tripDate) return

    setLoading(true)
    try {
      await onSave({
        trip_date: tripDate,
        description,
        from_location: fromLocation,
        to_location: toLocation,
        miles: parseFloat(miles),
        is_return_journey: isReturnJourney,
        vehicle_type: vehicleType,
      })
      onOpenChange(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Trip' : 'Add Business Trip'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Vehicle Type */}
          <div className="space-y-2">
            <Label>Vehicle Type</Label>
            <VehicleSelector value={vehicleType} onChange={setVehicleType} />
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="trip_date">Date</Label>
            <Input
              id="trip_date"
              type="date"
              value={tripDate}
              onChange={(e) => setTripDate(e.target.value)}
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Input
              id="description"
              placeholder="e.g., Client meeting - Acme Corp"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              minLength={3}
            />
          </div>

          {/* From/To */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="from_location">From (optional)</Label>
              <Input
                id="from_location"
                placeholder="e.g., Home office"
                value={fromLocation}
                onChange={(e) => setFromLocation(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="to_location">To (optional)</Label>
              <Input
                id="to_location"
                placeholder="e.g., Client office"
                value={toLocation}
                onChange={(e) => setToLocation(e.target.value)}
              />
            </div>
          </div>

          {/* Miles */}
          <div className="space-y-2">
            <Label htmlFor="miles">Miles (one way) *</Label>
            <Input
              id="miles"
              type="number"
              step="0.1"
              min="0.1"
              max="1000"
              placeholder="e.g., 45"
              value={miles}
              onChange={(e) => setMiles(e.target.value)}
              required
            />
          </div>

          {/* Return Journey */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_return_journey"
              checked={isReturnJourney}
              onCheckedChange={(checked) => setIsReturnJourney(checked === true)}
            />
            <Label htmlFor="is_return_journey" className="cursor-pointer">
              Return journey (doubles the miles)
            </Label>
          </div>

          {/* Preview */}
          {milesNum > 0 && (
            <div className="p-4 rounded-lg bg-muted/50 space-y-1">
              <p className="text-sm font-medium">
                Calculated allowance: <span className="text-[#15e49e]">{formatAllowance(previewAllowance)}</span>
              </p>
              <p className="text-xs text-muted-foreground">
                {effectiveMiles.toFixed(1)} miles × {(rateUsed * 100).toFixed(0)}p
              </p>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !description || !miles || !tripDate}
              className="bg-[#15e49e] hover:bg-[#12c98a] text-black"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? 'Update Trip' : 'Save Trip'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
