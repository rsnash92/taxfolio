"use client"

import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, ExternalLink } from "lucide-react"

interface CategoryBreakdown {
  code: string
  name: string
  type: string
  hmrc_box: string | null
  amount: number
}

interface QuarterData {
  quarter: number
  startDate: string
  endDate: string
  transactionCounts: {
    total: number
    pending: number
    confirmed: number
  }
  incomeBreakdown: CategoryBreakdown[]
  expensesBreakdown: CategoryBreakdown[]
}

interface QuarterDetailsProps {
  data: QuarterData
  taxYear: string
}

export function QuarterDetails({ data, taxYear }: QuarterDetailsProps) {
  const formatCurrency = (amount: number) =>
    `£${amount.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  // Build transaction filter URL
  const transactionsUrl = `/transactions?tax_year=${taxYear}&from=${data.startDate}&to=${data.endDate}`

  return (
    <div className="mt-4 pt-4 border-t space-y-4">
      {/* Pending Warning */}
      {data.transactionCounts.pending > 0 && (
        <Alert variant="destructive" className="bg-amber-500/10 border-amber-500/20">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-700 dark:text-amber-400">
            {data.transactionCounts.pending} transaction{data.transactionCounts.pending > 1 ? "s" : ""} still pending review.
            Review all transactions before submitting to HMRC.
          </AlertDescription>
        </Alert>
      )}

      {/* Income Breakdown */}
      {data.incomeBreakdown.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-2">Income Breakdown</h4>
          <div className="space-y-1.5">
            {data.incomeBreakdown.map((item) => (
              <div key={item.code} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  {item.hmrc_box && (
                    <Badge variant="outline" className="font-mono text-xs">
                      {item.hmrc_box.replace("SA103 ", "")}
                    </Badge>
                  )}
                  <span className="text-muted-foreground">{item.name}</span>
                </div>
                <span className="text-green-600">{formatCurrency(item.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Expenses Breakdown */}
      {data.expensesBreakdown.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-2">Expenses Breakdown</h4>
          <div className="space-y-1.5">
            {data.expensesBreakdown.map((item) => (
              <div key={item.code} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  {item.hmrc_box && (
                    <Badge variant="outline" className="font-mono text-xs">
                      {item.hmrc_box.replace("SA103 ", "")}
                    </Badge>
                  )}
                  <span className="text-muted-foreground">{item.name}</span>
                </div>
                <span className="text-red-600">{formatCurrency(item.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Data Message */}
      {data.incomeBreakdown.length === 0 && data.expensesBreakdown.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-2">
          No confirmed transactions in this quarter yet.
        </p>
      )}

      <Separator />

      {/* View Transactions Link */}
      <Link href={transactionsUrl}>
        <Button variant="ghost" size="sm" className="w-full">
          View Transactions
          <ExternalLink className="h-3.5 w-3.5 ml-1" />
        </Button>
      </Link>
    </div>
  )
}
