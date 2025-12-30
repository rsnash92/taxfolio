"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Clock, Check } from "lucide-react"
import type { SimplifiedBreakdown } from "@/lib/home-office"

interface SimplifiedMethodProps {
  hoursPerWeek: number
  weeksPerYear: number
  onHoursChange: (hours: number) => void
  onWeeksChange: (weeks: number) => void
  result: number
  breakdown?: SimplifiedBreakdown
  isSelected: boolean
  onSelect: () => void
}

export function SimplifiedMethod({
  hoursPerWeek,
  weeksPerYear,
  onHoursChange,
  onWeeksChange,
  result,
  breakdown,
  isSelected,
  onSelect,
}: SimplifiedMethodProps) {
  const formatCurrency = (amount: number) =>
    `£${amount.toLocaleString("en-GB", { minimumFractionDigits: 2 })}`

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
          <Clock className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-semibold">Simplified (Flat Rate)</h3>
        </div>
        {isSelected && <Check className="h-5 w-5 text-[#15e49e]" />}
      </div>

      <p className="text-sm text-muted-foreground mb-4">
        HMRC flat rate based on hours worked from home. No receipts needed.
      </p>

      <div className="space-y-4">
        <div>
          <Label htmlFor="hours">Hours worked from home per week</Label>
          <Input
            id="hours"
            type="number"
            min="0"
            max="80"
            value={hoursPerWeek || ""}
            onChange={(e) => onHoursChange(parseFloat(e.target.value) || 0)}
            className="mt-1"
            onClick={(e) => e.stopPropagation()}
          />
        </div>

        <div>
          <Label htmlFor="weeks">Weeks worked per year</Label>
          <Input
            id="weeks"
            type="number"
            min="1"
            max="52"
            value={weeksPerYear || ""}
            onChange={(e) => onWeeksChange(parseInt(e.target.value) || 0)}
            className="mt-1"
            onClick={(e) => e.stopPropagation()}
          />
          <p className="text-xs text-muted-foreground mt-1">
            Exclude holidays (typically 48-50 weeks)
          </p>
        </div>
      </div>

      {/* Breakdown */}
      {breakdown && (
        <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800 space-y-2 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>Monthly hours</span>
            <span>{breakdown.hoursPerMonth} hrs/month</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Rate tier</span>
            <span>{breakdown.tier}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Monthly rate</span>
            <span>£{breakdown.monthlyRate}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Months worked</span>
            <span>{breakdown.months}</span>
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

      {/* HMRC Rates Reference */}
      <div className="mt-4 p-3 bg-muted rounded-lg text-xs text-muted-foreground">
        <p className="font-medium text-foreground mb-1">HMRC rates:</p>
        <p>25-50 hrs/month: £10 | 51-100 hrs: £18 | 101+ hrs: £26</p>
      </div>
    </div>
  )
}
