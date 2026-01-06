"use client"

import { cn } from "@/lib/utils"
import { Check, Loader2 } from "lucide-react"

type StepStatus = 'pending' | 'in_progress' | 'complete'

interface ProcessingStepProps {
  label: string
  status: StepStatus
}

export function ProcessingStep({ label, status }: ProcessingStepProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-5 h-5 flex items-center justify-center">
        {status === 'complete' && (
          <Check className="w-4 h-4 text-[#00e3ec] animate-in fade-in zoom-in duration-300" />
        )}
        {status === 'in_progress' && (
          <Loader2 className="w-4 h-4 text-primary animate-spin" />
        )}
        {status === 'pending' && (
          <div className="w-2 h-2 rounded-full bg-zinc-600" />
        )}
      </div>
      <span
        className={cn(
          "text-sm transition-colors",
          status === 'complete' && "text-[#00e3ec]",
          status === 'in_progress' && "text-foreground",
          status === 'pending' && "text-muted-foreground"
        )}
      >
        {label}
      </span>
    </div>
  )
}
