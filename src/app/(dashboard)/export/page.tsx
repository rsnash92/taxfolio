"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Download, FileSpreadsheet, Calculator, ChevronDown, ChevronUp } from "lucide-react"
import { SA103Summary } from "@/components/sa103-summary"
import { PDFExportCard } from "@/components/export/pdf-export-card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

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

function getTaxYears(): string[] {
  const current = getCurrentTaxYear()
  const years: string[] = []

  // Current and previous 2 years
  for (let i = 0; i < 3; i++) {
    const startYear = parseInt(current.split("-")[0]) - i
    years.push(`${startYear}-${(startYear + 1).toString().slice(-2)}`)
  }

  return years
}

export default function ExportPage() {
  const [selectedYear, setSelectedYear] = useState(getCurrentTaxYear())
  const [downloading, setDownloading] = useState(false)
  const [sa103Open, setSa103Open] = useState(true)

  const handleExportCSV = async () => {
    setDownloading(true)
    try {
      const res = await fetch(`/api/export/csv?tax_year=${selectedYear}`)

      if (!res.ok) {
        const error = await res.json()
        toast.error(error.error || "Failed to export")
        return
      }

      // Download the file
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `taxfolio-${selectedYear}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success("Export downloaded")
    } catch {
      toast.error("Failed to export")
    } finally {
      setDownloading(false)
    }
  }

  const taxYears = getTaxYears()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Export</h1>
        <p className="text-muted-foreground">
          Download your data for accountants or HMRC submission
        </p>
      </div>

      {/* Tax Year Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Select Tax Year</CardTitle>
          <CardDescription>
            Choose the tax year you want to export
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select year" />
            </SelectTrigger>
            <SelectContent>
              {taxYears.map((year) => (
                <SelectItem key={year} value={year}>
                  {year} {year === getCurrentTaxYear() && "(Current)"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Export Options */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* CSV Export */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                <FileSpreadsheet className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <CardTitle>CSV Export</CardTitle>
                <CardDescription>
                  All confirmed transactions with categories
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Date, description, and amount</li>
              <li>• Category and HMRC box reference</li>
              <li>• Merchant name and notes</li>
              <li>• Compatible with Excel, Google Sheets</li>
            </ul>
            <Button
              className="w-full"
              onClick={handleExportCSV}
              disabled={downloading}
            >
              <Download className="mr-2 h-4 w-4" />
              {downloading ? "Downloading..." : "Download CSV"}
            </Button>
          </CardContent>
        </Card>

        {/* PDF Reports */}
        <PDFExportCard taxYear={selectedYear} />
      </div>

      {/* SA103 Summary */}
      <Collapsible open={sa103Open} onOpenChange={setSa103Open}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                    <Calculator className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <CardTitle>SA103 Summary</CardTitle>
                    <CardDescription>
                      Self-employment supplementary pages for {selectedYear}
                    </CardDescription>
                  </div>
                </div>
                {sa103Open ? (
                  <ChevronUp className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              <SA103Summary taxYear={selectedYear} />
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  )
}
