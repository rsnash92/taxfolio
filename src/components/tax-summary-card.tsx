"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Calculator, Info } from "lucide-react"
import Link from "next/link"

interface TaxSummary {
  total_income: number
  total_expenses: number
  net_profit: number
  income_tax: number
  class2_ni: number
  class4_ni: number
  total_tax: number
}

interface TransactionCounts {
  personal_excluded: number
}

export function TaxSummaryCard({ taxYear }: { taxYear: string }) {
  const [summary, setSummary] = useState<TaxSummary | null>(null)
  const [transactionCounts, setTransactionCounts] = useState<TransactionCounts | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchSummary() {
      try {
        const res = await fetch(`/api/tax-summary?tax_year=${taxYear}`)
        const data = await res.json()
        setSummary(data.summary)
        setTransactionCounts(data.transaction_counts)
      } catch (error) {
        console.error('Failed to fetch tax summary:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchSummary()
  }, [taxYear])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Estimated Tax
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

  if (!summary) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Estimated Tax
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Unable to calculate tax summary</p>
        </CardContent>
      </Card>
    )
  }

  const formatCurrency = (amount: number) =>
    `£${amount.toLocaleString('en-GB', { minimumFractionDigits: 2 })}`

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Estimated Tax
        </CardTitle>
        <CardDescription>
          Based on confirmed transactions for {taxYear}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Net Profit</span>
            <span className="font-medium">{formatCurrency(summary.net_profit)}</span>
          </div>
          <Separator />
          <div className="flex justify-between text-sm">
            <span>Income Tax</span>
            <span>{formatCurrency(summary.income_tax)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Class 2 NI</span>
            <span>{formatCurrency(summary.class2_ni)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Class 4 NI</span>
            <span>{formatCurrency(summary.class4_ni)}</span>
          </div>
          <Separator />
          <div className="flex justify-between font-medium">
            <span>Total Due</span>
            <span className="text-lg">{formatCurrency(summary.total_tax)}</span>
          </div>
        </div>
        {/* Personal transactions excluded note */}
        {transactionCounts && transactionCounts.personal_excluded > 0 && (
          <div className="p-3 bg-muted rounded-lg flex items-start gap-2">
            <Info className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">
                {transactionCounts.personal_excluded} personal transaction{transactionCounts.personal_excluded === 1 ? '' : 's'}
              </span>{' '}
              excluded from calculations.{' '}
              <Link href="/transactions" className="text-[#15e49e] hover:underline">
                Review →
              </Link>
            </div>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          Estimates based on 2024-25 UK tax rates. Actual liability may vary.
        </p>
      </CardContent>
    </Card>
  )
}
