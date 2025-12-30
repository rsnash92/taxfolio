"use client"

import { useEffect, useState, useCallback } from "react"
import Cookies from "js-cookie"
import { UseOfHomeCalculator } from "@/components/home-office/use-of-home-calculator"
import { Skeleton } from "@/components/ui/skeleton"
import type { UseOfHome } from "@/types/database"

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

export default function HomeOfficePage() {
  const [taxYear, setTaxYear] = useState(getTaxYearFromCookie)
  const [existingData, setExistingData] = useState<UseOfHome | null>(null)
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
