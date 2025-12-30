"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Plus } from "lucide-react"

interface MileageEmptyStateProps {
  onAddTrip: () => void
}

export function MileageEmptyState({ onAddTrip }: MileageEmptyStateProps) {
  return (
    <Card>
      <CardContent className="py-12">
        <div className="text-center space-y-4">
          <span className="text-6xl">🚗</span>
          <div>
            <h3 className="text-xl font-semibold mb-2">No mileage trips logged yet</h3>
            <p className="text-muted-foreground max-w-sm mx-auto">
              Track your business travel to claim up to 45p per mile. Most freelancers miss this deduction!
            </p>
          </div>
          <Button onClick={onAddTrip} className="bg-[#15e49e] hover:bg-[#12c98a] text-black">
            <Plus className="mr-2 h-4 w-4" />
            Add Your First Trip
          </Button>

          <Card className="mt-6 bg-muted/50 border-dashed max-w-md mx-auto">
            <CardContent className="pt-4 text-left text-sm">
              <p className="font-medium flex items-center gap-2 mb-2">
                <span>💡</span> Common claimable trips include:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-6">
                <li>Client meetings</li>
                <li>Supplier visits</li>
                <li>Bank or post office runs</li>
                <li>Networking events</li>
                <li>Training courses</li>
              </ul>
              <p className="mt-3 text-muted-foreground text-xs">
                You cannot claim for regular commuting to a fixed workplace.
              </p>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  )
}
