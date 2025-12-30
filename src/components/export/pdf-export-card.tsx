"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import {
  Download,
  FileText,
  FileBarChart,
  Building2,
  Receipt,
  Car,
  Package,
  Loader2,
  CheckCircle,
} from "lucide-react"

interface PDFExportCardProps {
  taxYear: string
}

type ReportType = 'tax-summary' | 'sa103' | 'sa105' | 'transactions' | 'mileage' | 'full-pack'

const reportTypes: {
  id: ReportType
  title: string
  description: string
  icon: React.ElementType
}[] = [
  {
    id: 'tax-summary',
    title: 'Tax Summary',
    description: 'Overview of income, expenses, and estimated tax',
    icon: FileBarChart,
  },
  {
    id: 'sa103',
    title: 'SA103 Self Employment',
    description: 'Self-employment income mapped to HMRC boxes',
    icon: FileText,
  },
  {
    id: 'sa105',
    title: 'SA105 Property Income',
    description: 'Rental income with Section 24 calculations',
    icon: Building2,
  },
  {
    id: 'transactions',
    title: 'Transaction Report',
    description: 'Full list of categorised transactions by month',
    icon: Receipt,
  },
  {
    id: 'mileage',
    title: 'Mileage Log',
    description: 'All business trips with allowance calculation',
    icon: Car,
  },
  {
    id: 'full-pack',
    title: 'Full Tax Pack',
    description: 'All reports combined in one comprehensive PDF',
    icon: Package,
  },
]

export function PDFExportCard({ taxYear }: PDFExportCardProps) {
  const [selectedReport, setSelectedReport] = useState<ReportType>('tax-summary')
  const [downloading, setDownloading] = useState(false)
  const [downloadComplete, setDownloadComplete] = useState(false)

  const handleDownload = async () => {
    setDownloading(true)
    setDownloadComplete(false)

    try {
      const res = await fetch(`/api/export/pdf?tax_year=${taxYear}&type=${selectedReport}`)

      if (!res.ok) {
        const error = await res.json()
        if (error.code === 'FEATURE_GATED') {
          toast.error('PDF export requires a Pro subscription', {
            description: 'Upgrade to Pro to download professional PDF reports.',
            action: {
              label: 'Upgrade',
              onClick: () => window.location.href = '/settings/billing',
            },
          })
        } else {
          toast.error(error.error || 'Failed to generate PDF')
        }
        return
      }

      // Download the file
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url

      const reportInfo = reportTypes.find(r => r.id === selectedReport)
      const filename = `taxfolio-${selectedReport}-${taxYear}.pdf`
      a.download = filename

      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      setDownloadComplete(true)
      toast.success(`${reportInfo?.title} downloaded`, {
        description: filename,
      })

      setTimeout(() => setDownloadComplete(false), 3000)
    } catch (error) {
      console.error('PDF download error:', error)
      toast.error('Failed to generate PDF')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center">
            <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <CardTitle className="flex items-center gap-2">
              PDF Reports
              <Badge variant="secondary" className="bg-[#15e49e]/10 text-[#15e49e] border-[#15e49e]/20">
                Pro
              </Badge>
            </CardTitle>
            <CardDescription>
              Professional reports for your accountant or HMRC
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <RadioGroup
          value={selectedReport}
          onValueChange={(value) => setSelectedReport(value as ReportType)}
          className="grid gap-3"
        >
          {reportTypes.map((report) => {
            const Icon = report.icon
            const isSelected = selectedReport === report.id
            return (
              <div key={report.id}>
                <RadioGroupItem
                  value={report.id}
                  id={report.id}
                  className="peer sr-only"
                />
                <Label
                  htmlFor={report.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-[#15e49e] bg-[#15e49e]/5'
                      : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                  }`}
                >
                  <Icon className={`h-5 w-5 ${isSelected ? 'text-[#15e49e]' : 'text-muted-foreground'}`} />
                  <div className="flex-1">
                    <div className={`font-medium ${isSelected ? 'text-foreground' : 'text-foreground'}`}>
                      {report.title}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {report.description}
                    </div>
                  </div>
                  {isSelected && (
                    <div className="w-2 h-2 rounded-full bg-[#15e49e]" />
                  )}
                </Label>
              </div>
            )
          })}
        </RadioGroup>

        <Button
          className="w-full"
          onClick={handleDownload}
          disabled={downloading}
        >
          {downloading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating PDF...
            </>
          ) : downloadComplete ? (
            <>
              <CheckCircle className="mr-2 h-4 w-4" />
              Downloaded!
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Download {reportTypes.find(r => r.id === selectedReport)?.title}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
