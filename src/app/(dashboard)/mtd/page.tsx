"use client"

import { useEffect, useState, useCallback } from "react"
import Cookies from "js-cookie"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CalendarDays, AlertCircle, CheckCircle2 } from "lucide-react"
import { QuarterCard } from "@/components/mtd/quarter-card"
import type { QuarterStatus } from "@/lib/mtd-utils"

interface CategoryBreakdown {
  code: string
  name: string
  type: string
  hmrc_box: string | null
  amount: number
}

interface QuarterData {
  quarter: number
  label: string
  startDate: string
  endDate: string
  deadline: string
  status: QuarterStatus
  income: number
  expenses: number
  netProfit: number
  transactionCounts: {
    total: number
    pending: number
    confirmed: number
  }
  incomeBreakdown: CategoryBreakdown[]
  expensesBreakdown: CategoryBreakdown[]
}

interface MTDData {
  tax_year: string
  quarters: QuarterData[]
  summary: {
    readyQuarters: number
    totalQuarters: number
    income: number
    expenses: number
    netProfit: number
    totalTransactions: number
    pendingTransactions: number
    confirmedTransactions: number
  }
}

const TAX_YEAR_COOKIE = "taxfolio_tax_year"

function getCurrentTaxYear(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const day = now.getDate()

  if (month > 4 || (month === 4 && day >= 6)) {
    return `${year}-${(year + 1).toString().slice(-2)}`
  } else {
    return `${year - 1}-${year.toString().slice(-2)}`
  }
}

function getTaxYearFromCookie(): string {
  if (typeof window !== "undefined") {
    return Cookies.get(TAX_YEAR_COOKIE) || getCurrentTaxYear()
  }
  return getCurrentTaxYear()
}

export default function MTDPage() {
  const [taxYear, setTaxYear] = useState(getTaxYearFromCookie)
  const [data, setData] = useState<MTDData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Sync tax year from cookie when it changes
  useEffect(() => {
    const checkCookie = () => {
      const cookieYear = Cookies.get(TAX_YEAR_COOKIE)
      if (cookieYear && cookieYear !== taxYear) {
        setTaxYear(cookieYear)
      }
    }
    window.addEventListener("focus", checkCookie)
    return () => window.removeEventListener("focus", checkCookie)
  }, [taxYear])

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/mtd/quarters?tax_year=${taxYear}`)
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || "Failed to fetch data")
      }
      const result = await res.json()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data")
    } finally {
      setLoading(false)
    }
  }, [taxYear])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const formatCurrency = (amount: number) =>
    `£${amount.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  const progressPercentage = data ? (data.summary.readyQuarters / 4) * 100 : 0

  return (
    <div className="space-y-6">
      {/* Error State */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {loading && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full" />
            </CardContent>
          </Card>
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-5 w-32" />
                </CardHeader>
                <CardContent className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Data State */}
      {!loading && data && (
        <>
          {/* Progress Overview */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <CalendarDays className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle>Year Progress</CardTitle>
                  <CardDescription>
                    {data.summary.readyQuarters} of 4 quarters ready for submission
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Progress value={progressPercentage} className="h-2" />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Total Income</p>
                  <p className="font-medium text-green-600">{formatCurrency(data.summary.income)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total Expenses</p>
                  <p className="font-medium text-red-600">{formatCurrency(data.summary.expenses)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Net Profit</p>
                  <p className="font-medium">{formatCurrency(data.summary.netProfit)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Transactions</p>
                  <p className="font-medium">
                    {data.summary.confirmedTransactions} confirmed
                    {data.summary.pendingTransactions > 0 && (
                      <span className="text-amber-600 ml-1">
                        ({data.summary.pendingTransactions} pending)
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status Messages */}
          {data.summary.readyQuarters === 4 && data.summary.pendingTransactions === 0 && (
            <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800 dark:text-green-200">
                All quarters are ready for HMRC submission. Export each quarter as needed.
              </AlertDescription>
            </Alert>
          )}

          {data.summary.pendingTransactions > 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You have {data.summary.pendingTransactions} pending transactions across all quarters.
                Review and confirm them before submitting to HMRC.
              </AlertDescription>
            </Alert>
          )}

          {/* Quarter Cards */}
          <div className="grid gap-4 md:grid-cols-2">
            {data.quarters.map((quarter) => (
              <QuarterCard key={quarter.quarter} data={quarter} taxYear={taxYear} />
            ))}
          </div>

          {/* Info Note */}
          <p className="text-xs text-muted-foreground text-center">
            MTD for Income Tax Self Assessment is mandatory from April 2026 for qualifying businesses.
            These quarterly breakdowns help you prepare for quarterly submissions to HMRC.
          </p>
        </>
      )}
    </div>
  )
}
