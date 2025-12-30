"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Home } from "lucide-react"
import type { Category, TransactionWithCategory, Property } from "@/types/database"

interface CategoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  categories: Category[]
  onSelect: (categoryId: string, propertyId?: string | null) => void
  transaction: TransactionWithCategory | null
}

export function CategoryDialog({
  open,
  onOpenChange,
  categories,
  onSelect,
  transaction,
}: CategoryDialogProps) {
  const [properties, setProperties] = useState<Property[]>([])
  const [selectedPropertyCategory, setSelectedPropertyCategory] = useState<Category | null>(null)
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("")

  // Fetch properties when dialog opens
  useEffect(() => {
    if (open) {
      fetch("/api/properties")
        .then((res) => res.json())
        .then((data) => setProperties(data.properties?.filter((p: Property) => p.is_active) || []))
        .catch(console.error)
    } else {
      // Reset state when dialog closes
      setSelectedPropertyCategory(null)
      setSelectedPropertyId("")
    }
  }, [open])

  // Filter categories by type
  const selfEmploymentIncome = categories.filter(
    (c) => c.type === "income" && !c.code.startsWith("property_")
  )
  const selfEmploymentExpenses = categories.filter(
    (c) => c.type === "expense" && !c.code.startsWith("property_")
  )
  const propertyIncome = categories.filter(
    (c) => c.type === "income" && c.code.startsWith("property_")
  )
  const propertyExpenses = categories.filter(
    (c) => c.type === "expense" && c.code.startsWith("property_")
  )
  const otherCategories = categories.filter(
    (c) => c.type === "personal" || c.type === "transfer"
  )

  const handlePropertyCategoryClick = (category: Category) => {
    if (properties.length === 0) {
      // No properties - just select category without property
      onSelect(category.id, null)
    } else if (properties.length === 1) {
      // Single property - auto-select it
      onSelect(category.id, properties[0].id)
    } else {
      // Multiple properties - show property selector
      setSelectedPropertyCategory(category)
    }
  }

  const handlePropertyConfirm = () => {
    if (selectedPropertyCategory) {
      onSelect(selectedPropertyCategory.id, selectedPropertyId || null)
      setSelectedPropertyCategory(null)
      setSelectedPropertyId("")
    }
  }

  // If we're in property selection mode, show that UI
  if (selectedPropertyCategory) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Select Property</DialogTitle>
            <DialogDescription>
              Assign this transaction to a rental property for SA105
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="p-3 bg-muted rounded-lg">
              <p className="font-medium">{selectedPropertyCategory.name}</p>
              <p className="text-sm text-muted-foreground">
                {transaction?.description}
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Property</label>
              <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a property..." />
                </SelectTrigger>
                <SelectContent>
                  {properties.map((property) => (
                    <SelectItem key={property.id} value={property.id}>
                      <div className="flex items-center gap-2">
                        <Home className="h-4 w-4" />
                        {property.name}
                        {property.ownership_percentage < 100 && (
                          <span className="text-muted-foreground">
                            ({property.ownership_percentage}%)
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSelectedPropertyCategory(null)}
            >
              Back
            </Button>
            <Button onClick={handlePropertyConfirm}>
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Select Category</DialogTitle>
          {transaction && (
            <DialogDescription>
              {transaction.description} • £{Math.abs(transaction.amount).toFixed(2)}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="space-y-4">
          {/* Self-Employment Income */}
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              Self-Employment Income
              <Badge variant="outline" className="text-green-600">SA103</Badge>
            </h4>
            <div className="grid gap-2">
              {selfEmploymentIncome.map((category) => (
                <CategoryButton
                  key={category.id}
                  category={category}
                  onClick={() => onSelect(category.id)}
                />
              ))}
            </div>
          </div>

          <Separator />

          {/* Self-Employment Expenses */}
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              Self-Employment Expenses
              <Badge variant="outline" className="text-red-600">SA103</Badge>
            </h4>
            <div className="grid gap-2">
              {selfEmploymentExpenses.map((category) => (
                <CategoryButton
                  key={category.id}
                  category={category}
                  onClick={() => onSelect(category.id)}
                />
              ))}
            </div>
          </div>

          {/* Property Income (SA105) */}
          {propertyIncome.length > 0 && (
            <>
              <Separator />
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Home className="h-4 w-4" />
                  Property Income
                  <Badge variant="outline" className="text-green-600">SA105</Badge>
                </h4>
                <div className="grid gap-2">
                  {propertyIncome.map((category) => (
                    <CategoryButton
                      key={category.id}
                      category={category}
                      onClick={() => handlePropertyCategoryClick(category)}
                      hasPropertyIndicator={properties.length > 0}
                    />
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Property Expenses (SA105) */}
          {propertyExpenses.length > 0 && (
            <>
              <Separator />
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Home className="h-4 w-4" />
                  Property Expenses
                  <Badge variant="outline" className="text-red-600">SA105</Badge>
                </h4>
                <div className="grid gap-2">
                  {propertyExpenses.map((category) => (
                    <CategoryButton
                      key={category.id}
                      category={category}
                      onClick={() => handlePropertyCategoryClick(category)}
                      hasPropertyIndicator={properties.length > 0}
                    />
                  ))}
                </div>
              </div>
            </>
          )}

          <Separator />

          {/* Other */}
          <div>
            <h4 className="text-sm font-medium mb-2">Other</h4>
            <div className="grid gap-2">
              {otherCategories.map((category) => (
                <CategoryButton
                  key={category.id}
                  category={category}
                  onClick={() => onSelect(category.id)}
                />
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function CategoryButton({
  category,
  onClick,
  hasPropertyIndicator,
}: {
  category: Category
  onClick: () => void
  hasPropertyIndicator?: boolean
}) {
  return (
    <Button
      variant="outline"
      className="justify-start h-auto py-2 px-3"
      onClick={onClick}
    >
      <div className="text-left flex-1">
        <div className="font-medium flex items-center gap-2">
          {category.name}
          {hasPropertyIndicator && (
            <Home className="h-3 w-3 text-muted-foreground" />
          )}
        </div>
        {category.description && (
          <div className="text-xs text-muted-foreground">{category.description}</div>
        )}
        {category.hmrc_box && (
          <Badge variant="secondary" className="mt-1 text-xs">
            {category.hmrc_box}
          </Badge>
        )}
      </div>
    </Button>
  )
}
