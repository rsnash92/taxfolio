"use client"

import { useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { Plus, RefreshCw } from "lucide-react"
import { MileageSummary } from "@/components/mileage/mileage-summary"
import { MileageList } from "@/components/mileage/mileage-list"
import { MileageEmptyState } from "@/components/mileage/mileage-empty-state"
import { MileageFormDialog } from "@/components/mileage/mileage-form-dialog"
import type { MileageTrip, MileageSummary as MileageSummaryType, VehicleType } from "@/types/database"

function getCurrentTaxYear(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const day = now.getDate()

  if (month > 4 || (month === 4 && day >= 6)) {
    return `${year}-${(year + 1).toString().slice(-2)}`
  } else {
    return `${year - 1}-${year.toString().slice(-2)}`
  }
}

function getTaxYearOptions(): string[] {
  const currentYear = new Date().getFullYear()
  const years: string[] = []
  for (let i = 0; i < 4; i++) {
    const startYear = currentYear - i
    years.push(`${startYear}-${(startYear + 1).toString().slice(-2)}`)
  }
  return years
}

export default function MileagePage() {
  const [trips, setTrips] = useState<MileageTrip[]>([])
  const [summary, setSummary] = useState<MileageSummaryType | null>(null)
  const [loading, setLoading] = useState(true)
  const [taxYear, setTaxYear] = useState(getCurrentTaxYear())
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTrip, setEditingTrip] = useState<MileageTrip | null>(null)
  const [deleteTrip, setDeleteTrip] = useState<MileageTrip | null>(null)

  const taxYearOptions = getTaxYearOptions()

  const fetchMileage = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/mileage?tax_year=${taxYear}`)
      const data = await res.json()
      setTrips(data.trips || [])
      setSummary(data.summary || null)
    } catch {
      toast.error("Failed to fetch mileage data")
    } finally {
      setLoading(false)
    }
  }, [taxYear])

  useEffect(() => {
    fetchMileage()
  }, [fetchMileage])

  const handleAddTrip = () => {
    setEditingTrip(null)
    setDialogOpen(true)
  }

  const handleEditTrip = (trip: MileageTrip) => {
    setEditingTrip(trip)
    setDialogOpen(true)
  }

  const handleSaveTrip = async (data: {
    trip_date: string
    description: string
    from_location: string
    to_location: string
    miles: number
    is_return_journey: boolean
    vehicle_type: VehicleType
  }) => {
    try {
      if (editingTrip) {
        const res = await fetch(`/api/mileage/${editingTrip.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })
        if (!res.ok) throw new Error()
        toast.success("Trip updated")
      } else {
        const res = await fetch('/api/mileage', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...data, tax_year: taxYear }),
        })
        if (!res.ok) throw new Error()
        toast.success("Trip added")
      }
      await fetchMileage()
    } catch {
      toast.error(editingTrip ? "Failed to update trip" : "Failed to add trip")
      throw new Error()
    }
  }

  const handleDeleteTrip = async () => {
    if (!deleteTrip) return

    try {
      const res = await fetch(`/api/mileage/${deleteTrip.id}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error()
      toast.success("Trip deleted")
      await fetchMileage()
    } catch {
      toast.error("Failed to delete trip")
    } finally {
      setDeleteTrip(null)
    }
  }

  // Calculate cumulative miles for the form preview
  const cumulativeMiles = {
    car: summary?.byVehicle.car.miles || 0,
    motorcycle: summary?.byVehicle.motorcycle.miles || 0,
    bicycle: summary?.byVehicle.bicycle.miles || 0,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mileage Tracker</h1>
          <div className="flex items-center gap-2 text-muted-foreground">
            <span>Tax Year</span>
            <Select value={taxYear} onValueChange={setTaxYear}>
              <SelectTrigger className="w-[120px] h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {taxYearOptions.map((year) => (
                  <SelectItem key={year} value={year}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleAddTrip} className="bg-[#15e49e] hover:bg-[#12c98a] text-black">
            <Plus className="mr-2 h-4 w-4" />
            Add Trip
          </Button>
          <Button variant="outline" onClick={fetchMileage}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-20" />
                <Skeleton className="h-20" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Skeleton className="h-24" />
                <Skeleton className="h-24" />
                <Skeleton className="h-24" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-20" />
              ))}
            </CardContent>
          </Card>
        </div>
      ) : trips.length === 0 ? (
        <MileageEmptyState onAddTrip={handleAddTrip} />
      ) : (
        <div className="space-y-6">
          {summary && <MileageSummary summary={summary} />}
          <MileageList
            trips={trips}
            onEdit={handleEditTrip}
            onDelete={(trip) => setDeleteTrip(trip)}
          />
        </div>
      )}

      {/* Add/Edit Dialog */}
      <MileageFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        trip={editingTrip}
        taxYear={taxYear}
        cumulativeMiles={cumulativeMiles}
        onSave={handleSaveTrip}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTrip} onOpenChange={(open) => !open && setDeleteTrip(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Trip</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this trip? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTrip}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
