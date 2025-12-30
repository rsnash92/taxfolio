"use client"

import { useEffect, useState, useCallback } from "react"
import { Home } from "lucide-react"
import { UseOfHomeCalculator } from "@/components/home-office/use-of-home-calculator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import type { UseOfHome } from "@/types/database"

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

function getTaxYearOptions(): string[] {
  const currentYear = new Date().getFullYear()
  const years: string[] = []
  for (let i = 0; i < 4; i++) {
    const startYear = currentYear - i
    years.push(`${startYear}-${(startYear + 1).toString().slice(-2)}`)
  }
  return years
}

export default function HomeOfficePage() {
  const [taxYear, setTaxYear] = useState(getCurrentTaxYear())
  const [existingData, setExistingData] = useState<UseOfHome | null>(null)
  const [loading, setLoading] = useState(true)

  const taxYearOptions = getTaxYearOptions()

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/home-office?tax_year=${taxYear}`)
      const json = await res.json()
      setExistingData(json.data || null)
    } catch (error) {
      console.error("Failed to fetch use of home data:", error)
    } finally {
      setLoading(false)
    }
  }, [taxYear])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Home className="h-8 w-8" />
            Use of Home
          </h1>
          <p className="text-muted-foreground mt-1">
            Calculate your working from home tax deduction
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Tax Year</span>
          <Select value={taxYear} onValueChange={setTaxYear}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {taxYearOptions.map((year) => (
                <SelectItem key={year} value={year}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Calculator */}
      {loading ? (
        <div className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Skeleton className="h-[500px] rounded-xl" />
            <Skeleton className="h-[500px] rounded-xl" />
          </div>
          <Skeleton className="h-48 rounded-xl" />
        </div>
      ) : (
        <UseOfHomeCalculator existingData={existingData} taxYear={taxYear} />
      )}
    </div>
  )
}
