"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Lightbulb,
  AlertTriangle,
  TrendingUp,
  X,
  ExternalLink,
  ChevronRight,
  Undo,
} from "lucide-react"

interface SuggestionCardProps {
  suggestion: {
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
  taxYear: string
  onDismiss?: () => void
}

const categoryConfig = {
  missing_deduction: {
    icon: AlertTriangle,
    color: "text-amber-600",
    bg: "bg-amber-100 dark:bg-amber-900/50",
    label: "Missing Deduction",
    variant: "outline" as const,
  },
  optimization: {
    icon: TrendingUp,
    color: "text-blue-600",
    bg: "bg-blue-100 dark:bg-blue-900/50",
    label: "Optimization",
    variant: "default" as const,
  },
  warning: {
    icon: AlertTriangle,
    color: "text-red-600",
    bg: "bg-red-100 dark:bg-red-900/50",
    label: "Warning",
    variant: "destructive" as const,
  },
  tip: {
    icon: Lightbulb,
    color: "text-purple-600",
    bg: "bg-purple-100 dark:bg-purple-900/50",
    label: "Tip",
    variant: "secondary" as const,
  },
}

const priorityBorders = {
  high: "border-amber-500/30",
  medium: "border-border",
  low: "border-border/50",
}

export function SuggestionCard({ suggestion, taxYear, onDismiss }: SuggestionCardProps) {
  const router = useRouter()
  const [dismissing, setDismissing] = useState(false)

  const config = categoryConfig[suggestion.category as keyof typeof categoryConfig] || categoryConfig.tip
  const Icon = config.icon

  const handleDismiss = async () => {
    setDismissing(true)
    try {
      await fetch("/api/suggestions/dismiss", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          suggestionKey: suggestion.key,
          taxYear,
          restore: suggestion.isDismissed,
        }),
      })
      onDismiss?.()
      router.refresh()
    } catch (error) {
      console.error("Failed to dismiss:", error)
    } finally {
      setDismissing(false)
    }
  }

  if (suggestion.isDismissed) {
    return (
      <Card className="opacity-60">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground line-through">{suggestion.title}</span>
              <Badge variant="outline" className="text-xs">Dismissed</Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              disabled={dismissing}
              className="text-xs"
            >
              <Undo className="h-3 w-3 mr-1" />
              Restore
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={priorityBorders[suggestion.priority as keyof typeof priorityBorders]}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${config.bg}`}>
              <Icon className={`h-5 w-5 ${config.color}`} />
            </div>
            <div>
              <CardTitle className="text-base">{suggestion.title}</CardTitle>
              <Badge variant={config.variant} className="mt-1 text-xs">
                {config.label}
              </Badge>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleDismiss}
            disabled={dismissing}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            title="Dismiss suggestion"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Description */}
        <CardDescription className="text-sm leading-relaxed">
          {suggestion.description}
        </CardDescription>

        {/* Savings */}
        {(suggestion.potentialSaving > 0 || suggestion.taxSaving > 0) && (
          <div className="flex items-center gap-6 p-3 bg-muted/50 rounded-lg">
            {suggestion.potentialSaving > 0 && (
              <div>
                <p className="text-xs text-muted-foreground">Potential Deduction</p>
                <p className="text-lg font-semibold">
                  £{suggestion.potentialSaving.toFixed(0)}
                </p>
              </div>
            )}
            {suggestion.taxSaving > 0 && (
              <div>
                <p className="text-xs text-muted-foreground">Tax Saved</p>
                <p className="text-lg font-semibold text-green-600">
                  £{suggestion.taxSaving.toFixed(0)}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Link href={suggestion.action.href} className="flex-1">
            <Button className="w-full bg-[#15e49e] hover:bg-[#12c98a] text-black">
              {suggestion.action.label}
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>

          {suggestion.learnMoreUrl && (
            <a
              href={suggestion.learnMoreUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
              title="Learn more"
            >
              <ExternalLink className="h-5 w-5" />
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
