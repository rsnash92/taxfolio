"use client"

import { useState, useEffect, useCallback } from "react"
import Cookies from "js-cookie"
import { FileText, Download, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { ExecutiveSummary } from "./executive-summary"
import { IncomeSection } from "./income-section"
import { ExpenseSection } from "./expense-section"
import { TaxSection } from "./tax-section"
import { ComparisonSection } from "./comparison-section"
import { InsightsSection } from "./insights-section"
import { ActionItems } from "./action-items"
import type { YearEndReport as YearEndReportType } from "@/lib/year-end/types"

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

export function YearEndReport() {
  const [taxYear, setTaxYear] = useState(getTaxYearFromCookie)
  const [report, setReport] = useState<YearEndReportType | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [downloading, setDownloading] = useState(false)

  // Sync tax year from cookie
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

  const fetchReport = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true)
    else setLoading(true)

    try {
      const url = `/api/year-end?tax_year=${taxYear}${refresh ? '&refresh=true' : ''}`
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setReport(data)
      } else {
        toast.error("Failed to load report")
      }
    } catch (error) {
      console.error("Failed to fetch report:", error)
      toast.error("Failed to load report")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [taxYear])

  useEffect(() => {
    fetchReport()
  }, [fetchReport])

  const handleRefresh = () => fetchReport(true)

  const handleDownloadPDF = async () => {
    setDownloading(true)
    try {
      const res = await fetch(`/api/year-end/pdf?tax_year=${taxYear}`)
      if (res.ok) {
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `TaxFolio-Year-End-${taxYear}.pdf`
        a.click()
        URL.revokeObjectURL(url)
        toast.success("PDF downloaded")
      } else {
        toast.error("Failed to generate PDF")
      }
    } catch (error) {
      console.error("Download failed:", error)
      toast.error("Failed to download PDF")
    } finally {
      setDownloading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <div className="flex gap-3">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-48 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    )
  }

  if (!report) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="font-medium">No data available</p>
        <p className="text-sm text-muted-foreground">Add transactions to generate your year-end summary</p>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <FileText className="h-7 w-7 text-green-600" />
            Year-End Summary
          </h1>
          <p className="text-muted-foreground">
            Tax Year {report.taxYear} • Generated {new Date(report.generatedAt).toLocaleDateString('en-GB')}
          </p>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button onClick={handleDownloadPDF} disabled={downloading}>
            <Download className="h-4 w-4 mr-2" />
            {downloading ? 'Generating...' : 'Download PDF'}
          </Button>
        </div>
      </div>

      {/* Executive Summary */}
      <ExecutiveSummary summary={report.summary} />

      {/* Year-on-Year Comparison */}
      {report.comparison && (
        <ComparisonSection comparison={report.comparison} />
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <IncomeSection income={report.income} />
        <ExpenseSection expenses={report.expenses} deductions={report.deductions} />
      </div>

      {/* Tax Breakdown */}
      <TaxSection tax={report.tax} />

      {/* AI Insights */}
      {report.insights.length > 0 && (
        <InsightsSection insights={report.insights} />
      )}

      {/* Action Items */}
      {report.actionItems.length > 0 && (
        <ActionItems items={report.actionItems} taxYear={report.taxYear} />
      )}
    </div>
  )
}
