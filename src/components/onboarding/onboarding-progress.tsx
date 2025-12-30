"use client"

import { cn } from "@/lib/utils"

interface OnboardingProgressProps {
  currentStep: number
  totalSteps?: number
}

export function OnboardingProgress({ currentStep, totalSteps = 5 }: OnboardingProgressProps) {
  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: totalSteps }, (_, i) => {
        const step = i + 1
        const isComplete = step < currentStep
        const isCurrent = step === currentStep

        return (
          <div
            key={step}
            className={cn(
              "rounded-full transition-all duration-300",
              isCurrent
                ? "w-3 h-3 bg-[#15e49e]"
                : isComplete
                ? "w-2 h-2 bg-[#15e49e]"
                : "w-2 h-2 bg-zinc-700"
            )}
          />
        )
      })}
    </div>
  )
}
