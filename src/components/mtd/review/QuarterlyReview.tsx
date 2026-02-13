'use client'

import { useEffect, useState, useCallback } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { getQuarterNumber } from '@/lib/mtd/quarters'
import { buildClientRequestHeaders } from '@/lib/mtd/fraud-headers'
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
  const [consolidated, setConsolidated] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submissionResult, setSubmissionResult] = useState<{
    correlationId?: string
    submittedAt: string
  } | null>(null)

  const taxYear = deriveTaxYear(periodStart)
  const quarterNumber = getQuarterNumber(periodStart)

  // Fetch aggregate data (includes adjustments from DB)
  const fetchData = useCallback(async () => {
    const params = new URLSearchParams({
      businessType,
      businessId,
      periodStart,
      periodEnd,
      taxYear,
    })
    try {
      const res = await fetch(`/api/mtd/aggregate?${params}`)
      if (!res.ok) throw new Error('Failed to load data')
      const d: AggregateResponse = await res.json()
      setData(d)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }, [businessType, businessId, periodStart, periodEnd, taxYear])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Re-fetch when adjustments change (called from ExpenseSection after add/edit/delete)
  const handleAdjustmentChange = useCallback(() => {
    fetchData()
  }, [fetchData])

  const handleSubmit = useCallback(async () => {
    if (!data) return
    setSubmitting(true)
    setSubmitError(null)

    try {
      // Build SelfEmploymentPeriodData from cumulative totals
      // Adjustments are already included in data.adjustmentsByField from the aggregate API
      const incomes = {
        turnover: data.cumulative.income.turnover,
        other: data.cumulative.income.other || undefined,
      }

      let expenses: SelfEmploymentExpenses
      if (consolidated) {
        // Sum all cumulative expenses + all adjustment totals
        const baseTotal = Object.values(data.cumulative.expenses).reduce((s, v) => s + v, 0)
        const adjTotal = Object.entries(data.adjustmentsByField)
          .filter(([field]) => field !== 'turnover')
          .reduce((s, [, fb]) => s + fb.adjustmentTotal, 0)
        expenses = { consolidatedExpenses: Math.round((baseTotal + adjTotal) * 100) / 100 }
      } else {
        expenses = {} as SelfEmploymentExpenses
        for (const cat of SELF_EMPLOYMENT_EXPENSE_CATEGORIES) {
          const base = data.cumulative.expenses[cat.key] || 0
          const adjTotal = data.adjustmentsByField[cat.key]?.adjustmentTotal || 0
          const total = Math.round((base + adjTotal) * 100) / 100
          if (total > 0) {
            (expenses as Record<string, number>)[cat.key] = total
          }
        }
      }

      const submissionData: SelfEmploymentPeriodData = {
        incomes: incomes.turnover > 0 || (incomes.other && incomes.other > 0) ? incomes : undefined,
        expenses: Object.keys(expenses).length > 0 ? expenses : undefined,
      }

      // Build adjustment breakdown for the submission record
      const adjustmentBreakdown: Record<string, { amount: number; description: string; type: string }[]> = {}
      for (const [field, fb] of Object.entries(data.adjustmentsByField)) {
        if (fb.adjustments.length > 0) {
          adjustmentBreakdown[field] = fb.adjustments.map((a) => ({
            amount: a.amount,
            description: a.description,
            type: a.adjustmentType,
          }))
        }
      }

      const fraudHeaders = buildClientRequestHeaders()
      const res = await fetch('/api/mtd/self-employment/cumulative', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...fraudHeaders },
        body: JSON.stringify({
          businessId,
          taxYear,
          periodDates: {
            periodStartDate: periodStart,
            periodEndDate: periodEnd,
          },
          data: submissionData,
          adjustmentBreakdown,
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
  }, [data, consolidated, businessId, taxYear, periodStart, periodEnd])

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
  if (submissionResult) {
    return (
      <SubmissionSuccess
        correlationId={submissionResult.correlationId}
        submittedAt={submissionResult.submittedAt}
        cumulativeIncome={data.totals.cumulativeIncome}
        cumulativeExpenses={data.totals.cumulativeExpenses}
        netProfit={data.totals.cumulativeIncome - data.totals.cumulativeExpenses}
        quarterNumber={quarterNumber}
        taxYear={taxYear}
      />
    )
  }

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
        adjustmentsByField={data.adjustmentsByField}
        consolidated={consolidated}
        onConsolidatedChange={setConsolidated}
        showConsolidatedOption={data.turnover < 90000}
        businessId={businessId}
        taxYear={taxYear}
        periodStart={periodStart}
        periodEnd={periodEnd}
        onAdjustmentChange={handleAdjustmentChange}
      />

      <NetSummary
        cumulativeIncome={data.totals.cumulativeIncome}
        cumulativeExpenses={data.totals.cumulativeExpenses}
      />

      <SubmitDeclaration
        cumulativeIncome={data.totals.cumulativeIncome}
        cumulativeExpenses={data.totals.cumulativeExpenses}
        submitting={submitting}
        error={submitError}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
