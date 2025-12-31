"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { useTheme } from "next-themes"
import Cookies from "js-cookie"
import { Bell, Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

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

function getTaxYearOptions(): string[] {
  const currentYear = new Date().getFullYear()
  const years: string[] = []
  for (let i = 0; i < 4; i++) {
    const startYear = currentYear - i
    years.push(`${startYear}-${(startYear + 1).toString().slice(-2)}`)
  }
  return years
}

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/transactions": "Transactions",
  "/properties": "Properties",
  "/mileage": "Mileage",
  "/home-office": "Home Office",
  "/accounts": "Accounts",
  "/mtd": "MTD Quarters",
  "/export": "Export",
  "/ask": "Ask TaxFolio",
  "/settings": "Settings",
  "/settings/billing": "Billing",
  "/settings/security": "Security",
  "/settings/hmrc": "HMRC",
  "/connect-bank": "Connect Bank",
  "/partners": "Partners",
  "/partners/apply": "Apply",
  "/partners/settings": "Partner Settings",
}

export function PageHeader() {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const taxYearOptions = getTaxYearOptions()

  const [taxYear, setTaxYear] = useState<string>(() => {
    // Initialize from cookie or default
    if (typeof window !== "undefined") {
      return Cookies.get(TAX_YEAR_COOKIE) || getCurrentTaxYear()
    }
    return getCurrentTaxYear()
  })

  // Sync with cookie on mount
  useEffect(() => {
    const savedYear = Cookies.get(TAX_YEAR_COOKIE)
    if (savedYear && taxYearOptions.includes(savedYear)) {
      setTaxYear(savedYear)
    }
  }, [taxYearOptions])

  const handleTaxYearChange = (value: string) => {
    setTaxYear(value)
    // Save to cookie (expires in 1 year)
    Cookies.set(TAX_YEAR_COOKIE, value, { expires: 365 })
    // Dispatch custom event so other components can react
    window.dispatchEvent(new CustomEvent("taxYearChanged", { detail: value }))
  }

  // Get page title from pathname
  const title = pageTitles[pathname] || "Dashboard"

  return (
    <header className="flex items-center justify-between mb-6">
      <h1 className="text-2xl font-bold tracking-tight">{title}</h1>

      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="icon"
          className="bg-card border-border"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          {theme === "dark" ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
          <span className="sr-only">Toggle theme</span>
        </Button>

        <Button variant="outline" size="icon" className="bg-card border-border">
          <Bell className="h-4 w-4" />
          <span className="sr-only">Notifications</span>
        </Button>

        <Select value={taxYear} onValueChange={handleTaxYearChange}>
          <SelectTrigger className="w-[140px] bg-card border-border">
            <SelectValue placeholder="Tax Year" />
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
    </header>
  )
}
