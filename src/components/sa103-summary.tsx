"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, CheckCircle2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface CategoryBreakdown {
  name: string
  code: string
  hmrc_box: string | null
  amount: number
}

interface TaxSummaryData {
  tax_year: string
  summary: {
    total_income: number
    total_expenses: number
    net_profit: number
    income_tax: number
    class2_ni: number
    class4_ni: number
    total_tax: number
  }
  income_breakdown: CategoryBreakdown[]
  expenses_breakdown: CategoryBreakdown[]
  transaction_counts: {
    total: number
    pending: number
    confirmed: number
    reviewed_percentage: number
  }
}

// SA103 Box definitions
const SA103_BOXES = {
  income: [
    { box: "9", label: "Turnover – the takings, fees, sales or money earned by your business" },
    { box: "10", label: "Any other business income not included in box 9" },
  ],
  expenses: [
    { box: "10", label: "Cost of goods bought for resale or goods used" },
    { box: "11", label: "Wages, salaries and other staff costs" },
    { box: "12", label: "Car, van and travel expenses" },
    { box: "13", label: "Rent, rates, power and insurance costs" },
    { box: "14", label: "Repairs and renewals of property and equipment" },
    { box: "15", label: "Phone, fax, stationery and other office costs" },
    { box: "16", label: "Advertising and business entertainment costs" },
    { box: "17", label: "Interest on bank and other loans" },
    { box: "18", label: "Bank, credit card and other financial charges" },
    { box: "19", label: "Irrecoverable debts written off" },
    { box: "20", label: "Accountancy, legal and other professional fees" },
    { box: "21", label: "Depreciation and loss/(profit) on sale of assets" },
    { box: "22", label: "Other business expenses" },
    { box: "29", label: "Total allowable expenses (total of boxes 10 to 28)" },
  ],
  calculation: [
    { box: "30", label: "Net profit (turnover minus expenses)" },
    { box: "31", label: "Tax adjustments" },
    { box: "32", label: "Net business profit for tax purposes" },
  ],
}

// Map our category codes to SA103 boxes
const CATEGORY_TO_BOX: Record<string, string> = {
  income_sales: "9",
  income_other: "10",
  expense_cogs: "10",
  expense_wages: "11",
  expense_subcontractor: "12",
  expense_premises: "13",
  expense_repairs: "14",
  expense_motor: "12",
  expense_travel: "12",
  expense_advertising: "16",
  expense_professional: "20",
  expense_finance: "18",
  expense_phone: "15",
  expense_office: "15",
  expense_other: "22",
}

interface SA103SummaryProps {
  taxYear: string
}

