"use client"

import { Card, CardContent } from "@/components/ui/card"

interface ExecutiveSummaryProps {
  summary: {
    totalIncome: number
    totalExpenses: number
    netProfit: number
    profitMargin: number
    estimatedTax: number
    estimatedNI: number
    totalTaxDue: number
    effectiveTaxRate: number
  }
}

export function ExecutiveSummary({ summary }: ExecutiveSummaryProps) {
  const formatMoney = (amount: number) =>
    `£${amount.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  const isProfitable = summary.netProfit > 0

  return (
    <div className="mb-8">
      {/* Main Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-5">
            <p className="text-sm text-muted-foreground mb-1">Total Income</p>
            <p className="text-2xl font-bold">{formatMoney(summary.totalIncome)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <p className="text-sm text-muted-foreground mb-1">Total Expenses</p>
            <p className="text-2xl font-bold">{formatMoney(summary.totalExpenses)}</p>
          </CardContent>
        </Card>

        <Card className={isProfitable ? "border-green-500/30 bg-green-500/5" : "border-red-500/30 bg-red-500/5"}>
          <CardContent className="pt-5">
            <p className="text-sm text-muted-foreground mb-1">Net Profit</p>
            <p className={`text-2xl font-bold ${isProfitable ? 'text-green-600' : 'text-red-600'}`}>
              {formatMoney(summary.netProfit)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {summary.profitMargin.toFixed(1)}% margin
            </p>
          </CardContent>
        </Card>

        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="pt-5">
            <p className="text-sm text-muted-foreground mb-1">Total Tax Due</p>
            <p className="text-2xl font-bold text-amber-600">{formatMoney(summary.totalTaxDue)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {summary.effectiveTaxRate.toFixed(1)}% effective rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tax Breakdown Mini */}
      <div className="flex items-center gap-6 text-sm text-muted-foreground">
        <span>Income Tax: {formatMoney(summary.estimatedTax)}</span>
        <span>•</span>
        <span>National Insurance: {formatMoney(summary.estimatedNI)}</span>
      </div>
    </div>
  )
}
