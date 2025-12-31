'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CheckSquare, Square, ChevronRight, Calendar } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface ActionItem {
  id: string
  title: string
  description?: string
  href?: string
  deadline?: string
}

interface ActionItemsWidgetProps {
  items: ActionItem[]
}

export function ActionItemsWidget({ items }: ActionItemsWidgetProps) {
  const [completed, setCompleted] = useState<Set<string>>(new Set())

  const toggleItem = (id: string) => {
    setCompleted((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const completedCount = completed.size
  const totalCount = items.length
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

  if (items.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <CheckSquare className="h-5 w-5 text-[#15e49e]" />
            Before You File
          </CardTitle>
          <span className="text-xs text-muted-foreground">
            {completedCount}/{totalCount}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        {/* Progress bar */}
        <div className="h-1.5 bg-muted rounded-full mb-4 overflow-hidden">
          <div
            className="h-full bg-[#15e49e] transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Items */}
        <div className="space-y-2">
          {items.map((item) => {
            const isCompleted = completed.has(item.id)

            return (
              <div
                key={item.id}
                className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                  isCompleted ? 'opacity-50' : 'hover:bg-muted/50'
                }`}
              >
                <button onClick={() => toggleItem(item.id)}>
                  {isCompleted ? (
                    <CheckSquare className="h-5 w-5 text-[#15e49e]" />
                  ) : (
                    <Square className="h-5 w-5 text-muted-foreground" />
                  )}
                </button>

                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm ${
                      isCompleted ? 'text-muted-foreground line-through' : ''
                    }`}
                  >
                    {item.title}
                  </p>
                  {item.deadline && !isCompleted && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {item.deadline}
                    </p>
                  )}
                </div>

                {item.href && !isCompleted && (
                  <Link href={item.href}>
                    <ChevronRight className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                  </Link>
                )}
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
