'use client'

import { useEffect, useState, useCallback } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { getQuarterNumber } from '@/lib/mtd/quarters'
import type { AggregateResponse } from '@/app/api/mtd/aggregate/route'
import type { SelfEmploymentPeriodData, SelfEmploymentExpenses } from '@/types/mtd'
import { ReviewHeader } from './ReviewHeader'
import { PreSubmissionWarnings } from './PreSubmissionWarnings'
import { IncomeSection } from './IncomeSection'
import { ExpenseSection } from './ExpenseSection'
import { NetSummary } from './NetSummary'
import { SubmitDeclaration } from './SubmitDeclaration'
import { SubmissionSuccess } from './SubmissionSuccess'
import { SELF_EMPLOYMENT_EXPENSE_CATEGORIES } from '@/types/mtd'

interface QuarterlyReviewProps {
  businessId: string
  businessType: string
  periodStart: string
  periodEnd: string
  dueDate?: string
}

function deriveTaxYear(periodStart: string): string {
  const d = new Date(periodStart + 'T00:00:00')
  const year = d.getFullYear()
  const month = d.getMonth() // 0-indexed
  // Tax year runs Apr 6 – Apr 5. If Jan-Mar, tax year started previous April.
  const startYear = month < 3 || (month === 3 && d.getDate() < 6) ? year - 1 : year
  const endYear = (startYear + 1) % 100
  return `${startYear}-${endYear.toString().padStart(2, '0')}`
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-4 w-32 mb-3" />
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-4 w-48" />
      </div>
      <Skeleton className="h-48 w-full rounded-xl" />
      <Skeleton className="h-64 w-full rounded-xl" />
      <Skeleton className="h-32 w-full rounded-xl" />
      <Skeleton className="h-40 w-full rounded-xl" />
    </div>
  )
}

export function QuarterlyReview({
  businessId,
  businessType,
  periodStart,
  periodEnd,
  dueDate,
}: QuarterlyReviewProps) {
  const [data, setData] = useState<AggregateResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Submission state
  const [adjustments, setAdjustments] = useState<Record<string, number>>({})
  const [consolidated, setConsolidated] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submissionResult, setSubmissionResult] = useState<{
    correlationId?: string
    submittedAt: string
  } | null>(null)

  const taxYear = deriveTaxYear(periodStart)
  const quarterNumber = getQuarterNumber(periodStart)

  // Warn on navigate-away with unsaved adjustments
  useEffect(() => {
    const hasAdjustments = Object.values(adjustments).some((v) => v !== 0)
    if (!hasAdjustments) return

    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [adjustments])

  // Fetch aggregate data
  useEffect(() => {
    const params = new URLSearchParams({
      businessType,
      periodStart,
      periodEnd,
      taxYear,
    })
    fetch(`/api/mtd/aggregate?${params}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load data')
        return res.json()
      })
      .then((d: AggregateResponse) => setData(d))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [businessType, periodStart, periodEnd, taxYear])

  const handleAdjustmentChange = useCallback((field: string, value: number) => {
    setAdjustments((prev) => ({ ...prev, [field]: value }))
  }, [])

  const handleSubmit = useCallback(async () => {
    if (!data) return
    setSubmitting(true)
    setSubmitError(null)

    try {
      // Build SelfEmploymentPeriodData from cumulative totals + adjustments
      const incomes = {
        turnover: data.cumulative.income.turnover,
        other: data.cumulative.income.other || undefined,
      }

      let expenses: SelfEmploymentExpenses
      if (consolidated) {
        const baseTotal = Object.values(data.cumulative.expenses).reduce((s, v) => s + v, 0)
        const adj = adjustments['consolidatedExpenses'] || 0
        expenses = { consolidatedExpenses: Math.round((baseTotal + adj) * 100) / 100 }
      } else {
        expenses = {} as SelfEmploymentExpenses
        for (const cat of SELF_EMPLOYMENT_EXPENSE_CATEGORIES) {
          const base = data.cumulative.expenses[cat.key] || 0
          const adj = adjustments[cat.key] || 0
          const total = Math.round((base + adj) * 100) / 100
          if (total > 0) {
            (expenses as Record<string, number>)[cat.key] = total
          }
        }
      }

      const submissionData: SelfEmploymentPeriodData = {
        incomes: incomes.turnover > 0 || (incomes.other && incomes.other > 0) ? incomes : undefined,
        expenses: Object.keys(expenses).length > 0 ? expenses : undefined,
      }

      const res = await fetch('/api/mtd/self-employment/cumulative', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId,
          taxYear,
          periodDates: {
            periodStartDate: periodStart,
            periodEndDate: periodEnd,
          },
          data: submissionData,
        }),
      })

      const result = await res.json()

      if (!res.ok) {
        throw new Error(result.error || 'Submission failed')
      }

      setSubmissionResult({
        correlationId: result.correlationId,
        submittedAt: result.submittedAt,
      })
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Submission failed')
    } finally {
      setSubmitting(false)
    }
  }, [data, consolidated, adjustments, businessId, taxYear, periodStart, periodEnd])

  if (loading) return <LoadingSkeleton />

  if (error || !data) {
    return (
      <div className="space-y-4">
        <ReviewHeader
          quarterNumber={quarterNumber}
          taxYear={taxYear}
          periodStart={periodStart}
          periodEnd={periodEnd}
          dueDate={dueDate}
        />
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error || 'Failed to load transaction data'}
        </div>
      </div>
    )
  }

  // Show success state only for a just-completed submission (client state).
  // If there's a previous submission from DB, show the review page with resubmission badge instead.
  if (submissionResult) {
    const totalAdjustments = Object.values(adjustments).reduce((s, v) => s + v, 0)
    const cumulativeExpenses = data.totals.cumulativeExpenses + totalAdjustments

    return (
      <SubmissionSuccess
        correlationId={submissionResult.correlationId}
        submittedAt={submissionResult.submittedAt}
        cumulativeIncome={data.totals.cumulativeIncome}
        cumulativeExpenses={cumulativeExpenses}
        netProfit={data.totals.cumulativeIncome - cumulativeExpenses}
        quarterNumber={quarterNumber}
        taxYear={taxYear}
      />
    )
  }

  const totalAdjustments = Object.values(adjustments).reduce((s, v) => s + v, 0)
  const cumulativeExpensesWithAdj = data.totals.cumulativeExpenses + totalAdjustments

  return (
    <div className="space-y-6 pb-12">
      <ReviewHeader
        quarterNumber={quarterNumber}
        taxYear={taxYear}
        periodStart={periodStart}
        periodEnd={periodEnd}
        dueDate={dueDate}
        previousSubmission={data.previousSubmission}
      />

      <PreSubmissionWarnings warnings={data.warnings} />

      <IncomeSection
        thisQuarter={data.thisQuarter}
        cumulative={data.cumulative}
      />

      <ExpenseSection
        thisQuarter={data.thisQuarter}
        cumulative={data.cumulative}
        adjustments={adjustments}
        onAdjustmentChange={handleAdjustmentChange}
        consolidated={consolidated}
        onConsolidatedChange={setConsolidated}
        showConsolidatedOption={data.turnover < 90000}
      />

      <NetSummary
        cumulativeIncome={data.totals.cumulativeIncome}
        cumulativeExpenses={data.totals.cumulativeExpenses}
        adjustments={adjustments}
      />

      <SubmitDeclaration
        cumulativeIncome={data.totals.cumulativeIncome}
        cumulativeExpenses={cumulativeExpensesWithAdj}
        adjustments={adjustments}
        submitting={submitting}
        error={submitError}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
