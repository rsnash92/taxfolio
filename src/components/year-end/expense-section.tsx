"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Receipt, Car, Home } from "lucide-react"
import type { YearEndReport } from "@/lib/year-end/types"

interface ExpenseSectionProps {
  expenses: YearEndReport['expenses']
  deductions: YearEndReport['deductions']
}

export function ExpenseSection({ expenses, deductions }: ExpenseSectionProps) {
  const formatMoney = (amount: number) =>
    `£${amount.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Receipt className="h-5 w-5 text-red-600" />
          Expenses
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Total */}
        <div className="flex justify-between items-baseline">
          <span className="text-muted-foreground">Total Expenses</span>
          <span className="text-xl font-bold">{formatMoney(expenses.total)}</span>
        </div>

        {/* Categories */}
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Top Categories</p>
          {expenses.byCategory.slice(0, 5).map((cat, index) => (
            <div key={index} className="flex justify-between text-sm">
              <span>{cat.category}</span>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">{cat.percentage}%</span>
                <span className="font-medium">{formatMoney(cat.amount)}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="pt-2 border-t grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Transactions</p>
            <p className="font-medium">{expenses.transactionCount}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Average</p>
            <p className="font-medium">{formatMoney(expenses.averageTransaction)}</p>
          </div>
        </div>

        {/* Additional Deductions */}
        {deductions.totalAdditional > 0 && (
          <div className="pt-2 border-t space-y-2">
            <p className="text-sm text-muted-foreground">Additional Deductions</p>

            {deductions.mileage && (
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Car className="h-4 w-4 text-blue-600" />
                  <span>Mileage ({deductions.mileage.miles.toLocaleString()} miles)</span>
                </div>
                <span className="font-medium">{formatMoney(deductions.mileage.amount)}</span>
              </div>
            )}

            {deductions.useOfHome && (
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Home className="h-4 w-4 text-green-600" />
                  <span>Use of Home</span>
                </div>
                <span className="font-medium">{formatMoney(deductions.useOfHome.amount)}</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
