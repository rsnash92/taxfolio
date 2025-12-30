"use client"

import { Lightbulb } from "lucide-react"

interface InsightCardProps {
  message: string
}

export function InsightCard({ message }: InsightCardProps) {
  return (
    <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex items-start gap-3">
        <Lightbulb className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-amber-200">{message}</p>
      </div>
    </div>
  )
}
