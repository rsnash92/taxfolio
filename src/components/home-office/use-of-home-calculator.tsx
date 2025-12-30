"use client"

import { useState, useEffect } from "react"
import { SimplifiedMethod } from "./simplified-method"
import { ActualCostsMethod } from "./actual-costs-method"
import { MethodComparison } from "./method-comparison"
import { HomeOfficeTips } from "./home-office-tips"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { calculateHomeOffice, type HomeOfficeResult } from "@/lib/home-office"
import { Calculator, BookOpen, CheckCircle, Loader2 } from "lucide-react"
import { toast } from "sonner"
import type { UseOfHome } from "@/types/database"

interface UseOfHomeCalculatorProps {
  existingData?: UseOfHome | null
  taxYear: string
}

export function UseOfHomeCalculator({ existingData, taxYear }: UseOfHomeCalculatorProps) {
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Simplified method inputs
  const [hoursPerWeek, setHoursPerWeek] = useState(existingData?.hours_per_week || 40)
  const [weeksPerYear, setWeeksPerYear] = useState(existingData?.weeks_per_year || 48)

  // Actual costs inputs
  const [totalRooms, setTotalRooms] = useState(existingData?.total_rooms || 5)
  const [businessRooms, setBusinessRooms] = useState(existingData?.business_rooms || 1)
  const [costs, setCosts] = useState({
    electricity: existingData?.cost_electricity || 0,
    gas: existingData?.cost_gas || 0,
    water: existingData?.cost_water || 0,
    councilTax: existingData?.cost_council_tax || 0,
    mortgageInterest: existingData?.cost_mortgage_interest || 0,
    rent: existingData?.cost_rent || 0,
    insurance: existingData?.cost_insurance || 0,
    broadband: existingData?.cost_broadband || 0,
    repairs: existingData?.cost_repairs || 0,
    other: existingData?.cost_other || 0,
  })

  // Selected method (user can override recommendation)
  const [selectedMethod, setSelectedMethod] = useState<"simplified" | "actual">(
    (existingData?.calculation_method as "simplified" | "actual") || "simplified"
  )

  // Calculate results
  const [result, setResult] = useState<HomeOfficeResult | null>(null)

  useEffect(() => {
    const calculated = calculateHomeOffice(
      { hoursPerWeek, weeksPerYear },
      { totalRooms, businessRooms, ...costs }
    )
    setResult(calculated)

    // Auto-select recommended method if no existing data
    if (!existingData) {
      setSelectedMethod(calculated.recommendedMethod)
    }
  }, [hoursPerWeek, weeksPerYear, totalRooms, businessRooms, costs, existingData])

  const handleSave = async () => {
    if (!result) return

    setSaving(true)
    try {
      const response = await fetch("/api/home-office", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tax_year: taxYear,
          calculation_method: selectedMethod,
          hours_per_week: hoursPerWeek,
          weeks_per_year: weeksPerYear,
          total_rooms: totalRooms,
          business_rooms: businessRooms,
          cost_electricity: costs.electricity,
          cost_gas: costs.gas,
          cost_water: costs.water,
          cost_council_tax: costs.councilTax,
          cost_mortgage_interest: costs.mortgageInterest,
          cost_rent: costs.rent,
          cost_insurance: costs.insurance,
          cost_broadband: costs.broadband,
          cost_repairs: costs.repairs,
          cost_other: costs.other,
          simplified_amount: result.simplifiedAmount,
          actual_amount: result.actualAmount,
          recommended_method: result.recommendedMethod,
          final_amount:
            selectedMethod === "simplified"
              ? result.simplifiedAmount
              : result.actualAmount,
        }),
      })

      if (response.ok) {
        setSaved(true)
        toast.success("Use of home saved to your tax return")
        setTimeout(() => setSaved(false), 3000)
      } else {
        toast.error("Failed to save")
      }
    } catch (err) {
      console.error("Failed to save:", err)
      toast.error("Failed to save")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="calculator">
        <TabsList>
          <TabsTrigger value="calculator" className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Calculator
          </TabsTrigger>
          <TabsTrigger value="tips" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Tips & Guidance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tips" className="mt-6">
          <HomeOfficeTips />
        </TabsContent>

        <TabsContent value="calculator" className="mt-6 space-y-6">
          {/* Method Inputs */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Simplified Method */}
            <SimplifiedMethod
              hoursPerWeek={hoursPerWeek}
              weeksPerYear={weeksPerYear}
              onHoursChange={setHoursPerWeek}
              onWeeksChange={setWeeksPerYear}
              result={result?.simplifiedAmount || 0}
              breakdown={result?.simplifiedBreakdown}
              isSelected={selectedMethod === "simplified"}
              onSelect={() => setSelectedMethod("simplified")}
            />

            {/* Actual Costs Method */}
            <ActualCostsMethod
              totalRooms={totalRooms}
              businessRooms={businessRooms}
              costs={costs}
              onTotalRoomsChange={setTotalRooms}
              onBusinessRoomsChange={setBusinessRooms}
              onCostsChange={setCosts}
              result={result?.actualAmount || 0}
              breakdown={result?.actualBreakdown}
              isSelected={selectedMethod === "actual"}
              onSelect={() => setSelectedMethod("actual")}
            />
          </div>

          {/* Comparison & Result */}
          {result && (
            <MethodComparison
              result={result}
              selectedMethod={selectedMethod}
              onMethodChange={setSelectedMethod}
            />
          )}

          {/* Save Button */}
          <div className="flex items-center gap-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save to Tax Return"
              )}
            </Button>
            {saved && (
              <span className="text-[#15e49e] flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Saved! Added to your SA103.
              </span>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