export function SA103Summary({ taxYear }: SA103SummaryProps) {
  const [data, setData] = useState<TaxSummaryData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const res = await fetch(`/api/tax-summary?tax_year=${taxYear}`)
        if (!res.ok) {
          const errorData = await res.json()
          throw new Error(errorData.error || "Failed to fetch tax summary")
        }
        const result = await res.json()
        setData(result)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [taxYear])

  const formatCurrency = (amount: number) =>
    `£${amount.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>SA103 Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (!data) return null

  const { summary, income_breakdown, expenses_breakdown, transaction_counts } = data

  // Aggregate amounts by SA103 box
  const boxAmounts: Record<string, number> = {}

  // Process income
  for (const item of income_breakdown) {
    const box = CATEGORY_TO_BOX[item.code]
    if (box) {
      boxAmounts[`income_${box}`] = (boxAmounts[`income_${box}`] || 0) + item.amount
    }
  }

  // Process expenses
  for (const item of expenses_breakdown) {
    const box = CATEGORY_TO_BOX[item.code]
    if (box) {
      boxAmounts[`expense_${box}`] = (boxAmounts[`expense_${box}`] || 0) + item.amount
    }
  }

  const hasData = summary.total_income > 0 || summary.total_expenses > 0

  return (
    <div className="space-y-6">
      {/* Review Status */}
      {transaction_counts.pending > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You have {transaction_counts.pending} transactions still pending review.
            Review all transactions for accurate tax calculations.
          </AlertDescription>
        </Alert>
      )}

      {transaction_counts.confirmed > 0 && transaction_counts.pending === 0 && (
        <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800 dark:text-green-200">
            All {transaction_counts.confirmed} transactions reviewed and confirmed.
          </AlertDescription>
        </Alert>
      )}

      {!hasData && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No confirmed transactions found for tax year {taxYear}.
            Import and categorise transactions to see your SA103 summary.
          </AlertDescription>
        </Alert>
      )}

      {/* Income Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Business Income</CardTitle>
          <CardDescription>SA103 Boxes 9-10</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center py-2 border-b">
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="font-mono">Box 9</Badge>
              <span className="text-sm">Turnover (sales/takings)</span>
            </div>
            <span className="font-medium">{formatCurrency(boxAmounts["income_9"] || 0)}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b">
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="font-mono">Box 10</Badge>
              <span className="text-sm">Other business income</span>
            </div>
            <span className="font-medium">{formatCurrency(boxAmounts["income_10"] || 0)}</span>
          </div>
          <Separator />
          <div className="flex justify-between items-center py-2 font-medium">
            <span>Total Business Income</span>
            <span className="text-green-600">{formatCurrency(summary.total_income)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Expenses Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Allowable Business Expenses</CardTitle>
          <CardDescription>SA103 Boxes 10-22</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center py-2 border-b">
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="font-mono">Box 10</Badge>
              <span className="text-sm">Cost of goods sold</span>
            </div>
            <span className="font-medium">{formatCurrency(boxAmounts["expense_10"] || 0)}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b">
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="font-mono">Box 11</Badge>
              <span className="text-sm">Wages, salaries, staff costs</span>
            </div>
            <span className="font-medium">{formatCurrency(boxAmounts["expense_11"] || 0)}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b">
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="font-mono">Box 12</Badge>
              <span className="text-sm">Car, van and travel expenses</span>
            </div>
            <span className="font-medium">{formatCurrency(boxAmounts["expense_12"] || 0)}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b">
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="font-mono">Box 13</Badge>
              <span className="text-sm">Rent, rates, power, insurance</span>
            </div>
            <span className="font-medium">{formatCurrency(boxAmounts["expense_13"] || 0)}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b">
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="font-mono">Box 14</Badge>
              <span className="text-sm">Repairs and renewals</span>
            </div>
            <span className="font-medium">{formatCurrency(boxAmounts["expense_14"] || 0)}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b">
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="font-mono">Box 15</Badge>
              <span className="text-sm">Phone, fax, stationery, office costs</span>
            </div>
            <span className="font-medium">{formatCurrency(boxAmounts["expense_15"] || 0)}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b">
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="font-mono">Box 16</Badge>
              <span className="text-sm">Advertising & entertainment</span>
            </div>
            <span className="font-medium">{formatCurrency(boxAmounts["expense_16"] || 0)}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b">
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="font-mono">Box 18</Badge>
              <span className="text-sm">Bank & financial charges</span>
            </div>
            <span className="font-medium">{formatCurrency(boxAmounts["expense_18"] || 0)}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b">
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="font-mono">Box 20</Badge>
              <span className="text-sm">Accountancy, legal, professional fees</span>
            </div>
            <span className="font-medium">{formatCurrency(boxAmounts["expense_20"] || 0)}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b">
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="font-mono">Box 22</Badge>
              <span className="text-sm">Other business expenses</span>
            </div>
            <span className="font-medium">{formatCurrency(boxAmounts["expense_22"] || 0)}</span>
          </div>
          <Separator />
          <div className="flex justify-between items-center py-2 font-medium">
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="font-mono">Box 29</Badge>
              <span>Total Allowable Expenses</span>
            </div>
            <span className="text-red-600">{formatCurrency(summary.total_expenses)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Net Profit & Tax */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Net Profit & Tax Calculation</CardTitle>
          <CardDescription>Based on 2024-25 UK tax rates</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center py-2 border-b">
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="font-mono">Box 30</Badge>
              <span className="text-sm">Net profit (turnover minus expenses)</span>
            </div>
            <span className="font-medium">{formatCurrency(summary.net_profit)}</span>
          </div>
          <Separator className="my-4" />
          <div className="flex justify-between items-center py-2">
            <span className="text-sm text-muted-foreground">Income Tax (estimated)</span>
            <span>{formatCurrency(summary.income_tax)}</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-sm text-muted-foreground">Class 2 NI (£3.45/week)</span>
            <span>{formatCurrency(summary.class2_ni)}</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-sm text-muted-foreground">Class 4 NI</span>
            <span>{formatCurrency(summary.class4_ni)}</span>
          </div>
          <Separator />
          <div className="flex justify-between items-center py-2 font-bold text-lg">
            <span>Estimated Total Tax Due</span>
            <span className="text-primary">{formatCurrency(summary.total_tax)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Disclaimer */}
      <p className="text-xs text-muted-foreground text-center">
        These figures are estimates based on the transactions you have categorised.
        Consult a qualified accountant for accurate tax advice and submission.
      </p>
    </div>
  )
}
