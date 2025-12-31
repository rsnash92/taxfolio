"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Lightbulb, AlertTriangle, TrendingUp, Info } from "lucide-react"
import type { AIInsight } from "@/lib/year-end/types"

interface InsightsSectionProps {
  insights: AIInsight[]
}

const insightConfig = {
  positive: { icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/50', border: 'border-green-500/20' },
  warning: { icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/50', border: 'border-amber-500/20' },
  neutral: { icon: Info, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/50', border: 'border-blue-500/20' },
  tip: { icon: Lightbulb, color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-900/50', border: 'border-purple-500/20' },
}

export function InsightsSection({ insights }: InsightsSectionProps) {
  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Lightbulb className="h-5 w-5 text-purple-600" />
        AI Insights
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {insights.map((insight, index) => {
          const config = insightConfig[insight.type] || insightConfig.neutral
          const Icon = config.icon

          return (
            <Card key={index} className={config.border}>
              <CardContent className="pt-5">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${config.bg}`}>
                    <Icon className={`h-5 w-5 ${config.color}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">{insight.title}</h3>
                      {insight.metric && (
                        <span className={`text-lg font-bold ${config.color}`}>
                          {insight.metric}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{insight.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
