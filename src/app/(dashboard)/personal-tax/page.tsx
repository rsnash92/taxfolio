"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import Cookies from "js-cookie"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { FileText, Upload, ArrowRight } from "lucide-react"

const TAX_YEAR_COOKIE = "taxfolio_tax_year"

function getCurrentTaxYear(): string {
  // Return the most recent filing year (previous tax year)
  // Since we don't show the current tax year (2025-26), default to 2024-25
  const year = new Date().getFullYear() - 1
  return `${year}-${(year + 1).toString().slice(-2)}`
}

function getTaxYearOptions(): string[] {
  const currentYear = new Date().getFullYear()
  const years: string[] = []
  // Start from previous year (i=1) to exclude current tax year (2025-26)
  // Most users are filing for 2024-25 and earlier
  for (let i = 1; i < 4; i++) {
    const startYear = currentYear - i
    years.push(`${startYear}-${(startYear + 1).toString().slice(-2)}`)
  }
  return years
}

// Progress steps mapping
const progressSteps = [
  { id: 1, label: "Gathering your information" },
  { id: 2, label: "Reviewing your income sources" },
  { id: 3, label: "Populating your questionnaire" },
  { id: 4, label: "Review and submit" },
]

export default function PersonalTaxPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const taxYearOptions = getTaxYearOptions()

  const [taxYear, setTaxYear] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const urlYear = searchParams.get("tax_year")
      if (urlYear && taxYearOptions.includes(urlYear)) {
        return urlYear
      }
      const cookieYear = Cookies.get(TAX_YEAR_COOKIE)
      if (cookieYear && taxYearOptions.includes(cookieYear)) {
        return cookieYear
      }
    }
    return getCurrentTaxYear()
  })

  // For now, we'll show step 3 as an example - this could be fetched from the assessment app
  const currentStep = 3
  const stepLabel = progressSteps.find(s => s.id === currentStep)?.label || "In progress"

  const assessmentUrl = process.env.NEXT_PUBLIC_ASSESSMENT_URL || "https://assessment.taxfolio.io"

  // Sync with URL param or cookie on mount/change
  useEffect(() => {
    const urlYear = searchParams.get("tax_year")
    if (urlYear && taxYearOptions.includes(urlYear)) {
      setTaxYear(urlYear)
      Cookies.set(TAX_YEAR_COOKIE, urlYear, { expires: 365 })
    } else {
      const savedYear = Cookies.get(TAX_YEAR_COOKIE)
      if (savedYear && taxYearOptions.includes(savedYear)) {
        setTaxYear(savedYear)
      } else {
        // Cookie has invalid value, reset to default
        const defaultYear = getCurrentTaxYear()
        setTaxYear(defaultYear)
        Cookies.set(TAX_YEAR_COOKIE, defaultYear, { expires: 365 })
      }
    }
  }, [searchParams, taxYearOptions])

  const handleTaxYearChange = (value: string) => {
    setTaxYear(value)
    Cookies.set(TAX_YEAR_COOKIE, value, { expires: 365 })
    const params = new URLSearchParams(searchParams.toString())
    params.set("tax_year", value)
    router.push(`${pathname}?${params.toString()}`)
    window.dispatchEvent(new CustomEvent("taxYearChanged", { detail: value }))
  }

  return (
    <div className="space-y-6">
      {/* Progress Card */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="flex flex-col lg:flex-row">
            {/* Left side - Progress info */}
            <div className="flex-1 p-6 lg:p-8">
              {/* Tax year selector inline */}
              <div className="flex items-center gap-1 mb-4 flex-wrap">
                <span className="text-muted-foreground">Your</span>
                <Select value={taxYear} onValueChange={handleTaxYearChange}>
                  <SelectTrigger className="w-[110px] h-8 text-[#00c4d4] font-semibold border-0 bg-transparent px-1 focus:ring-0 [&>svg]:ml-0.5 [&>svg]:text-muted-foreground">
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
                <span className="text-muted-foreground">tax return progress</span>
              </div>

              {/* Step indicator */}
              <div className="flex items-center gap-3 mb-4 flex-wrap">
                <h2 className="text-xl font-semibold">{stepLabel}</h2>
                <span className="px-2.5 py-1 text-xs font-medium bg-[#00e3ec]/10 text-[#00c4d4] rounded-full border border-[#00e3ec]/20">
                  Step {currentStep} of {progressSteps.length}
                </span>
              </div>

              {/* Description */}
              <p className="text-muted-foreground text-sm mb-2">
                We&apos;re ready to dive a little deeper now so we can figure out your tax position and file your tax return. This part should take no more than 30 minutes if you&apos;ve got your info ready to go!
              </p>
              <p className="text-muted-foreground text-sm mb-6">
                Stuck on anything? Hit the chat button in the bottom right. Our friendly team is always here to help... no such thing as a silly tax question!
              </p>

              {/* CTA Button */}
              <a href={`${assessmentUrl}?tax_year=${taxYear}`} target="_blank" rel="noopener noreferrer">
                <Button className="bg-[#00e3ec] hover:bg-[#00c4d4] text-black font-medium">
                  Continue tax return
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </a>
            </div>

            {/* Right side - Illustration */}
            <div className="hidden lg:flex items-center justify-center p-8 bg-muted/30 min-w-[280px]">
              <div className="relative w-64 h-48">
                {/* Illustration placeholder */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative">
                    {/* Person with clipboard illustration placeholder */}
                    <div className="w-36 h-44 bg-gradient-to-b from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-900 rounded-2xl flex items-center justify-center shadow-sm">
                      <FileText className="h-14 w-14 text-blue-400" />
                    </div>
                    {/* Decorative dots */}
                    <div className="absolute -top-2 -right-2 w-2 h-2 bg-[#00e3ec] rounded-full" />
                    <div className="absolute -bottom-1 -left-3 w-3 h-3 bg-pink-300 rounded-full" />
                    <div className="absolute top-6 -left-5 w-1.5 h-1.5 bg-gray-300 rounded-full" />
                    <div className="absolute -top-4 right-8 w-1.5 h-1.5 bg-gray-300 rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Your Tax Documents */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="text-lg font-semibold">Your Tax Documents</CardTitle>
            <CardDescription className="mt-1">
              Store P60s, receipts and other documents here for your own records. These are not submitted to HMRC.
            </CardDescription>
          </div>
          <Button variant="outline" className="gap-2 shrink-0">
            <Upload className="h-4 w-4" />
            Upload Files
          </Button>
        </CardHeader>
        <CardContent className="pt-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Filename</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Year</TableHead>
                <TableHead>Date uploaded</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  No records.
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
