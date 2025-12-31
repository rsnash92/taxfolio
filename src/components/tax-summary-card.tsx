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
  section24_credit: number
  income_tax_after_credit: number
  class2_ni: number
  class4_ni: number
  total_tax: number
}

interface TransactionCounts {
  personal_excluded: number
}

interface HomeOffice {
  deduction: number
  method: 'simplified' | 'actual' | null
}

interface Mileage {
  total_miles: number
  total_allowance: number
  trip_count: number
}

export function TaxSummaryCard({ taxYear }: { taxYear: string }) {
  const [summary, setSummary] = useState<TaxSummary | null>(null)
  const [transactionCounts, setTransactionCounts] = useState<TransactionCounts | null>(null)
  const [homeOffice, setHomeOffice] = useState<HomeOffice | null>(null)
  const [mileage, setMileage] = useState<Mileage | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchSummary() {
      try {
        const res = await fetch(`/api/tax-summary?tax_year=${taxYear}`)
        const data = await res.json()
        setSummary(data.summary)
        setTransactionCounts(data.transaction_counts)
        setHomeOffice(data.home_office)
        setMileage(data.mileage)
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
          {/* Income & Expenses Summary */}
          <div className="flex justify-between text-sm">
            <span>Total Income</span>
            <span className="font-medium">{formatCurrency(summary.total_income)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Total Expenses</span>
            <span className="font-medium text-red-500">-{formatCurrency(summary.total_expenses)}</span>
          </div>

          {/* Deductions breakdown */}
          {(homeOffice?.deduction || mileage?.total_allowance) && (
            <div className="pl-4 space-y-1 text-xs text-muted-foreground border-l-2 border-muted">
              {mileage && mileage.total_allowance > 0 && (
                <div className="flex justify-between">
                  <span>Mileage ({mileage.total_miles.toLocaleString()} miles)</span>
                  <span>{formatCurrency(mileage.total_allowance)}</span>
                </div>
              )}
              {homeOffice && homeOffice.deduction > 0 && (
                <div className="flex justify-between">
                  <span>Home Office ({homeOffice.method === 'simplified' ? 'Simplified' : 'Actual'})</span>
                  <span>{formatCurrency(homeOffice.deduction)}</span>
                </div>
              )}
            </div>
          )}

          <Separator />
          <div className="flex justify-between text-sm font-medium">
            <span>Net Profit</span>
            <span>{formatCurrency(summary.net_profit)}</span>
          </div>
          <Separator />

          {/* Tax Breakdown */}
          <div className="flex justify-between text-sm">
            <span>Income Tax</span>
            <span>{formatCurrency(summary.income_tax)}</span>
          </div>
          {summary.section24_credit > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-[#15e49e]">Section 24 Credit</span>
              <span className="text-[#15e49e]">-{formatCurrency(summary.section24_credit)}</span>
            </div>
          )}
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
              <Link href="/transactions?filter=personal" className="text-[#15e49e] hover:underline">
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
