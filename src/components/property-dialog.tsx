"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import type { Property } from "@/types/database"

interface PropertyDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  property?: Property | null
  onSuccess: () => void
}

export function PropertyDialog({
  open,
  onOpenChange,
  property,
  onSuccess,
}: PropertyDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    address_line1: "",
    address_line2: "",
    city: "",
    postcode: "",
    property_type: "residential",
    ownership_percentage: "100",
    has_mortgage: false,
  })

  useEffect(() => {
    if (property) {
      setFormData({
        name: property.name,
        address_line1: property.address_line1 || "",
        address_line2: property.address_line2 || "",
        city: property.city || "",
        postcode: property.postcode || "",
        property_type: property.property_type,
        ownership_percentage: property.ownership_percentage.toString(),
        has_mortgage: property.has_mortgage,
      })
    } else {
      setFormData({
        name: "",
        address_line1: "",
        address_line2: "",
        city: "",
        postcode: "",
        property_type: "residential",
        ownership_percentage: "100",
        has_mortgage: false,
      })
    }
  }, [property, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = property ? `/api/properties/${property.id}` : "/api/properties"
      const method = property ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          ownership_percentage: parseFloat(formData.ownership_percentage),
        }),
      })

      if (res.ok) {
        onSuccess()
      }
    } catch (error) {
      console.error("Failed to save property:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{property ? "Edit Property" : "Add Property"}</DialogTitle>
            <DialogDescription>
              {property
                ? "Update your property details."
                : "Add a new rental property to track income and expenses."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Property Name *</Label>
              <Input
                id="name"
                placeholder="e.g., 42 Oak Street"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="address_line1">Address Line 1</Label>
              <Input
                id="address_line1"
                placeholder="Street address"
                value={formData.address_line1}
                onChange={(e) => setFormData({ ...formData, address_line1: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="address_line2">Address Line 2</Label>
              <Input
                id="address_line2"
                placeholder="Apartment, unit, etc."
                value={formData.address_line2}
                onChange={(e) => setFormData({ ...formData, address_line2: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  placeholder="City"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="postcode">Postcode</Label>
                <Input
                  id="postcode"
                  placeholder="Postcode"
                  value={formData.postcode}
                  onChange={(e) => setFormData({ ...formData, postcode: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="property_type">Property Type</Label>
                <Select
                  value={formData.property_type}
                  onValueChange={(value) => setFormData({ ...formData, property_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="residential">Residential</SelectItem>
                    <SelectItem value="commercial">Commercial</SelectItem>
                    <SelectItem value="fhl">Furnished Holiday Let</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="ownership_percentage">Ownership %</Label>
                <Input
                  id="ownership_percentage"
                  type="number"
                  min="1"
                  max="100"
                  step="0.01"
                  value={formData.ownership_percentage}
                  onChange={(e) =>
                    setFormData({ ...formData, ownership_percentage: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="has_mortgage">Has Mortgage</Label>
                <p className="text-sm text-muted-foreground">
                  Enable to track finance costs for Section 24 tax credit
                </p>
              </div>
              <Switch
                id="has_mortgage"
                checked={formData.has_mortgage}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, has_mortgage: checked })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !formData.name}>
              {loading ? "Saving..." : property ? "Save Changes" : "Add Property"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
