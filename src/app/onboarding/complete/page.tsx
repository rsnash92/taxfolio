"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { OnboardingProgress } from "@/components/onboarding/onboarding-progress"
import { TaxSummaryCard } from "@/components/onboarding/tax-summary-card"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertCircle, PartyPopper } from "lucide-react"

interface Summary {
  income: number
  expenses: number
  profit: number
  estimated_tax: number
  pending_count: number
  total_transactions: number
}

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

function CompleteContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const skipped = searchParams.get("skip") === "true"

  const [summary, setSummary] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchSummary() {
      try {
        // Mark onboarding as complete
        await fetch("/api/onboarding/complete", { method: "POST" })

        if (!skipped) {
          const res = await fetch("/api/onboarding/summary")
          const data = await res.json()
          setSummary(data)
        }
      } catch (error) {
        console.error("Error fetching summary:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchSummary()
  }, [skipped])

  const taxYear = getCurrentTaxYear()

  if (skipped) {
    return (
      <div className="flex flex-col items-center text-center space-y-8 animate-in fade-in duration-500">
        <PartyPopper className="w-12 h-12 text-[#00e3ec]" />

        <div className="space-y-2">
          <h1 className="text-2xl font-bold">You&apos;re all set!</h1>
          <p className="text-muted-foreground">
            Connect your bank when you&apos;re ready to see your tax position.
          </p>
        </div>

        <div className="w-full space-y-3">
          <Button
            size="lg"
            className="w-full rounded-full bg-[#00e3ec] hover:bg-[#00c4d4] text-black font-semibold"
            onClick={() => router.push("/dashboard")}
          >
            Go to Dashboard
          </Button>
        </div>

        <OnboardingProgress currentStep={5} totalSteps={5} />
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center text-center space-y-8">
        <Skeleton className="w-12 h-12 rounded-full" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center text-center space-y-6 animate-in fade-in duration-500">
      {/* Celebration */}
      <PartyPopper className="w-12 h-12 text-[#00e3ec]" />

      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Your tax position is ready!</h1>
        <p className="text-muted-foreground">Tax Year {taxYear}</p>
      </div>

      {/* Summary Card */}
      {summary && (
        <TaxSummaryCard
          income={summary.income}
          expenses={summary.expenses}
          profit={summary.profit}
          estimatedTax={summary.estimated_tax}
        />
      )}

      {/* Pending Alert */}
      {summary && summary.pending_count > 0 && (
        <Alert className="text-left">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>{summary.pending_count} transactions</strong> need your review.
            AI categorised them but wants you to confirm.
          </AlertDescription>
        </Alert>
      )}

      {/* No transactions message */}
      {summary && summary.total_transactions === 0 && (
        <Alert className="text-left">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No transactions found yet. Import transactions or connect your bank to see your tax summary.
          </AlertDescription>
        </Alert>
      )}

      {/* CTAs */}
      <div className="w-full space-y-3">
        {summary && summary.pending_count > 0 ? (
          <>
            <Button
              size="lg"
              className="w-full rounded-full bg-[#00e3ec] hover:bg-[#00c4d4] text-black font-semibold"
              onClick={() => router.push("/transactions?status=pending")}
            >
              Review Transactions
            </Button>
            <Button
              variant="outline"
              className="w-full rounded-full"
              onClick={() => router.push("/dashboard")}
            >
              Go to Dashboard
            </Button>
          </>
        ) : (
          <Button
            size="lg"
            className="w-full rounded-full bg-[#00e3ec] hover:bg-[#00c4d4] text-black font-semibold"
            onClick={() => router.push("/dashboard")}
          >
            Go to Dashboard
          </Button>
        )}
      </div>

      {/* Progress */}
      <OnboardingProgress currentStep={5} totalSteps={5} />
    </div>
  )
}

export default function CompletePage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center text-center space-y-8">
        <Skeleton className="w-12 h-12 rounded-full" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
      </div>
    }>
      <CompleteContent />
    </Suspense>
  )
}
