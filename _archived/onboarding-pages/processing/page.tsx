"use client"

import { useEffect, useState, useCallback, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Progress } from "@/components/ui/progress"
import { OnboardingProgress } from "@/components/onboarding/onboarding-progress"
import { ProcessingStep } from "@/components/onboarding/processing-step"
import { InsightCard } from "@/components/onboarding/insight-card"
import { Bot } from "lucide-react"

type StepStatus = 'pending' | 'in_progress' | 'complete'

interface ProcessingState {
  syncingBank: StepStatus
  fetchingTransactions: StepStatus
  categorisingExpenses: StepStatus
  calculatingTax: StepStatus
}

const insights = [
  "Found software subscriptions that could be tax deductible",
  "Identified potential business travel expenses",
  "Spotted transfers that won't affect your tax",
  "Categorised recurring business expenses",
]

function ProcessingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isCSV = searchParams.get("source") === "csv"

  const [progress, setProgress] = useState(0)
  const [currentInsight, setCurrentInsight] = useState<string | null>(null)
  const [steps, setSteps] = useState<ProcessingState>({
    syncingBank: 'pending',
    fetchingTransactions: 'pending',
    categorisingExpenses: 'pending',
    calculatingTax: 'pending',
  })

  const updateStep = useCallback((step: keyof ProcessingState, status: StepStatus) => {
    setSteps(prev => ({ ...prev, [step]: status }))
  }, [])

  useEffect(() => {
    let cancelled = false

    async function runProcessing() {
      // Step 1: Syncing bank (or skip for CSV)
      if (!isCSV) {
        updateStep('syncingBank', 'in_progress')
        setProgress(10)

        // Simulate bank sync
        await new Promise(r => setTimeout(r, 1500))
        if (cancelled) return

        updateStep('syncingBank', 'complete')
      } else {
        updateStep('syncingBank', 'complete')
      }

      // Step 2: Fetching transactions
      updateStep('fetchingTransactions', 'in_progress')
      setProgress(30)

      try {
        // Fetch real transaction count
        const txRes = await fetch("/api/transactions?limit=1")
        const txData = await txRes.json()

        await new Promise(r => setTimeout(r, 1500))
        if (cancelled) return

        updateStep('fetchingTransactions', 'complete')
        setProgress(50)

        // Show first insight
        setCurrentInsight(insights[Math.floor(Math.random() * insights.length)])

        // Step 3: AI Categorisation
        updateStep('categorisingExpenses', 'in_progress')
        setProgress(60)

        // Check if there are pending transactions to categorise
        const pendingRes = await fetch("/api/transactions?status=pending")
        const pendingData = await pendingRes.json()
        const pendingTransactions = pendingData.transactions || []

        if (pendingTransactions.length > 0) {
          // Trigger bulk categorisation
          await fetch("/api/transactions/bulk-categorise", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              transaction_ids: pendingTransactions.slice(0, 50).map((t: { id: string }) => t.id),
            }),
          })
        }

        await new Promise(r => setTimeout(r, 2000))
        if (cancelled) return

        updateStep('categorisingExpenses', 'complete')
        setProgress(80)

        // Show new insight
        const newInsight = insights.filter(i => i !== currentInsight)[
          Math.floor(Math.random() * (insights.length - 1))
        ]
        setCurrentInsight(newInsight)

        // Step 4: Calculating tax
        updateStep('calculatingTax', 'in_progress')
        setProgress(90)

        await new Promise(r => setTimeout(r, 1500))
        if (cancelled) return

        updateStep('calculatingTax', 'complete')
        setProgress(100)

        // Navigate to complete
        await new Promise(r => setTimeout(r, 500))
        if (cancelled) return

        router.push("/onboarding/complete")
      } catch (error) {
        console.error("Processing error:", error)
        // Still navigate to complete even on error
        router.push("/onboarding/complete")
      }
    }

    runProcessing()

    return () => {
      cancelled = true
    }
  }, [router, isCSV, updateStep])

  return (
    <div className="flex flex-col items-center text-center space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Bot className="w-8 h-8 text-primary" />
        <h1 className="text-2xl font-bold">AI is analysing...</h1>
      </div>

      {/* Progress Bar */}
      <div className="w-full space-y-2">
        <Progress value={progress} className="h-2" />
        <p className="text-sm text-muted-foreground">{progress}%</p>
      </div>

      {/* Steps */}
      <div className="w-full text-left space-y-3">
        {!isCSV && (
          <ProcessingStep
            label="Connected to your bank"
            status={steps.syncingBank}
          />
        )}
        <ProcessingStep
          label="Synced transactions"
          status={steps.fetchingTransactions}
        />
        <ProcessingStep
          label="Categorising expenses"
          status={steps.categorisingExpenses}
        />
        <ProcessingStep
          label="Calculating tax position"
          status={steps.calculatingTax}
        />
      </div>

      {/* Insight */}
      {currentInsight && (
        <InsightCard message={currentInsight} />
      )}

      {/* Progress */}
      <OnboardingProgress currentStep={5} />
    </div>
  )
}

export default function ProcessingPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center text-center space-y-8">
        <div className="flex items-center gap-3">
          <Bot className="w-8 h-8 text-primary" />
          <h1 className="text-2xl font-bold">Loading...</h1>
        </div>
      </div>
    }>
      <ProcessingContent />
    </Suspense>
  )
}
