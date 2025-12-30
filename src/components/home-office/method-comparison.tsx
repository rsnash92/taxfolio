"use client"

import { TrendingUp, AlertCircle } from "lucide-react"
import type { HomeOfficeResult } from "@/lib/home-office"

interface MethodComparisonProps {
  result: HomeOfficeResult
  selectedMethod: "simplified" | "actual"
  onMethodChange: (method: "simplified" | "actual") => void
}

export function MethodComparison({
  result,
  selectedMethod,
}: MethodComparisonProps) {
  const formatCurrency = (amount: number) =>
    `£${amount.toLocaleString("en-GB", { minimumFractionDigits: 2 })}`

  const isRecommendedSelected = selectedMethod === result.recommendedMethod
  const selectedAmount =
    selectedMethod === "simplified" ? result.simplifiedAmount : result.actualAmount

  return (
    <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <TrendingUp className="h-5 w-5 text-[#15e49e]" />
        Comparison & Recommendation
      </h3>

      {/* Side by side */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div
          className={`p-4 rounded-lg ${
            result.recommendedMethod === "simplified"
              ? "bg-[#15e49e]/10 border border-[#15e49e]/30"
              : "bg-zinc-100 dark:bg-zinc-800"
          }`}
        >
          <p className="text-sm text-muted-foreground">Simplified</p>
          <p className="text-xl font-bold">
            {formatCurrency(result.simplifiedAmount)}
          </p>
          {result.recommendedMethod === "simplified" && (
            <span className="text-xs text-[#15e49e] font-medium">Recommended</span>
          )}
        </div>

        <div
          className={`p-4 rounded-lg ${
            result.recommendedMethod === "actual"
              ? "bg-[#15e49e]/10 border border-[#15e49e]/30"
              : "bg-zinc-100 dark:bg-zinc-800"
          }`}
        >
          <p className="text-sm text-muted-foreground">Actual Costs</p>
          <p className="text-xl font-bold">
            {formatCurrency(result.actualAmount)}
          </p>
          {result.recommendedMethod === "actual" && (
            <span className="text-xs text-[#15e49e] font-medium">Recommended</span>
          )}
        </div>
      </div>

      {/* Difference */}
      {result.difference > 0 && (
        <div className="mb-6 p-4 bg-[#15e49e]/10 border border-[#15e49e]/20 rounded-lg">
          <p className="text-[#15e49e]">
            <strong>
              {result.recommendedMethod === "actual" ? "Actual costs" : "Simplified"}
            </strong>{" "}
            saves you <strong>{formatCurrency(result.difference)}</strong> more!
          </p>
        </div>
      )}

      {/* Warning if not using recommended */}
      {!isRecommendedSelected && (
        <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-lg flex gap-3">
          <AlertCircle className="h-5 w-5 text-amber-500 dark:text-amber-400 flex-shrink-0" />
          <div className="text-sm text-amber-800 dark:text-amber-200">
            <p className="font-medium">You&apos;re not using the recommended method</p>
            <p className="text-amber-700 dark:text-amber-300/70 mt-1">
              Switching to {result.recommendedMethod} would give you{" "}
              {formatCurrency(result.difference)} more in deductions.
            </p>
          </div>
        </div>
      )}

      {/* Final Amount */}
      <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-muted-foreground">Your use of home deduction</p>
            <p className="text-xs text-muted-foreground">
              Using {selectedMethod === "simplified" ? "simplified (flat rate)" : "actual costs"}{" "}
              method
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-[#15e49e]">
              {formatCurrency(selectedAmount)}
            </p>
            <p className="text-xs text-muted-foreground">Added to SA103 Box 20</p>
          </div>
        </div>
      </div>
    </div>
  )
}
