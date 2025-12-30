"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useTheme } from "next-themes"
import { Bell, Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

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
  "/settings": "Settings",
  "/connect-bank": "Connect Bank",
  "/partners": "Partners",
}

export function PageHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { theme, setTheme } = useTheme()

  const currentTaxYear = searchParams.get("tax_year") || getCurrentTaxYear()
  const taxYearOptions = getTaxYearOptions()

  const handleTaxYearChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("tax_year", value)
    router.push(`${pathname}?${params.toString()}`)
  }

  // Get page title from pathname
  const title = pageTitles[pathname] || "Dashboard"

  return (
    <header className="flex items-center justify-between mb-6">
      <h1 className="text-2xl font-bold tracking-tight">{title}</h1>

      <div className="flex items-center gap-3">
        <Select value={currentTaxYear} onValueChange={handleTaxYearChange}>
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
      </div>
    </header>
  )
}
