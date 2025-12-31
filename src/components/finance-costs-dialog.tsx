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
import { Info } from "lucide-react"
import type { Property } from "@/types/database"

interface FinanceCostsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  property: Property
  onSuccess?: () => void
}

// Generate tax years (current and previous 2)
function getTaxYears(): string[] {
  const now = new Date()
  const currentYear = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1
  const years: string[] = []
  for (let i = 0; i < 3; i++) {
    const startYear = currentYear - i
    years.push(`${startYear}-${(startYear + 1).toString().slice(-2)}`)
  }
  return years
}

export function FinanceCostsDialog({
  open,
  onOpenChange,
  property,
  onSuccess,
}: FinanceCostsDialogProps) {
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(false)
  const taxYears = getTaxYears()
  const [selectedYear, setSelectedYear] = useState(taxYears[0])
  const [formData, setFormData] = useState({
    mortgage_interest: "",
    other_finance_costs: "",
  })

  // Fetch existing finance costs when year changes
  useEffect(() => {
    if (!open || !property) return

    const fetchCosts = async () => {
      setFetching(true)
      try {
        const res = await fetch(`/api/properties/finance-costs?tax_year=${selectedYear}`)
        const data = await res.json()
        const costs = data.finance_costs?.find(
          (c: { property_id: string }) => c.property_id === property.id
        )
        if (costs) {
          setFormData({
            mortgage_interest: costs.mortgage_interest?.toString() || "",
            other_finance_costs: costs.other_finance_costs?.toString() || "",
          })
        } else {
          setFormData({ mortgage_interest: "", other_finance_costs: "" })
        }
      } catch (error) {
        console.error("Failed to fetch finance costs:", error)
      } finally {
        setFetching(false)
      }
    }

    fetchCosts()
  }, [open, property, selectedYear])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch("/api/properties/finance-costs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          property_id: property.id,
          tax_year: selectedYear,
          mortgage_interest: parseFloat(formData.mortgage_interest) || 0,
          other_finance_costs: parseFloat(formData.other_finance_costs) || 0,
        }),
      })

      if (res.ok) {
        onSuccess?.()
        onOpenChange(false)
      }
    } catch (error) {
      console.error("Failed to save finance costs:", error)
    } finally {
      setLoading(false)
    }
  }

  const totalCosts =
    (parseFloat(formData.mortgage_interest) || 0) +
    (parseFloat(formData.other_finance_costs) || 0)
  const taxCredit = totalCosts * 0.2

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Finance Costs</DialogTitle>
            <DialogDescription>
              Enter finance costs for {property.name} to calculate your Section 24 tax credit.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="tax_year">Tax Year</Label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {taxYears.map((year) => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {fetching ? (
              <div className="h-24 flex items-center justify-center text-muted-foreground">
                Loading...
              </div>
            ) : (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="mortgage_interest">Mortgage Interest (£)</Label>
                  <Input
                    id="mortgage_interest"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.mortgage_interest}
                    onChange={(e) =>
                      setFormData({ ...formData, mortgage_interest: e.target.value })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Total mortgage interest paid during the tax year
                  </p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="other_finance_costs">Other Finance Costs (£)</Label>
                  <Input
                    id="other_finance_costs"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.other_finance_costs}
                    onChange={(e) =>
                      setFormData({ ...formData, other_finance_costs: e.target.value })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Loan arrangement fees, mortgage broker fees, etc.
                  </p>
                </div>

                {totalCosts > 0 && (
                  <div className="rounded-lg bg-primary/10 p-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Info className="h-4 w-4" />
                      Section 24 Tax Credit
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <span className="text-muted-foreground">Total Finance Costs:</span>
                      <span className="text-right">£{totalCosts.toFixed(2)}</span>
                      <span className="text-muted-foreground">Tax Credit (20%):</span>
                      <span className="text-right font-medium text-green-600">
                        £{taxCredit.toFixed(2)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground pt-2">
                      Finance costs are no longer deductible as expenses. Instead, you receive a
                      20% tax credit on SA105 Box 44.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || fetching}>
              {loading ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
