"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { formatMiles, formatAllowance, getMileageProgress, VEHICLE_INFO } from "@/lib/mileage"
import type { MileageSummary as MileageSummaryType, VehicleType } from "@/types/database"

interface MileageSummaryProps {
  summary: MileageSummaryType
}

export function MileageSummary({ summary }: MileageSummaryProps) {
  const vehicleTypes: VehicleType[] = ['car', 'motorcycle', 'bicycle']
  const carProgress = getMileageProgress(summary.byVehicle.car.miles)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mileage Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Totals */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Total Miles</p>
            <p className="text-3xl font-bold">{formatMiles(summary.totalMiles)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Allowance</p>
            <p className="text-3xl font-bold text-[#15e49e]">{formatAllowance(summary.totalAllowance)}</p>
          </div>
        </div>

        {/* By Vehicle */}
        <div className="grid grid-cols-3 gap-3">
          {vehicleTypes.map((type) => {
            const info = VEHICLE_INFO[type]
            const data = summary.byVehicle[type]
            return (
              <div
                key={type}
                className="p-3 rounded-lg bg-muted/50 text-center"
              >
                <span className="text-xl">{info.icon}</span>
                <p className="font-medium text-sm mt-1">{info.label}</p>
                <p className="text-lg font-semibold">{formatMiles(data.miles)} mi</p>
                <p className="text-sm text-muted-foreground">{formatAllowance(data.allowance)}</p>
              </div>
            )
          })}
        </div>

        {/* 10k Progress for Car/Van */}
        {summary.byVehicle.car.miles > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progress to 10,000 miles (car/van)</span>
              <span className="font-medium">
                {formatMiles(summary.byVehicle.car.miles)} / 10,000
              </span>
            </div>
            <Progress value={carProgress.percentage} className="h-2" />
            {carProgress.remaining > 0 && (
              <p className="text-xs text-muted-foreground">
                {formatMiles(carProgress.remaining)} miles remaining at 45p rate
              </p>
            )}
            {carProgress.remaining === 0 && (
              <p className="text-xs text-muted-foreground">
                Now claiming at 25p per mile rate
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
