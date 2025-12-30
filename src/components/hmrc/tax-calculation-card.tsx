"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calculator, TrendingUp, TrendingDown } from "lucide-react"
import { TaxCalculation } from "@/lib/hmrc/types"

interface TaxCalculationCardProps {
  calculation: TaxCalculation | null
  loading?: boolean
}

export function TaxCalculationCard({ calculation, loading }: TaxCalculationCardProps) {
  const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined) return '-'
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tax Calculation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-8 bg-muted rounded w-1/2" />
            <div className="h-4 bg-muted rounded w-3/4" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!calculation) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
              <Calculator className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-base">Tax Calculation</CardTitle>
              <CardDescription>No calculation available yet</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Submit your income to HMRC to see your tax calculation
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
              <Calculator className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-base">Tax Calculation</CardTitle>
              <CardDescription>Tax Year {calculation.taxYear}</CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="text-xs">
            {formatDate(calculation.calculationTimestamp)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Total Tax Due */}
        <div className="bg-muted/50 rounded-lg p-4">
          <p className="text-sm text-muted-foreground mb-1">Total Tax & NICs Due</p>
          <p className="text-2xl font-bold">
            {formatCurrency(calculation.totalIncomeTaxAndNicsDue)}
          </p>
        </div>

        {/* Breakdown */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <span>Taxable Income</span>
            </div>
            <span className="font-medium">
              {formatCurrency(calculation.totalTaxableIncome)}
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
              <span>Income Tax</span>
            </div>
            <span className="font-medium">
              {formatCurrency(calculation.incomeTaxDue)}
            </span>
          </div>

          {calculation.class2NicAmount !== undefined && calculation.class2NicAmount > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground ml-6">Class 2 NICs</span>
              <span>{formatCurrency(calculation.class2NicAmount)}</span>
            </div>
          )}

          {calculation.class4NicAmount !== undefined && calculation.class4NicAmount > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground ml-6">Class 4 NICs</span>
              <span>{formatCurrency(calculation.class4NicAmount)}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
