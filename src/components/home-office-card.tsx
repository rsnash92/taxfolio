"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Laptop, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface HomeOfficeData {
  calculation_method: 'simplified' | 'actual'
  hours_per_week?: number
  weeks_per_year?: number
  simplified_amount?: number
  actual_amount?: number
  final_amount: number
  total_rooms?: number
  business_rooms?: number
}

interface HomeOfficeCardProps {
  taxYear: string
}

export function HomeOfficeCard({ taxYear }: HomeOfficeCardProps) {
  const [data, setData] = useState<HomeOfficeData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/home-office?tax_year=${taxYear}`)
        const result = await res.json()
        setData(result.data)
      } catch (error) {
        console.error("Failed to fetch home office data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [taxYear])

  const formatCurrency = (amount: number) =>
    `£${amount.toLocaleString("en-GB", { minimumFractionDigits: 2 })}`

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Laptop className="h-5 w-5" />
            Home Office
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </CardContent>
      </Card>
    )
  }

  if (!data || !data.final_amount) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Laptop className="h-5 w-5" />
            Home Office
          </CardTitle>
          <CardDescription>
            Use of home deduction (SA103 Box 20)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Claim expenses for working from home. Choose simplified or actual cost method.
          </p>
          <Button asChild variant="outline" size="sm">
            <Link href="/home-office">Calculate Deduction</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  const isSimplified = data.calculation_method === 'simplified'
  const hoursPerMonth = data.hours_per_week ? Math.round(data.hours_per_week * (data.weeks_per_year || 48) / 12) : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Laptop className="h-5 w-5" />
          Home Office
        </CardTitle>
        <CardDescription>
          Use of home deduction for {taxYear}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Method</span>
            <span className="font-medium">
              {isSimplified ? 'Simplified' : 'Actual Costs'}
            </span>
          </div>

          {isSimplified && data.hours_per_week && (
            <div className="flex justify-between text-sm">
              <span>Hours per week</span>
              <span className="font-medium">{data.hours_per_week}h</span>
            </div>
          )}

          {!isSimplified && data.total_rooms && (
            <div className="flex justify-between text-sm">
              <span>Business use</span>
              <span className="font-medium">
                {data.business_rooms} of {data.total_rooms} rooms
              </span>
            </div>
          )}

          <div className="flex justify-between text-sm font-medium pt-2 border-t">
            <span>Deduction (Box 20)</span>
            <span className="text-[#15e49e]">{formatCurrency(data.final_amount)}</span>
          </div>
        </div>

        {isSimplified && (
          <div className="p-3 bg-primary/10 rounded-lg flex items-start gap-2">
            <Info className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
            <p className="text-xs text-muted-foreground">
              HMRC simplified rate: {hoursPerMonth >= 101 ? '£26' : hoursPerMonth >= 51 ? '£18' : '£10'}/month
              based on {data.hours_per_week}h/week ({hoursPerMonth}h/month average).
            </p>
          </div>
        )}

        {!isSimplified && data.actual_amount && data.simplified_amount && (
          <div className="p-3 bg-primary/10 rounded-lg flex items-start gap-2">
            <Info className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
            <p className="text-xs text-muted-foreground">
              Actual costs ({formatCurrency(data.actual_amount)}) are more beneficial
              than simplified ({formatCurrency(data.simplified_amount)}).
            </p>
          </div>
        )}

        <div className="flex justify-between items-center pt-2">
          <p className="text-xs text-muted-foreground">
            Included in expenses
          </p>
          <Button asChild variant="link" size="sm" className="h-auto p-0">
            <Link href="/home-office">Edit →</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
