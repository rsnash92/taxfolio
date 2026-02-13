'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowRight, Info } from 'lucide-react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { TaxSummaryCard } from './TaxSummaryCard'
import { TaxSavings } from './TaxSavings'
import { ExpenseAnomalies } from './ExpenseAnomalies'
import { MtdReadiness } from './MtdReadiness'
import { BusinessPersonalRatio } from './BusinessPersonalRatio'

const SpendingBreakdown = dynamic(() => import('./SpendingBreakdown').then(m => ({ default: m.SpendingBreakdown })), { ssr: false })
const IncomeTrend = dynamic(() => import('./IncomeTrend').then(m => ({ default: m.IncomeTrend })), { ssr: false })

export interface InsightsData {
  taxYear: string
  tax: {
    totalIncome: number
    totalExpenses: number
    taxableProfit: number
    personalAllowance: number
    taxableAfterAllowance: number
    incomeTax: number
    class2NIC: number
    class4NIC: number
    totalTaxDue: number
    effectiveRate: number
    prevYearTax: number | null
    prevYearIncome: number | null
  }
  expenseCategories: { code: string; label: string; type: string; amount: number; count: number }[]
  incomeCategories: { code: string; label: string; type: string; amount: number; count: number }[]
  monthlyTrends: { month: string; income: number; expenses: number }[]
  businessVsPersonal: {
    businessCount: number
    personalCount: number
    businessAmount: number
    personalAmount: number
  }
  anomalies: { type: string; description: string; transactionId?: string; amount?: number }[]
  readiness: {
    score: number
    currentQuarter: number
    categorised: number
    total: number
    hmrcConnected: boolean
    bankConnected: boolean
  }
  hasData: boolean
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-80" />
      <Skeleton className="h-48 w-full rounded-xl" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-80 rounded-xl" />
        <Skeleton className="h-80 rounded-xl" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    </div>
  )
}

function NoDataState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card>
        <CardContent className="flex flex-col items-center text-center py-12">
          <p className="text-lg font-medium text-gray-900 mb-2">
            Connect your bank to unlock AI insights
          </p>
          <p className="text-sm text-gray-500 mb-6 max-w-md">
            Connect your bank and categorise transactions to unlock AI insights about your business finances.
          </p>
          <Link
            href="/transactions"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-[#00e3ec] text-black hover:bg-[#00c4d4] transition-colors"
          >
            Go to Transactions <ArrowRight className="h-4 w-4" />
          </Link>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export function InsightsPage() {
  const [data, setData] = useState<InsightsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/insights/summary')
      .then((res) => res.json())
      .then((d) => setData(d))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">AI Insights</h1>
          <p className="text-sm text-gray-500 mt-1">
            Smart analysis of your business finances — updated as your transactions sync.
          </p>
        </div>
        <LoadingSkeleton />
      </div>
    )
  }

  if (!data || !data.hasData) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">AI Insights</h1>
          <p className="text-sm text-gray-500 mt-1">
            Smart analysis of your business finances — updated as your transactions sync.
          </p>
        </div>
        <NoDataState />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">AI Insights</h1>
        <p className="text-sm text-gray-500 mt-1">
          Smart analysis of your business finances — updated as your transactions sync.
          <span className="text-gray-400 ml-2">Tax Year {data.taxYear.replace('-', '/')}</span>
        </p>
      </div>

      {/* AI Disclaimer */}
      <div className="flex items-start gap-2.5 px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
        <Info className="h-4 w-4 mt-0.5 shrink-0" />
        <p>
          These insights are generated using AI and your categorised transaction data. They are estimates
          only and do not constitute tax advice. Please verify figures before submitting to HMRC and
          consult a qualified accountant for complex tax matters.
        </p>
      </div>

      {/* Tax Summary — full width */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <TaxSummaryCard tax={data.tax} />
      </motion.div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <SpendingBreakdown categories={data.expenseCategories} />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
        >
          <IncomeTrend monthlyData={data.monthlyTrends} />
        </motion.div>
      </div>

      {/* Tax Savings — full width */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <TaxSavings />
      </motion.div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.25 }}
          >
            <BusinessPersonalRatio data={data.businessVsPersonal} />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <ExpenseAnomalies anomalies={data.anomalies} />
          </motion.div>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.35 }}
        >
          <MtdReadiness readiness={data.readiness} />
        </motion.div>
      </div>
    </div>
  )
}
