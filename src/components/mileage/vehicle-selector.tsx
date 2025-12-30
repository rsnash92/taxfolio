"use client"

import { cn } from "@/lib/utils"
import { VEHICLE_INFO } from "@/lib/mileage"
import type { VehicleType } from "@/types/database"

interface VehicleSelectorProps {
  value: VehicleType
  onChange: (type: VehicleType) => void
}

const vehicles: { type: VehicleType; label: string; icon: string; rate: string }[] = [
  { type: 'car', label: 'Car/Van', icon: '🚗', rate: '45p/25p per mile' },
  { type: 'motorcycle', label: 'Motorcycle', icon: '🏍️', rate: '24p per mile' },
  { type: 'bicycle', label: 'Bicycle', icon: '🚲', rate: '20p per mile' },
]

export function VehicleSelector({ value, onChange }: VehicleSelectorProps) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {vehicles.map((vehicle) => (
        <button
          key={vehicle.type}
          type="button"
          onClick={() => onChange(vehicle.type)}
          className={cn(
            "flex flex-col items-center p-4 rounded-lg border-2 transition-all",
            value === vehicle.type
              ? "border-[#15e49e] bg-[#15e49e]/10"
              : "border-border hover:border-[#15e49e]/50"
          )}
        >
          <span className="text-2xl mb-1">{vehicle.icon}</span>
          <span className="font-medium text-sm">{vehicle.label}</span>
          <span className="text-xs text-muted-foreground mt-1">{vehicle.rate}</span>
        </button>
      ))}
    </div>
  )
}
