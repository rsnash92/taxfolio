"use client"

import { useEffect, useState, useCallback } from "react"
import Cookies from "js-cookie"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Lightbulb, Sparkles, TrendingUp } from "lucide-react"
import { SuggestionCard } from "./suggestion-card"

interface Suggestion {
  key: string
  title: string
  description: string
  category: string
  priority: string
  potentialSaving: number
  taxSaving: number
  action: {
    label: string
    href: string
  }
  learnMoreUrl?: string
  isDismissed?: boolean
}

interface SuggestionsData {
  suggestions: Suggestion[]
  totalPotentialSaving: number
  totalTaxSaving: number
  analyzedAt: string
}

const TAX_YEAR_COOKIE = "taxfolio_tax_year"

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

function getTaxYearFromCookie(): string {
  if (typeof window !== "undefined") {
    return Cookies.get(TAX_YEAR_COOKIE) || getCurrentTaxYear()
  }
  return getCurrentTaxYear()
}

export function SuggestionsList() {
  const [taxYear, setTaxYear] = useState(getTaxYearFromCookie)
  const [data, setData] = useState<SuggestionsData | null>(null)
  const [loading, setLoading] = useState(true)

  // Sync tax year from cookie when it changes
  useEffect(() => {
    const checkCookie = () => {
      const cookieYear = Cookies.get(TAX_YEAR_COOKIE)
      if (cookieYear && cookieYear !== taxYear) {
        setTaxYear(cookieYear)
      }
    }
    window.addEventListener("focus", checkCookie)
    return () => window.removeEventListener("focus", checkCookie)
  }, [taxYear])

  const fetchSuggestions = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/suggestions?tax_year=${taxYear}`)
      if (res.ok) {
        const json = await res.json()
        setData(json)
      }
    } catch (error) {
      console.error("Failed to fetch suggestions:", error)
    } finally {
      setLoading(false)
    }
  }, [taxYear])

  useEffect(() => {
    fetchSuggestions()
  }, [fetchSuggestions])

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full rounded-xl" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 w-full rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  const activeSuggestions = data?.suggestions.filter(s => !s.isDismissed) || []
  const dismissedSuggestions = data?.suggestions.filter(s => s.isDismissed) || []

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      {data && data.totalTaxSaving > 0 && (
        <Card className="border-green-500/30 bg-gradient-to-br from-green-500/10 to-emerald-500/10">
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 dark:bg-green-900/50 rounded-xl">
                  <TrendingUp className="h-8 w-8 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Potential Tax Savings</p>
                  <p className="text-3xl font-bold">
                    £{data.totalTaxSaving.toFixed(0)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">From</p>
                <p className="text-lg font-semibold">
                  £{data.totalPotentialSaving.toFixed(0)}
                </p>
                <p className="text-xs text-muted-foreground">in deductions</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Suggestions */}
      {activeSuggestions.length > 0 ? (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-amber-500" />
            {activeSuggestions.length} Suggestion{activeSuggestions.length !== 1 ? "s" : ""}
          </h2>

          {activeSuggestions.map((suggestion) => (
            <SuggestionCard
              key={suggestion.key}
              suggestion={suggestion}
              taxYear={taxYear}
              onDismiss={fetchSuggestions}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/50 rounded-full mb-4">
              <Sparkles className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="mb-2">All Caught Up!</CardTitle>
            <CardDescription>
              No tax saving suggestions right now. Great job claiming your deductions!
            </CardDescription>
          </CardContent>
        </Card>
      )}

      {/* Dismissed Suggestions */}
      {dismissedSuggestions.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">
            Dismissed ({dismissedSuggestions.length})
          </h2>

          {dismissedSuggestions.map((suggestion) => (
            <SuggestionCard
              key={suggestion.key}
              suggestion={suggestion}
              taxYear={taxYear}
              onDismiss={fetchSuggestions}
            />
          ))}
        </div>
      )}
    </div>
  )
}
