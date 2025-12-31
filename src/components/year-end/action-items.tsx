"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { CheckSquare, Square, ChevronRight, Calendar } from "lucide-react"
import type { ActionItem } from "@/lib/year-end/types"

interface ActionItemsProps {
  items: ActionItem[]
  taxYear: string
}

const priorityColors = {
  high: 'border-red-500/30 bg-red-500/5',
  medium: 'border-amber-500/30 bg-amber-500/5',
  low: 'border-blue-500/30 bg-blue-500/5',
}

const priorityLabels = {
  high: 'HIGH',
  medium: 'MED',
  low: 'LOW',
}

export function ActionItems({ items }: ActionItemsProps) {
  const [completedItems, setCompletedItems] = useState<Set<number>>(new Set())

  const toggleComplete = (index: number) => {
    setCompletedItems(prev => {
      const next = new Set(prev)
      if (next.has(index)) {
        next.delete(index)
      } else {
        next.add(index)
      }
      return next
    })
  }

  const completedCount = completedItems.size
  const totalCount = items.length
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

  return (
    <Card className="mb-8">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <CheckSquare className="h-5 w-5 text-green-600" />
            Before You File
          </CardTitle>
          <span className="text-sm text-muted-foreground">
            {completedCount}/{totalCount} completed
          </span>
        </div>
      </CardHeader>
      <CardContent>
        {/* Progress bar */}
        <Progress value={progressPercent} className="h-2 mb-6" />

        <div className="space-y-3">
          {items.map((item, index) => {
            const isCompleted = completedItems.has(index)

            return (
              <div
                key={index}
                className={`p-4 border rounded-xl transition-all ${isCompleted
                    ? 'bg-muted/50 border-muted opacity-60'
                    : priorityColors[item.priority]
                  }`}
              >
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => toggleComplete(index)}
                    className="mt-0.5 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {isCompleted ? (
                      <CheckSquare className="h-5 w-5 text-green-600" />
                    ) : (
                      <Square className="h-5 w-5" />
                    )}
                  </button>

                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${isCompleted
                          ? 'bg-muted text-muted-foreground'
                          : item.priority === 'high'
                            ? 'bg-red-100 dark:bg-red-900/50 text-red-600'
                            : item.priority === 'medium'
                              ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-600'
                              : 'bg-blue-100 dark:bg-blue-900/50 text-blue-600'
                        }`}>
                        {priorityLabels[item.priority]}
                      </span>
                      <span className={`font-medium ${isCompleted ? 'line-through text-muted-foreground' : ''}`}>
                        {item.title}
                      </span>
                      {item.deadline && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {item.deadline}
                        </span>
                      )}
                    </div>
                    <p className={`text-sm mt-1 ${isCompleted ? 'text-muted-foreground' : 'text-muted-foreground'}`}>
                      {item.description}
                    </p>
                  </div>

                  {item.href && !isCompleted && (
                    <Link
                      href={item.href}
                      className="p-2 hover:bg-muted rounded-lg transition-colors"
                    >
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </Link>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
