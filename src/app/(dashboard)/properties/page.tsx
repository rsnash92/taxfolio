"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Home, Building2, Palmtree, MoreVertical, Pencil, Trash2 } from "lucide-react"
import { PropertyDialog } from "@/components/property-dialog"
import { FinanceCostsDialog } from "@/components/finance-costs-dialog"
import type { Property } from "@/types/database"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingProperty, setEditingProperty] = useState<Property | null>(null)
  const [financeCostsProperty, setFinanceCostsProperty] = useState<Property | null>(null)
  const [deleteProperty, setDeleteProperty] = useState<Property | null>(null)

  const fetchProperties = async () => {
    try {
      const res = await fetch("/api/properties")
      const data = await res.json()
      setProperties(data.properties?.filter((p: Property) => p.is_active) || [])
    } catch (error) {
      console.error("Failed to fetch properties:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProperties()
  }, [])

  const handleDelete = async () => {
    if (!deleteProperty) return

    try {
      await fetch(`/api/properties/${deleteProperty.id}`, { method: "DELETE" })
      setDeleteProperty(null)
      fetchProperties()
    } catch (error) {
      console.error("Failed to delete property:", error)
    }
  }

  const getPropertyIcon = (type: string) => {
    switch (type) {
      case "commercial":
        return <Building2 className="h-5 w-5" />
      case "fhl":
        return <Palmtree className="h-5 w-5" />
      default:
        return <Home className="h-5 w-5" />
    }
  }

  const getPropertyTypeLabel = (type: string) => {
    switch (type) {
      case "commercial":
        return "Commercial"
      case "fhl":
        return "Furnished Holiday Let"
      default:
        return "Residential"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Properties</h1>
          <p className="text-muted-foreground">
            Manage your rental properties for SA105
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Property
        </Button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-muted rounded w-1/3" />
                <div className="h-4 bg-muted rounded w-1/2 mt-2" />
              </CardHeader>
            </Card>
          ))}
        </div>
      ) : properties.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Home className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No properties yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Add your rental properties to track income, expenses, and generate SA105 data.
            </p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Property
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {properties.map((property) => (
            <Card key={property.id}>
              <CardHeader className="flex flex-row items-start justify-between space-y-0">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    {getPropertyIcon(property.property_type)}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{property.name}</CardTitle>
                    <CardDescription>
                      {property.address_line1 && (
                        <span>
                          {property.address_line1}
                          {property.city && `, ${property.city}`}
                          {property.postcode && ` ${property.postcode}`}
                        </span>
                      )}
                      {!property.address_line1 && "No address provided"}
                    </CardDescription>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setEditingProperty(property)}>
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setFinanceCostsProperty(property)}>
                      <Building2 className="h-4 w-4 mr-2" />
                      Finance Costs
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => setDeleteProperty(property)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Type:</span>
                    <span>{getPropertyTypeLabel(property.property_type)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Ownership:</span>
                    <span>{property.ownership_percentage}%</span>
                  </div>
                  {property.has_mortgage && (
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Mortgage:</span>
                      <span className="text-amber-500">Yes</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Property Dialog */}
      <PropertyDialog
        open={dialogOpen || !!editingProperty}
        onOpenChange={(open) => {
          if (!open) {
            setDialogOpen(false)
            setEditingProperty(null)
          }
        }}
        property={editingProperty}
        onSuccess={() => {
          setDialogOpen(false)
          setEditingProperty(null)
          fetchProperties()
        }}
      />

      {/* Finance Costs Dialog */}
      {financeCostsProperty && (
        <FinanceCostsDialog
          open={!!financeCostsProperty}
          onOpenChange={(open) => {
            if (!open) setFinanceCostsProperty(null)
          }}
          property={financeCostsProperty}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteProperty} onOpenChange={(open) => !open && setDeleteProperty(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Property</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteProperty?.name}&quot;? This will remove the
              property from your list but keep any associated transactions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
