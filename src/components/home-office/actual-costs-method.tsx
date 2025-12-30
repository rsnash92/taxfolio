"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Receipt, Check } from "lucide-react"
import type { ActualBreakdown } from "@/lib/home-office"

interface ActualCostsInputs {
  electricity: number
  gas: number
  water: number
  councilTax: number
  mortgageInterest: number
  rent: number
  insurance: number
  broadband: number
  repairs: number
  other: number
}

interface ActualCostsMethodProps {
  totalRooms: number
  businessRooms: number
  costs: ActualCostsInputs
  onTotalRoomsChange: (rooms: number) => void
  onBusinessRoomsChange: (rooms: number) => void
  onCostsChange: (costs: ActualCostsInputs) => void
  result: number
  breakdown?: ActualBreakdown
  isSelected: boolean
  onSelect: () => void
}

export function ActualCostsMethod({
  totalRooms,
  businessRooms,
  costs,
  onTotalRoomsChange,
  onBusinessRoomsChange,
  onCostsChange,
  result,
  breakdown,
  isSelected,
  onSelect,
}: ActualCostsMethodProps) {
  const formatCurrency = (amount: number) =>
    `£${amount.toLocaleString("en-GB", { minimumFractionDigits: 2 })}`

  const updateCost = (key: keyof ActualCostsInputs, value: number) => {
    onCostsChange({ ...costs, [key]: value })
  }

  const costFields: { key: keyof ActualCostsInputs; label: string }[] = [
    { key: "electricity", label: "Electricity" },
    { key: "gas", label: "Gas / Heating" },
    { key: "water", label: "Water (if metered)" },
    { key: "councilTax", label: "Council Tax" },
    { key: "mortgageInterest", label: "Mortgage Interest (not repayments)" },
    { key: "rent", label: "Rent (if renting)" },
    { key: "insurance", label: "Home Insurance" },
    { key: "broadband", label: "Broadband / Phone" },
    { key: "repairs", label: "Repairs & Maintenance" },
    { key: "other", label: "Other" },
  ]

  return (
    <div
      className={`p-5 rounded-xl border cursor-pointer transition-all ${
        isSelected
          ? "border-[#15e49e] bg-[#15e49e]/5"
          : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700"
      }`}
      onClick={onSelect}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Receipt className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-semibold">Actual Costs</h3>
        </div>
        {isSelected && <Check className="h-5 w-5 text-[#15e49e]" />}
      </div>

      <p className="text-sm text-muted-foreground mb-4">
        Proportion of actual household costs. Often gives higher deduction.
      </p>

      {/* Room Proportion */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <Label htmlFor="totalRooms">Total rooms</Label>
          <Input
            id="totalRooms"
            type="number"
            min="1"
            max="20"
            value={totalRooms || ""}
            onChange={(e) => onTotalRoomsChange(parseInt(e.target.value) || 1)}
            className="mt-1"
            onClick={(e) => e.stopPropagation()}
          />
          <p className="text-xs text-muted-foreground mt-1">Excl. bathrooms</p>
        </div>
        <div>
          <Label htmlFor="businessRooms">Business rooms</Label>
          <Input
            id="businessRooms"
            type="number"
            min="1"
            max={totalRooms}
            value={businessRooms || ""}
            onChange={(e) => onBusinessRoomsChange(parseInt(e.target.value) || 1)}
            className="mt-1"
            onClick={(e) => e.stopPropagation()}
          />
          <p className="text-xs text-muted-foreground mt-1">Used for work</p>
        </div>
      </div>

      {/* Proportion Display */}
      {breakdown && (
        <div className="mb-4 p-3 bg-muted rounded-lg">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Business proportion</span>
            <span className="font-medium">
              {(breakdown.roomProportion * 100).toFixed(0)}%
            </span>
          </div>
        </div>
      )}

      {/* Annual Costs */}
      <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
        <p className="text-sm font-medium text-muted-foreground">Annual household costs:</p>
        {costFields.map((field) => (
          <div key={field.key} className="flex items-center gap-2">
            <Label className="w-48 text-xs text-muted-foreground flex-shrink-0">
              {field.label}
            </Label>
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">£</span>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={costs[field.key] || ""}
                onChange={(e) => updateCost(field.key, parseFloat(e.target.value) || 0)}
                className="w-24"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Breakdown */}
      {breakdown && (
        <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800 space-y-2 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>Total costs</span>
            <span>{formatCurrency(breakdown.totalCosts)}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>× Business proportion</span>
            <span>{(breakdown.businessProportion * 100).toFixed(0)}%</span>
          </div>
        </div>
      )}

      {/* Result */}
      <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Annual deduction</span>
          <span className="text-2xl font-bold">
            {formatCurrency(result)}
          </span>
        </div>
      </div>
    </div>
  )
}
