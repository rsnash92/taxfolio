"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

interface TaxSummaryCardProps {
  income: number
  expenses: number
  profit: number
  estimatedTax: number
}

export function TaxSummaryCard({
  income,
  expenses,
  profit,
  estimatedTax,
}: TaxSummaryCardProps) {
  const formatCurrency = (amount: number) =>
    `£${amount.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  return (
    <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
      <CardContent className="pt-6 space-y-3">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Income</span>
          <span className="text-[#00e3ec] font-medium">{formatCurrency(income)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Expenses</span>
          <span className="text-red-500 font-medium">{formatCurrency(expenses)}</span>
        </div>
        <Separator className="bg-zinc-200 dark:bg-zinc-800" />
        <div className="flex justify-between">
          <span>Net Profit</span>
          <span className="font-medium">{formatCurrency(profit)}</span>
        </div>
        <Separator className="bg-zinc-200 dark:bg-zinc-800" />
        <div className="flex justify-between pt-2">
          <div>
            <span className="font-semibold">Estimated Tax Due</span>
            <p className="text-xs text-muted-foreground">Income Tax + National Insurance</p>
          </div>
          <span className="text-xl font-bold text-primary">{formatCurrency(estimatedTax)}</span>
        </div>
      </CardContent>
    </Card>
  )
}
