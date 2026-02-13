'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { formatCurrency } from '@/lib/utils'
import { getCategoryLabel, CATEGORY_LABELS } from '@/lib/category-labels'
import {
  Brain,
  CheckCircle2,
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ArrowUpDown,
} from 'lucide-react'
import { toast } from 'sonner'

interface Category {
  id: string
  code: string
  name: string
  type: string
  hmrc_box: string | null
}

interface TransactionRow {
  id: string
  date: string
  description: string
  amount: number
  merchant_name: string | null
  review_status: string
  ai_confidence: number | null
  category_id: string | null
  ai_suggested_category_id: string | null
  category: Category | null
  ai_suggested_category: Category | null
}

type FilterTab = 'all' | 'needs_review' | 'business' | 'personal'

const PAGE_SIZE = 50

export default function TransactionsPage() {
  const supabase = createClient()

  const [transactions, setTransactions] = useState<TransactionRow[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterTab>('all')
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [sortByConfidence, setSortByConfidence] = useState(false)

  // AI categorisation state
  const [isCategorising, setIsCategorising] = useState(false)
  const [categoriseProgress, setCategoriseProgress] = useState(0)
  const [categoriseStatus, setCategoriseStatus] = useState('')

  // Category edit dialog
  const [editingTransaction, setEditingTransaction] = useState<TransactionRow | null>(null)

  // Confirm all dialog
  const [showConfirmAll, setShowConfirmAll] = useState(false)

  const fetchTransactions = useCallback(async () => {
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        id, date, description, amount, merchant_name, review_status,
        ai_confidence, category_id, ai_suggested_category_id,
        category:categories!transactions_category_id_fkey(id, code, name, type, hmrc_box),
        ai_suggested_category:categories!transactions_ai_suggested_category_id_fkey(id, code, name, type, hmrc_box)
      `)
      .order('date', { ascending: false })

    if (error) {
      console.error('[Transactions] Fetch error:', error)
      toast.error('Failed to load transactions')
      return
    }

    setTransactions((data as unknown as TransactionRow[]) || [])
    setLoading(false)
  }, [supabase])

  const fetchCategories = useCallback(async () => {
    const { data } = await supabase
      .from('categories')
      .select('id, code, name, type, hmrc_box')
      .order('display_order')

    setCategories(data || [])
  }, [supabase])

  useEffect(() => {
    fetchTransactions()
    fetchCategories()
  }, [fetchTransactions, fetchCategories])

  // ── Stats (always computed from full dataset) ──

  const stats = useMemo(() => {
    const total = transactions.length
    let businessCount = 0, personalCount = 0, needsReviewCount = 0
    let businessAmount = 0, personalAmount = 0

    for (const tx of transactions) {
      const cat = tx.category || tx.ai_suggested_category
      if (tx.review_status === 'confirmed' && cat) {
        if (cat.code === 'personal') {
          personalCount++
          personalAmount += Math.abs(tx.amount)
        } else {
          businessCount++
          businessAmount += Math.abs(tx.amount)
        }
      } else {
        needsReviewCount++
      }
    }

    return { total, businessCount, personalCount, needsReviewCount, businessAmount, personalAmount }
  }, [transactions])

  // ── Filtering + Search + Sort ──

  const filteredTransactions = useMemo(() => {
    let result = transactions

    // Filter
    if (filter === 'needs_review') {
      result = result.filter((tx) => tx.review_status !== 'confirmed')
    } else if (filter === 'business') {
      result = result.filter((tx) => {
        const cat = tx.category || tx.ai_suggested_category
        return cat && cat.code !== 'personal'
      })
    } else if (filter === 'personal') {
      result = result.filter((tx) => {
        const cat = tx.category || tx.ai_suggested_category
        return cat && cat.code === 'personal'
      })
    }

    // Search
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (tx) =>
          tx.description.toLowerCase().includes(q) ||
          (tx.merchant_name && tx.merchant_name.toLowerCase().includes(q)),
      )
    }

    // Sort by confidence (ascending = least confident first)
    if (sortByConfidence) {
      result = [...result].sort((a, b) => (a.ai_confidence ?? 1) - (b.ai_confidence ?? 1))
    }

    return result
  }, [transactions, filter, search, sortByConfidence])

  // ── Pagination ──

  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / PAGE_SIZE))
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  )

  // Reset page when filter/search changes
  useEffect(() => {
    setCurrentPage(1)
  }, [filter, search])

  // ── AI Categorisation ──

  const uncategorisedCount = transactions.filter((tx) => !tx.ai_suggested_category_id).length

  const handleCategorise = async () => {
    if (uncategorisedCount === 0) {
      toast.info('All transactions are already categorised')
      return
    }

    setIsCategorising(true)
    setCategoriseProgress(0)
    setCategoriseStatus('Starting AI categorisation...')

    try {
      // Don't send IDs — server fetches all uncategorised for the user.
      // Sending 1000+ IDs hits PostgREST URL length limits.
      const res = await fetch('/api/transactions/categorise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stream: true }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Categorisation failed')
      }

      const reader = res.body?.getReader()
      if (!reader) throw new Error('No response stream')

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const event = JSON.parse(line.slice(6))
            if (event.type === 'progress') {
              setCategoriseProgress(event.progress)
              setCategoriseStatus(
                `Processing batch ${event.batch}/${event.totalBatches}...`,
              )
            } else if (event.type === 'complete') {
              setCategoriseStatus(`Done! ${event.total} transactions categorised.`)
            }
          } catch {
            // ignore parse errors for partial chunks
          }
        }
      }

      // Refresh data
      await fetchTransactions()
      toast.success('AI categorisation complete')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Categorisation failed'
      toast.error(msg)
    } finally {
      setIsCategorising(false)
      setCategoriseProgress(0)
      setCategoriseStatus('')
    }
  }

  // ── Confirm All ──

  const pendingConfirmations = transactions.filter(
    (tx) => tx.ai_suggested_category_id && tx.review_status !== 'confirmed',
  )

  const confirmAllBreakdown = useMemo(() => {
    const breakdown = new Map<string, number>()
    for (const tx of pendingConfirmations) {
      const label = tx.ai_suggested_category
        ? getCategoryLabel(tx.ai_suggested_category.code)
        : 'Unknown'
      breakdown.set(label, (breakdown.get(label) || 0) + 1)
    }
    return Array.from(breakdown.entries()).sort((a, b) => b[1] - a[1])
  }, [pendingConfirmations])

  const handleConfirmAll = async () => {
    if (pendingConfirmations.length === 0) return

    try {
      // No IDs needed — server confirms all pending AI suggestions for the user
      const res = await fetch('/api/transactions/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'confirm_all' }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      toast.success(`Confirmed ${data.confirmed} transactions`)
      await fetchTransactions()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Bulk confirm failed'
      toast.error(msg)
    } finally {
      setShowConfirmAll(false)
    }
  }

  // ── Single Transaction Actions ──

  const handleConfirmSuggestion = async (tx: TransactionRow) => {
    if (!tx.ai_suggested_category_id) return

    try {
      const res = await fetch(`/api/transactions/${tx.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category_id: tx.ai_suggested_category_id,
          review_status: 'confirmed',
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error)
      }

      // Update local state
      setTransactions((prev) =>
        prev.map((t) =>
          t.id === tx.id
            ? { ...t, category_id: tx.ai_suggested_category_id, category: tx.ai_suggested_category, review_status: 'confirmed' }
            : t,
        ),
      )
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to confirm'
      toast.error(msg)
    }
  }

  const handleMarkPersonal = async (tx: TransactionRow) => {
    const personalCat = categories.find((c) => c.code === 'personal')
    if (!personalCat) return

    try {
      const res = await fetch(`/api/transactions/${tx.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category_id: personalCat.id,
          review_status: 'confirmed',
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error)
      }

      setTransactions((prev) =>
        prev.map((t) =>
          t.id === tx.id
            ? { ...t, category_id: personalCat.id, category: personalCat, review_status: 'confirmed' }
            : t,
        ),
      )
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update'
      toast.error(msg)
    }
  }

  const handleSetCategory = async (categoryId: string) => {
    if (!editingTransaction) return

    const cat = categories.find((c) => c.id === categoryId)
    if (!cat) return

    try {
      const res = await fetch(`/api/transactions/${editingTransaction.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category_id: categoryId,
          review_status: 'confirmed',
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error)
      }

      setTransactions((prev) =>
        prev.map((t) =>
          t.id === editingTransaction.id
            ? { ...t, category_id: categoryId, category: cat, review_status: 'confirmed' }
            : t,
        ),
      )

      setEditingTransaction(null)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to set category'
      toast.error(msg)
    }
  }

  // ── Helpers ──

  function formatDate(dateStr: string) {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const filterTabs: { key: FilterTab; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: stats.total },
    { key: 'needs_review', label: 'Needs Review', count: stats.needsReviewCount },
    { key: 'business', label: 'Business', count: stats.businessCount },
    { key: 'personal', label: 'Personal', count: stats.personalCount },
  ]

  if (loading) {
    return (
      <div className="p-8 space-y-6">
        <h1 className="text-2xl font-semibold text-gray-900">Transactions</h1>
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-2" />
                <div className="h-8 w-16 bg-gray-200 rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="p-8 text-center text-gray-500">
            Loading transactions...
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Transactions</h1>

      {/* Stat Cards — clickable to filter */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card
          className={`cursor-pointer transition-all hover:shadow-md ${filter === 'all' ? 'ring-2 ring-[#00e3ec]' : ''}`}
          onClick={() => setFilter('all')}
        >
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Total</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </CardContent>
        </Card>
        <Card
          className={`cursor-pointer transition-all hover:shadow-md ${filter === 'business' ? 'ring-2 ring-[#00e3ec]' : ''}`}
          onClick={() => setFilter('business')}
        >
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Business</p>
            <p className="text-2xl font-bold text-[#00c4d4]">{stats.businessCount}</p>
            <p className="text-xs text-gray-400">{formatCurrency(stats.businessAmount)}</p>
          </CardContent>
        </Card>
        <Card
          className={`cursor-pointer transition-all hover:shadow-md ${filter === 'personal' ? 'ring-2 ring-[#00e3ec]' : ''}`}
          onClick={() => setFilter('personal')}
        >
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Personal</p>
            <p className="text-2xl font-bold text-gray-400">{stats.personalCount}</p>
            <p className="text-xs text-gray-400">{formatCurrency(stats.personalAmount)}</p>
          </CardContent>
        </Card>
        <Card
          className={`cursor-pointer transition-all hover:shadow-md ${filter === 'needs_review' ? 'ring-2 ring-[#00e3ec]' : ''}`}
          onClick={() => setFilter('needs_review')}
        >
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Needs Review</p>
            <p className="text-2xl font-bold text-amber-500">{stats.needsReviewCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* AI Progress Bar */}
      {isCategorising && (
        <Card>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-[#00c4d4]" />
                {categoriseStatus}
              </span>
              <span className="font-medium">{categoriseProgress}%</span>
            </div>
            <Progress value={categoriseProgress} />
          </CardContent>
        </Card>
      )}

      {/* Action Bar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Filter Tabs */}
        <div className="flex rounded-lg border bg-white overflow-hidden">
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                filter === tab.key
                  ? 'bg-[#00e3ec]/10 text-[#00c4d4] border-b-2 border-[#00c4d4]'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              {tab.label}
              <span className="ml-1.5 text-xs text-gray-400">({tab.count})</span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search transactions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Sort by confidence */}
        <Button
          variant={sortByConfidence ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSortByConfidence(!sortByConfidence)}
        >
          <ArrowUpDown className="h-4 w-4 mr-1" />
          Confidence
        </Button>

        <div className="flex-1" />

        {/* Categorise Button */}
        <Button
          onClick={handleCategorise}
          disabled={isCategorising || uncategorisedCount === 0}
          className="bg-[#00e3ec] hover:bg-[#00c4d4] text-black"
        >
          <Brain className="h-4 w-4 mr-2" />
          {isCategorising ? 'Categorising...' : `Categorise${uncategorisedCount > 0 ? ` (${uncategorisedCount})` : ''}`}
        </Button>

        {/* Confirm All Button */}
        <Button
          variant="outline"
          onClick={() => setShowConfirmAll(true)}
          disabled={pendingConfirmations.length === 0}
        >
          <CheckCircle2 className="h-4 w-4 mr-2" />
          Confirm All ({pendingConfirmations.length})
        </Button>
      </div>

      {/* Transaction Table */}
      {filteredTransactions.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-gray-500">
            {transactions.length === 0
              ? 'No transactions yet. Sync your bank from Settings to import them.'
              : 'No transactions match your filter.'}
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right w-[120px]">Amount</TableHead>
                <TableHead className="w-[180px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedTransactions.map((tx) => {
                const confirmedCat = tx.category
                const suggestedCat = tx.ai_suggested_category
                const isConfirmed = tx.review_status === 'confirmed' && confirmedCat
                const isPersonal = confirmedCat?.code === 'personal' || suggestedCat?.code === 'personal'

                return (
                  <TableRow
                    key={tx.id}
                    className={isPersonal && isConfirmed ? 'opacity-50' : ''}
                  >
                    <TableCell className="text-gray-500 text-xs">
                      {formatDate(tx.date)}
                    </TableCell>
                    <TableCell>
                      <p className="font-medium text-gray-900 truncate max-w-[300px]">
                        {tx.merchant_name || tx.description}
                      </p>
                      {tx.merchant_name && tx.merchant_name !== tx.description && (
                        <p className="text-xs text-gray-400 truncate max-w-[300px]">
                          {tx.description}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      {isConfirmed ? (
                        <Badge
                          className="bg-green-50 text-green-700 border-green-200 cursor-pointer hover:bg-green-100"
                          onClick={() => setEditingTransaction(tx)}
                        >
                          {getCategoryLabel(confirmedCat.code)}
                        </Badge>
                      ) : suggestedCat ? (
                        <Badge
                          className="bg-amber-50 text-amber-700 border-amber-200 cursor-pointer hover:bg-amber-100"
                          onClick={() => setEditingTransaction(tx)}
                        >
                          AI: {getCategoryLabel(suggestedCat.code)}
                          {tx.ai_confidence !== null && (
                            <span className="ml-1 opacity-60">
                              ({Math.round(tx.ai_confidence * 100)}%)
                            </span>
                          )}
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="text-gray-400 cursor-pointer hover:bg-gray-50"
                          onClick={() => setEditingTransaction(tx)}
                        >
                          Uncategorised
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={`font-mono text-sm font-medium ${
                          tx.amount >= 0 ? 'text-green-600' : 'text-gray-900'
                        }`}
                      >
                        {tx.amount >= 0 ? '+' : '-'}
                        {formatCurrency(Math.abs(tx.amount))}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {suggestedCat && !isConfirmed && suggestedCat.code !== 'personal' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs text-[#00c4d4] hover:text-[#00c4d4] hover:bg-[#00e3ec]/10"
                            onClick={() => handleConfirmSuggestion(tx)}
                          >
                            Confirm
                          </Button>
                        )}
                        {!isConfirmed && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs text-gray-400 hover:text-red-500"
                            onClick={() => handleMarkPersonal(tx)}
                          >
                            Personal
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs text-gray-400"
                          onClick={() => setEditingTransaction(tx)}
                        >
                          Edit
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing {(currentPage - 1) * PAGE_SIZE + 1}–
            {Math.min(currentPage * PAGE_SIZE, filteredTransactions.length)} of{' '}
            {filteredTransactions.length}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Category Selection Dialog */}
      <Dialog open={!!editingTransaction} onOpenChange={() => setEditingTransaction(null)}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Select Category</DialogTitle>
            {editingTransaction && (
              <p className="text-sm text-gray-500">
                {editingTransaction.merchant_name || editingTransaction.description}
                {' — '}
                <span className={editingTransaction.amount >= 0 ? 'text-green-600' : ''}>
                  {formatCurrency(Math.abs(editingTransaction.amount))}
                </span>
              </p>
            )}
          </DialogHeader>
          <div className="space-y-1">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider px-2 pt-2">Income</p>
            {categories
              .filter((c) => c.type === 'income')
              .map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleSetCategory(cat.id)}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors flex justify-between items-center"
                >
                  <span className="text-sm font-medium">{getCategoryLabel(cat.code)}</span>
                  {cat.hmrc_box && (
                    <span className="text-xs text-gray-400">SA103 {cat.hmrc_box}</span>
                  )}
                </button>
              ))}

            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider px-2 pt-3">Expenses</p>
            {categories
              .filter((c) => c.type === 'expense')
              .map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleSetCategory(cat.id)}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors flex justify-between items-center"
                >
                  <span className="text-sm font-medium">{getCategoryLabel(cat.code)}</span>
                  {cat.hmrc_box && (
                    <span className="text-xs text-gray-400">SA103 {cat.hmrc_box}</span>
                  )}
                </button>
              ))}

            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider px-2 pt-3">Other</p>
            {categories
              .filter((c) => c.type !== 'income' && c.type !== 'expense')
              .map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleSetCategory(cat.id)}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors flex justify-between items-center"
                >
                  <span className="text-sm font-medium">{getCategoryLabel(cat.code)}</span>
                </button>
              ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirm All AlertDialog */}
      <AlertDialog open={showConfirmAll} onOpenChange={setShowConfirmAll}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Confirm {pendingConfirmations.length} AI suggestions?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                <p className="mb-3">
                  This will accept all pending AI category suggestions. Breakdown:
                </p>
                <div className="space-y-1 max-h-[200px] overflow-y-auto">
                  {confirmAllBreakdown.map(([label, count]) => (
                    <div key={label} className="flex justify-between text-sm">
                      <span>{label}</span>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmAll}>
              Confirm All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
