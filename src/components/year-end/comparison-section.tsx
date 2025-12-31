"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import type { YearComparison } from "@/lib/year-end/types"

interface ComparisonSectionProps {
  comparison: YearComparison
}

export function ComparisonSection({ comparison }: ComparisonSectionProps) {
  const formatChange = (change: number, percent: number) => {
    const isPositive = change > 0
    const Icon = change === 0 ? Minus : isPositive ? TrendingUp : TrendingDown
    const color = change === 0 ? 'text-muted-foreground' : isPositive ? 'text-green-600' : 'text-red-600'

    return (
      <div className={`flex items-center gap-1 ${color}`}>
        <Icon className="h-4 w-4" />
        <span>{isPositive ? '+' : ''}{percent}%</span>
      </div>
    )
  }

  const formatMoney = (amount: number) =>
    `£${Math.abs(amount).toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`

  return (
    <Card className="mb-8">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">vs Previous Year ({comparison.previousYear})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Income</p>
            <p className="text-xl font-bold">{formatMoney(comparison.income.current)}</p>
            <div className="flex items-center gap-2 mt-1">
              {formatChange(comparison.income.change, comparison.income.changePercent)}
              <span className="text-xs text-muted-foreground">
                ({comparison.income.change >= 0 ? '+' : ''}{formatMoney(comparison.income.change)})
              </span>
            </div>
          </div>

          <div>
            <p className="text-sm text-muted-foreground mb-1">Expenses</p>
            <p className="text-xl font-bold">{formatMoney(comparison.expenses.current)}</p>
            <div className="flex items-center gap-2 mt-1">
              {formatChange(-comparison.expenses.change, -comparison.expenses.changePercent)}
              <span className="text-xs text-muted-foreground">
                ({comparison.expenses.change >= 0 ? '+' : ''}{formatMoney(comparison.expenses.change)})
              </span>
            </div>
          </div>

          <div>
            <p className="text-sm text-muted-foreground mb-1">Profit</p>
            <p className="text-xl font-bold">{formatMoney(comparison.profit.current)}</p>
            <div className="flex items-center gap-2 mt-1">
              {formatChange(comparison.profit.change, comparison.profit.changePercent)}
            </div>
          </div>

          <div>
            <p className="text-sm text-muted-foreground mb-1">Tax</p>
            <p className="text-xl font-bold">{formatMoney(comparison.tax.current)}</p>
            <div className="flex items-center gap-2 mt-1">
              {formatChange(-comparison.tax.change, -comparison.tax.changePercent)}
            </div>
          </div>
        </div>

        {/* Category Changes */}
        {comparison.categoryChanges.length > 0 && (
          <div className="mt-6 pt-6 border-t">
            <p className="text-sm text-muted-foreground mb-3">Biggest Category Changes</p>
            <div className="flex flex-wrap gap-3">
              {comparison.categoryChanges.map((cat, index) => (
                <div key={index} className="px-3 py-1.5 bg-muted rounded-lg text-sm">
                  <span>{cat.category}</span>
                  <span className={`ml-2 ${cat.changePercent > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {cat.changePercent > 0 ? '+' : ''}{cat.changePercent}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
