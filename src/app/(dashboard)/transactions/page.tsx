"use client"

import { useEffect, useState, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import Cookies from "js-cookie"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import { Brain, Search, RefreshCw, Upload, Loader2, CheckCheck, User, Briefcase, AlertCircle, Calendar } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { TransactionRow } from "@/components/transaction-row"
import { CategoryDialog } from "@/components/category-dialog"
import { CSVUploadDialog } from "@/components/csv-upload-dialog"
import type { TransactionWithCategory, Category } from "@/types/database"

interface TransactionStats {
  total: number
  personal: number
  ai_suggested_personal: number
  business: number
  needs_review: number
  uncategorised: number
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

// Generate month options for a UK tax year (April to March)
function getMonthsForTaxYear(taxYear: string): { value: string; label: string }[] {
  const [startYear] = taxYear.split('-').map(Number)
  const months = [
    { month: 4, year: startYear, label: 'April' },
    { month: 5, year: startYear, label: 'May' },
    { month: 6, year: startYear, label: 'June' },
    { month: 7, year: startYear, label: 'July' },
    { month: 8, year: startYear, label: 'August' },
    { month: 9, year: startYear, label: 'September' },
    { month: 10, year: startYear, label: 'October' },
    { month: 11, year: startYear, label: 'November' },
    { month: 12, year: startYear, label: 'December' },
    { month: 1, year: startYear + 1, label: 'January' },
    { month: 2, year: startYear + 1, label: 'February' },
    { month: 3, year: startYear + 1, label: 'March' },
  ]

  return months.map(m => ({
    value: `${m.year}-${m.month.toString().padStart(2, '0')}`,
    label: `${m.label} ${m.year}`,
  }))
}

export default function TransactionsPage() {
  const searchParams = useSearchParams()
  const initialStatus = searchParams.get("status") || "all"

  const [transactions, setTransactions] = useState<TransactionWithCategory[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [categorising, setCategorising] = useState(false)
  const [status, setStatus] = useState(initialStatus)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionWithCategory | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [csvDialogOpen, setCsvDialogOpen] = useState(false)
  const [taxYear, setTaxYear] = useState(getTaxYearFromCookie)
  const [categoriseProgress, setCategoriseProgress] = useState(0)
  const [categoriseStatus, setCategoriseStatus] = useState("")
  const [bulkConfirming, setBulkConfirming] = useState(false)
  const [showPersonal, setShowPersonal] = useState(true)
  const [stats, setStats] = useState<TransactionStats | null>(null)
  const [selectedMonth, setSelectedMonth] = useState<string>("all")

  // Sync tax year when it changes (via custom event from PageHeader)
  useEffect(() => {
    const handleTaxYearChange = (event: CustomEvent<string>) => {
      setTaxYear(event.detail)
    }
    const checkCookie = () => {
      const cookieYear = Cookies.get(TAX_YEAR_COOKIE)
      if (cookieYear && cookieYear !== taxYear) {
        setTaxYear(cookieYear)
      }
    }
    // Listen for tax year changes from the header selector
    window.addEventListener("taxYearChanged", handleTaxYearChange as EventListener)
    // Also check on focus to catch changes from other tabs
    window.addEventListener("focus", checkCookie)
    return () => {
      window.removeEventListener("taxYearChanged", handleTaxYearChange as EventListener)
      window.removeEventListener("focus", checkCookie)
    }
  }, [taxYear])

  const fetchTransactions = useCallback(async () => {
    setLoading(true)
    setTransactions([])

    try {
      const statusParam = status === "all" ? "" : `&status=${status}`
      const monthParam = selectedMonth === "all" ? "" : `&month=${selectedMonth}`
      // When filtering by month, load all transactions (up to 2000)
      const limit = selectedMonth === "all" ? 100 : 2000
      const res = await fetch(`/api/transactions?tax_year=${taxYear}${statusParam}${monthParam}&limit=${limit}`)
      const data = await res.json()
      setTransactions(data.transactions || [])
    } catch {
      toast.error("Failed to fetch transactions")
    } finally {
      setLoading(false)
    }
  }, [status, taxYear, selectedMonth])

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/categories")
      const data = await res.json()
      setCategories(data.categories || [])
    } catch {
      console.error("Failed to fetch categories")
    }
  }, [])

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`/api/transactions/stats?tax_year=${taxYear}`)
      const data = await res.json()
      setStats(data)
    } catch {
      console.error("Failed to fetch transaction stats")
    }
  }, [taxYear])

  useEffect(() => {
    fetchTransactions()
    fetchCategories()
    fetchStats()
  }, [fetchTransactions, fetchCategories, fetchStats])

  const handleCategorise = async () => {
    // Use stats count for total uncategorised (not just loaded transactions)
    const totalUncategorised = stats?.uncategorised || 0

    if (totalUncategorised === 0) {
      toast.info("No transactions to categorise")
      return
    }

    setCategorising(true)
    setCategoriseProgress(0)
    const batchCount = Math.ceil(totalUncategorised / 20)
    setCategoriseStatus(`Preparing ${totalUncategorised} transactions (${batchCount} batches)...`)

    try {
      setCategoriseProgress(5)
      setCategoriseStatus(`Starting AI categorisation...`)

      // Use categorise_all to process ALL uncategorised transactions in the database
      const res = await fetch("/api/transactions/bulk-categorise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categorise_all: true,
          tax_year: taxYear,
          stream: true,
        }),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || "Failed to categorise")
      }

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error("No response stream")
      }

      let finalData: { success?: boolean; updated?: number; total?: number } = {}

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split("\n\n")

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6))

              if (data.type === "progress") {
                setCategoriseProgress(data.progress)
                setCategoriseStatus(data.status)
              } else if (data.type === "complete") {
                finalData = data
              }
            } catch {
              // Ignore parse errors for incomplete chunks
            }
          }
        }
      }

      if (finalData.success) {
        setCategoriseProgress(100)
        setCategoriseStatus("Complete!")
        toast.success(`Categorised ${finalData.updated} of ${finalData.total} transactions`)
        await fetchTransactions()
        await fetchStats()
      } else {
        toast.error("Failed to categorise")
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to categorise transactions")
    } finally {
      // Small delay to show 100% before hiding
      setTimeout(() => {
        setCategorising(false)
        setCategoriseProgress(0)
        setCategoriseStatus("")
      }, 500)
    }
  }

  const handleConfirm = async (transaction: TransactionWithCategory) => {
    const categoryId = transaction.ai_suggested_category_id || transaction.category_id
    if (!categoryId) {
      setSelectedTransaction(transaction)
      setDialogOpen(true)
      return
    }

    try {
      const res = await fetch(`/api/transactions/${transaction.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category_id: categoryId,
          review_status: "confirmed",
        }),
      })

      if (res.ok) {
        toast.success("Transaction confirmed")
        setTransactions((prev) =>
          prev.map((tx) =>
            tx.id === transaction.id
              ? { ...tx, category_id: categoryId, review_status: "confirmed" }
              : tx
          )
        )
      }
    } catch {
      toast.error("Failed to confirm transaction")
    }
  }

  const handleIgnore = async (transaction: TransactionWithCategory) => {
    try {
      const res = await fetch(`/api/transactions/${transaction.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          review_status: "ignored",
        }),
      })

      if (res.ok) {
        toast.success("Transaction ignored")
        setTransactions((prev) =>
          prev.map((tx) =>
            tx.id === transaction.id ? { ...tx, review_status: "ignored" } : tx
          )
        )
      }
    } catch {
      toast.error("Failed to ignore transaction")
    }
  }

  const handleChangeCategory = (transaction: TransactionWithCategory) => {
    setSelectedTransaction(transaction)
    setDialogOpen(true)
  }

  const handleBulkConfirm = async () => {
    const toConfirm = transactions.filter(
      (tx) => tx.ai_suggested_category_id && tx.review_status === "pending"
    )

    if (toConfirm.length === 0) {
      toast.info("No transactions with AI suggestions to confirm")
      return
    }

    setBulkConfirming(true)
    try {
      const res = await fetch("/api/transactions/bulk-confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transaction_ids: toConfirm.map((tx) => tx.id),
        }),
      })

      const data = await res.json()
      if (data.success) {
        toast.success(`Confirmed ${data.updated} transactions`)
        await fetchTransactions()
        await fetchStats()
      } else {
        toast.error(data.error || "Failed to confirm transactions")
      }
    } catch {
      toast.error("Failed to confirm transactions")
    } finally {
      setBulkConfirming(false)
    }
  }

  const handleCategorySelect = async (categoryId: string, propertyId?: string | null) => {
    if (!selectedTransaction) return

    try {
      const updateBody: Record<string, unknown> = {
        category_id: categoryId,
        review_status: "confirmed",
      }
      // Include property_id if provided (for SA105 property transactions)
      if (propertyId !== undefined) {
        updateBody.property_id = propertyId
      }

      const res = await fetch(`/api/transactions/${selectedTransaction.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateBody),
      })

      if (res.ok) {
        const data = await res.json()
        toast.success("Category updated")
        setTransactions((prev) =>
          prev.map((tx) =>
            tx.id === selectedTransaction.id ? data.transaction : tx
          )
        )
      }
    } catch {
      toast.error("Failed to update category")
    } finally {
      setDialogOpen(false)
      setSelectedTransaction(null)
    }
  }

  const filteredTransactions = transactions.filter((tx) => {
    // Filter out personal transactions if toggle is off
    if (!showPersonal) {
      const category = tx.category || tx.ai_suggested_category
      if (category?.code === 'personal') return false
    }

    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      tx.description.toLowerCase().includes(query) ||
      tx.merchant_name?.toLowerCase().includes(query)
    )
  })

  // Use stats for total counts (from API)
  const totalPendingCount = stats?.needs_review || 0
  const totalUncategorisedCount = stats?.uncategorised || 0
  // Local counts for loaded transactions (used for Confirm All button)
  const confirmableCount = transactions.filter(
    (tx) => tx.ai_suggested_category_id && tx.review_status === "pending"
  ).length

  return (
    <div className="space-y-6">
      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-2">
        {totalPendingCount > 0 && (
          <Badge variant="secondary" className="text-sm">
            {totalPendingCount} pending review
          </Badge>
        )}
        <div className="flex-1" />
        {totalUncategorisedCount > 0 && (
          <Button onClick={handleCategorise} disabled={categorising}>
            {categorising ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Brain className="mr-2 h-4 w-4" />
            )}
            {categorising ? "Categorising..." : `Categorise ${totalUncategorisedCount}`}
          </Button>
        )}
        {confirmableCount > 0 && (
          <Button onClick={handleBulkConfirm} disabled={bulkConfirming} variant="default">
            {bulkConfirming ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CheckCheck className="mr-2 h-4 w-4" />
            )}
            {bulkConfirming ? "Confirming..." : `Confirm All ${confirmableCount}`}
          </Button>
        )}
        <Button variant="outline" onClick={() => setCsvDialogOpen(true)}>
          <Upload className="mr-2 h-4 w-4" />
          Upload CSV
        </Button>
        <Button variant="outline" onClick={fetchTransactions}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Transaction Stats */}
      {stats && stats.total > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-zinc-800">
                  <Briefcase className="h-4 w-4 text-[#15e49e]" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.business}</p>
                  <p className="text-xs text-muted-foreground">Business</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-zinc-800">
                  <User className="h-4 w-4 text-zinc-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-zinc-500">{stats.personal}</p>
                  <p className="text-xs text-muted-foreground">Personal (excluded)</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-zinc-800">
                  <AlertCircle className="h-4 w-4 text-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-amber-500">{stats.needs_review}</p>
                  <p className="text-xs text-muted-foreground">Needs review</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total transactions</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Categorisation Progress */}
      {categorising && (
        <div className="p-4 bg-[#15e49e]/10 border border-[#15e49e]/30 rounded-xl">
          <div className="flex items-center gap-3 mb-3">
            <Loader2 className="h-5 w-5 text-[#15e49e] animate-spin" />
            <span className="font-medium text-[#15e49e]">AI Categorisation in Progress</span>
            <span className="ml-auto text-sm text-[#15e49e]">{categoriseProgress}%</span>
          </div>
          <Progress value={categoriseProgress} className="h-2" />
          <p className="text-sm text-muted-foreground mt-2">{categoriseStatus}</p>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search transactions..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            {/* Month Filter */}
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-[180px]">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by month" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All months</SelectItem>
                {getMonthsForTaxYear(taxYear).map((month) => (
                  <SelectItem key={month.value} value={month.value}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Tabs value={status} onValueChange={setStatus}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="pending">
                  Pending
                  {totalPendingCount > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {totalPendingCount}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="confirmed">Confirmed</TabsTrigger>
                <TabsTrigger value="ignored">Ignored</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          {/* Personal transactions toggle */}
          <div className="flex items-center gap-2 mt-4 pt-4 border-t">
            <Checkbox
              id="show-personal"
              checked={showPersonal}
              onCheckedChange={(checked) => setShowPersonal(checked === true)}
            />
            <label
              htmlFor="show-personal"
              className="text-sm text-muted-foreground cursor-pointer"
            >
              Show personal transactions (excluded from tax calculations)
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Transactions List */}
      <Card>
        <CardHeader>
          <CardTitle>
            {filteredTransactions.length} transactions
            {selectedMonth === "all" && stats && transactions.length < stats.total && (
              <span className="text-sm font-normal text-muted-foreground ml-2">
                (showing first 100 of {stats.total} - select a month to see all)
              </span>
            )}
          </CardTitle>
          <CardDescription>
            Click confirm to accept AI suggestion, or change to select a different category
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-12 w-12 rounded" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                  <Skeleton className="h-8 w-20" />
                </div>
              ))}
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No transactions found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredTransactions.map((transaction) => (
                <TransactionRow
                  key={transaction.id}
                  transaction={transaction}
                  onConfirm={() => handleConfirm(transaction)}
                  onIgnore={() => handleIgnore(transaction)}
                  onChange={() => handleChangeCategory(transaction)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Category Dialog */}
      <CategoryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        categories={categories}
        onSelect={handleCategorySelect}
        transaction={selectedTransaction}
      />

      {/* CSV Upload Dialog */}
      <CSVUploadDialog
        open={csvDialogOpen}
        onOpenChange={setCsvDialogOpen}
        onSuccess={fetchTransactions}
      />
    </div>
  )
}
