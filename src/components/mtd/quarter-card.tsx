"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Download, ChevronDown, ChevronUp, CheckCircle2, Clock, AlertCircle, CalendarClock } from "lucide-react"
import { toast } from "sonner"
import { QuarterDetails } from "./quarter-details"
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

interface QuarterCardProps {
  data: QuarterData
  taxYear: string
}

const statusConfig: Record<QuarterStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; className: string; icon: typeof CheckCircle2 }> = {
  ready: {
    label: "Ready",
    variant: "default",
    className: "bg-green-500/10 text-green-600 hover:bg-green-500/20 border-green-500/20",
    icon: CheckCircle2,
  },
  in_progress: {
    label: "In Progress",
    variant: "secondary",
    className: "bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 border-amber-500/20",
    icon: Clock,
  },
  upcoming: {
    label: "Upcoming",
    variant: "outline",
    className: "bg-gray-500/10 text-gray-500 hover:bg-gray-500/20 border-gray-500/20",
    icon: CalendarClock,
  },
  overdue: {
    label: "Overdue",
    variant: "destructive",
    className: "bg-red-500/10 text-red-600 hover:bg-red-500/20 border-red-500/20",
    icon: AlertCircle,
  },
}

export function QuarterCard({ data, taxYear }: QuarterCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [exporting, setExporting] = useState(false)

  const config = statusConfig[data.status]
  const StatusIcon = config.icon

  const formatCurrency = (amount: number) =>
    `£${amount.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  const formatDeadline = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
  }

  const isDeadlinePassed = () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return today > new Date(data.deadline)
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      const res = await fetch(`/api/mtd/quarters/${data.quarter}/export?tax_year=${taxYear}`)

      if (!res.ok) {
        const error = await res.json()
        toast.error(error.error || "Failed to export")
        return
      }

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `taxfolio-${taxYear}-Q${data.quarter}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success(`Q${data.quarter} exported successfully`)
    } catch {
      toast.error("Failed to export quarter")
    } finally {
      setExporting(false)
    }
  }

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <span className="font-semibold">{data.label}</span>
          <Badge className={config.className}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {config.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1 space-y-4">
        {/* Financial Summary */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Income</span>
            <span className="text-green-600">{formatCurrency(data.income)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Expenses</span>
            <span className="text-red-600">{formatCurrency(data.expenses)}</span>
          </div>
          <Separator />
          <div className="flex justify-between font-medium">
            <span>Net Profit</span>
            <span>{formatCurrency(data.netProfit)}</span>
          </div>
        </div>

        {/* Transaction Count */}
        <div className="text-sm text-muted-foreground">
          {data.transactionCounts.total} transactions
          {data.transactionCounts.pending > 0 && (
            <span className="text-amber-600 ml-1">
              · {data.transactionCounts.pending} pending
            </span>
          )}
          {data.transactionCounts.total > 0 && data.transactionCounts.pending === 0 && (
            <span className="text-green-600 ml-1">· All confirmed</span>
          )}
        </div>

        {/* Deadline */}
        <div className="text-sm">
          <span className="text-muted-foreground">Deadline: </span>
          <span className={isDeadlinePassed() ? "text-muted-foreground" : ""}>
            {formatDeadline(data.deadline)}
          </span>
          {isDeadlinePassed() && data.status === "ready" && (
            <CheckCircle2 className="h-3.5 w-3.5 inline ml-1 text-green-600" />
          )}
          {isDeadlinePassed() && data.status === "overdue" && (
            <AlertCircle className="h-3.5 w-3.5 inline ml-1 text-red-600" />
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? (
              <>
                <ChevronUp className="h-4 w-4 mr-1" />
                Hide
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-1" />
                Details
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={handleExport}
            disabled={exporting || data.transactionCounts.confirmed === 0}
          >
            <Download className="h-4 w-4 mr-1" />
            {exporting ? "..." : "Export"}
          </Button>
        </div>

        {/* Expanded Details */}
        {expanded && (
          <QuarterDetails
            data={data}
            taxYear={taxYear}
          />
        )}
      </CardContent>
    </Card>
  )
}
