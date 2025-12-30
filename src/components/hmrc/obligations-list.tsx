"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { CalendarDays, CheckCircle2, Clock, AlertTriangle } from "lucide-react"
import { Obligation } from "@/lib/hmrc/types"

interface ObligationsListProps {
  businessId?: string
  taxYear?: string
}

export function ObligationsList({ businessId, taxYear }: ObligationsListProps) {
  const [obligations, setObligations] = useState<Obligation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!businessId) {
      setLoading(false)
      return
    }

    fetchObligations()
  }, [businessId, taxYear])

  const fetchObligations = async () => {
    try {
      const params = new URLSearchParams()
      if (businessId) params.set('businessId', businessId)
      if (taxYear) params.set('taxYear', taxYear)

      const res = await fetch(`/api/hmrc/obligations?${params}`)
      if (res.ok) {
        const data = await res.json()
        setObligations(data.obligations || [])
      } else {
        const err = await res.json()
        setError(err.error || 'Failed to load obligations')
      }
    } catch (err) {
      console.error('Failed to fetch obligations:', err)
      setError('Failed to load obligations')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  const getDaysUntil = (dueDate: string) => {
    const due = new Date(dueDate)
    const now = new Date()
    const diffTime = due.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const getStatusBadge = (obligation: Obligation) => {
    if (obligation.status === 'Fulfilled') {
      return (
        <Badge variant="outline" className="text-green-600 border-green-600">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Submitted
        </Badge>
      )
    }

    const daysUntil = getDaysUntil(obligation.due)

    if (daysUntil < 0) {
      return (
        <Badge variant="destructive">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Overdue
        </Badge>
      )
    }

    if (daysUntil <= 14) {
      return (
        <Badge variant="default" className="bg-amber-500">
          <Clock className="h-3 w-3 mr-1" />
          Due soon
        </Badge>
      )
    }

    return (
      <Badge variant="secondary">
        <Clock className="h-3 w-3 mr-1" />
        Open
      </Badge>
    )
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Submission Deadlines</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Submission Deadlines</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{error}</p>
        </CardContent>
      </Card>
    )
  }

  if (!businessId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Submission Deadlines</CardTitle>
          <CardDescription>Connect HMRC to view your obligations</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
            <CalendarDays className="h-4 w-4" />
          </div>
          <div>
            <CardTitle className="text-base">Submission Deadlines</CardTitle>
            <CardDescription>Your HMRC reporting obligations</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {obligations.length === 0 ? (
          <p className="text-sm text-muted-foreground">No obligations found</p>
        ) : (
          <div className="space-y-3">
            {obligations.map((obligation) => (
              <div
                key={obligation.periodKey}
                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
              >
                <div>
                  <p className="text-sm font-medium">
                    {formatDate(obligation.start)} - {formatDate(obligation.end)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Due: {formatDate(obligation.due)}
                  </p>
                </div>
                {getStatusBadge(obligation)}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
