"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp } from "lucide-react"
import type { YearEndReport } from "@/lib/year-end/types"

interface IncomeSectionProps {
  income: YearEndReport['income']
}

export function IncomeSection({ income }: IncomeSectionProps) {
  const formatMoney = (amount: number) =>
    `£${amount.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-green-600" />
          Income
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Total */}
        <div className="flex justify-between items-baseline">
          <span className="text-muted-foreground">Total Income</span>
          <span className="text-xl font-bold text-green-600">{formatMoney(income.total)}</span>
        </div>

        {/* Categories */}
        {income.byCategory.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">By Category</p>
            {income.byCategory.slice(0, 5).map((cat, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span>{cat.category}</span>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">{cat.percentage}%</span>
                  <span className="font-medium">{formatMoney(cat.amount)}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Top Sources */}
        {income.topSources.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Top Sources</p>
            {income.topSources.slice(0, 3).map((source, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span className="truncate max-w-[60%]">{source.description}</span>
                <span className="font-medium">{formatMoney(source.amount)}</span>
              </div>
            ))}
          </div>
        )}

        {/* Stats */}
        <div className="pt-2 border-t grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Transactions</p>
            <p className="font-medium">{income.transactionCount}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Average</p>
            <p className="font-medium">{formatMoney(income.averageTransaction)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
