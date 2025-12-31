"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Lightbulb, ChevronRight, Sparkles } from "lucide-react"

interface Suggestion {
  key: string
  title: string
  potentialSaving: number
  taxSaving: number
  priority: string
  isDismissed: boolean
}

interface SuggestionsData {
  suggestions: Suggestion[]
  totalPotentialSaving: number
  totalTaxSaving: number
}

interface SuggestionsWidgetProps {
  taxYear: string
}

export function SuggestionsWidget({ taxYear }: SuggestionsWidgetProps) {
  const [data, setData] = useState<SuggestionsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchSuggestions() {
      try {
        const res = await fetch(`/api/suggestions?tax_year=${taxYear}&ai=false`)
        if (res.ok) {
          const json = await res.json()
          setData(json)
        }
      } catch (error) {
        console.error("Failed to fetch suggestions:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchSuggestions()
  }, [taxYear])

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    )
  }

  const activeSuggestions = data?.suggestions.filter(s => !s.isDismissed) || []

  if (activeSuggestions.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <CardTitle className="text-base">Looking good!</CardTitle>
              <CardDescription>No tax saving suggestions right now</CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>
    )
  }

  const topSuggestions = activeSuggestions.slice(0, 3)

  return (
    <Card className="border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-orange-500/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/50 rounded-lg flex items-center justify-center">
              <Lightbulb className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <CardTitle className="text-base">Tax Saving Suggestions</CardTitle>
              <CardDescription>
                {activeSuggestions.length} opportunity{activeSuggestions.length !== 1 ? "s" : ""} found
              </CardDescription>
            </div>
          </div>

          {data && data.totalTaxSaving > 0 && (
            <div className="text-right">
              <p className="text-xl font-bold text-green-600">
                £{data.totalTaxSaving.toFixed(0)}
              </p>
              <p className="text-xs text-muted-foreground">potential tax saved</p>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Top Suggestions */}
        {topSuggestions.map((suggestion) => (
          <div
            key={suggestion.key}
            className="flex items-center justify-between p-3 bg-background/50 rounded-lg border"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {suggestion.title}
              </p>
              {suggestion.taxSaving > 0 && (
                <p className="text-xs text-green-600">
                  Save ~£{suggestion.taxSaving.toFixed(0)} in tax
                </p>
              )}
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          </div>
        ))}

        {/* View All Link */}
        <Link
          href="/suggestions"
          className="flex items-center justify-center gap-2 w-full py-2 text-sm font-medium text-amber-600 hover:text-amber-500 transition-colors"
        >
          View all suggestions
          <ChevronRight className="h-4 w-4" />
        </Link>
      </CardContent>
    </Card>
  )
}
