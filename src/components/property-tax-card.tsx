"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Home, Info, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import type { PropertyTaxSummary, SA105Data } from "@/types/database"

interface PropertyTaxCardProps {
  taxYear: string
}

export function PropertyTaxCard({ taxYear }: PropertyTaxCardProps) {
  const [summary, setSummary] = useState<PropertyTaxSummary | null>(null)
  const [sa105, setSa105] = useState<SA105Data | null>(null)
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/properties/tax-summary?tax_year=${taxYear}`)
        const data = await res.json()
        setSummary(data.summary)
        setSa105(data.sa105)
      } catch (error) {
        console.error("Failed to fetch property tax summary:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [taxYear])

  const formatCurrency = (amount: number) =>
    `£${amount.toLocaleString("en-GB", { minimumFractionDigits: 2 })}`

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Home className="h-5 w-5" />
            Property Income (SA105)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </CardContent>
      </Card>
    )
  }

  if (!summary || summary.properties.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Home className="h-5 w-5" />
            Property Income (SA105)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            No rental properties found. Add properties to track property income.
          </p>
          <Button asChild variant="outline" size="sm">
            <Link href="/properties">Add Properties</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Home className="h-5 w-5" />
          Property Income (SA105)
        </CardTitle>
        <CardDescription>
          {summary.properties.length} propert{summary.properties.length === 1 ? "y" : "ies"} for{" "}
          {taxYear}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Rental Income (Box 5)</span>
            <span className="font-medium">{formatCurrency(summary.totalRentalIncome)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>
              {summary.usePropertyAllowance ? "Property Allowance" : "Allowable Expenses"} (Box 26)
            </span>
            <span className="font-medium text-red-500">
              -{formatCurrency(
                summary.usePropertyAllowance
                  ? Math.min(summary.propertyAllowance, summary.totalRentalIncome)
                  : summary.totalAllowableExpenses
              )}
            </span>
          </div>
          <Separator />
          <div className="flex justify-between text-sm font-medium">
            <span>Taxable Profit (Box 30)</span>
            <span>{formatCurrency(summary.taxableProfit)}</span>
          </div>
        </div>

        {summary.totalFinanceCosts > 0 && (
          <div className="p-3 bg-primary/10 rounded-lg space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Info className="h-4 w-4" />
              Section 24 Finance Costs
            </div>
            <div className="flex justify-between text-sm">
              <span>Finance Costs (Box 44)</span>
              <span>{formatCurrency(summary.totalFinanceCosts)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Tax Credit (20%)</span>
              <span className="font-medium text-green-600">
                -{formatCurrency(summary.financeCostTaxCredit)}
              </span>
            </div>
          </div>
        )}

        {summary.usePropertyAllowance && (
          <div className="p-3 bg-amber-500/10 rounded-lg flex items-start gap-2">
            <Info className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-muted-foreground">
              Using £1,000 Property Allowance as it&apos;s more beneficial than claiming actual
              expenses ({formatCurrency(summary.totalAllowableExpenses)}).
            </p>
          </div>
        )}

        {/* Property breakdown */}
        {summary.properties.length > 1 && (
          <div>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-between"
              onClick={() => setExpanded(!expanded)}
            >
              <span>View by property</span>
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>

            {expanded && (
              <div className="mt-2 space-y-2">
                {summary.properties.map((prop) => (
                  <div key={prop.propertyId} className="p-3 border rounded-lg text-sm space-y-1">
                    <p className="font-medium">{prop.propertyName}</p>
                    <div className="grid grid-cols-3 gap-2 text-muted-foreground">
                      <div>
                        <span className="block text-xs">Income</span>
                        <span className="text-foreground">{formatCurrency(prop.income)}</span>
                      </div>
                      <div>
                        <span className="block text-xs">Expenses</span>
                        <span className="text-foreground">{formatCurrency(prop.expenses)}</span>
                      </div>
                      <div>
                        <span className="block text-xs">Profit</span>
                        <span className="text-foreground">{formatCurrency(prop.profit)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex justify-between items-center pt-2">
          <p className="text-xs text-muted-foreground">
            Based on confirmed transactions
          </p>
          <Button asChild variant="link" size="sm" className="h-auto p-0">
            <Link href="/properties">Manage Properties →</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
