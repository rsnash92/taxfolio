import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ExternalLink, FileText, Calculator, PoundSterling, Calendar } from "lucide-react"

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

function getTaxYearDates(taxYear: string): { start: string; end: string } {
  const [startYear] = taxYear.split('-').map(Number)
  return {
    start: `6 April ${startYear}`,
    end: `5 April ${startYear + 1}`,
  }
}

export default async function PersonalTaxPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const taxYear = getCurrentTaxYear()
  const dates = getTaxYearDates(taxYear)

  // Get user name
  const { data: userData } = await supabase
    .from("users")
    .select("full_name")
    .eq("id", user?.id)
    .single()

  const assessmentUrl = process.env.NEXT_PUBLIC_ASSESSMENT_URL || "https://assessment.taxfolio.io"

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Personal Tax</h1>
        <p className="text-muted-foreground mt-1">
          Tax year {taxYear} ({dates.start} - {dates.end})
        </p>
      </div>

      {/* Main CTA */}
      <Card className="border-[#00e3ec]/50 bg-[#00e3ec]/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-[#00e3ec]" />
            Prepare Your Tax Return
          </CardTitle>
          <CardDescription>
            Use our guided wizard to calculate your tax liability and prepare your self-assessment return
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            The assessment wizard will help you:
          </p>
          <ul className="text-sm text-muted-foreground space-y-2">
            <li className="flex items-center gap-2">
              <Calculator className="h-4 w-4 text-[#00e3ec]" />
              Calculate your self-employment income and expenses
            </li>
            <li className="flex items-center gap-2">
              <PoundSterling className="h-4 w-4 text-[#00e3ec]" />
              Estimate your Income Tax and National Insurance
            </li>
            <li className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-[#00e3ec]" />
              Generate HMRC-ready figures for your tax return
            </li>
          </ul>
          <a href={assessmentUrl} target="_blank" rel="noopener noreferrer">
            <Button className="bg-[#00e3ec] hover:bg-[#00c4d4] text-black mt-4">
              Start Tax Return Wizard
              <ExternalLink className="ml-2 h-4 w-4" />
            </Button>
          </a>
        </CardContent>
      </Card>

      {/* Tax Year Info */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Key Dates
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-muted-foreground">Tax year starts</span>
              <span className="font-medium">{dates.start}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-muted-foreground">Tax year ends</span>
              <span className="font-medium">{dates.end}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-muted-foreground">Online filing deadline</span>
              <span className="font-medium">31 January {parseInt(taxYear.split('-')[0]) + 2}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-muted-foreground">Payment deadline</span>
              <span className="font-medium">31 January {parseInt(taxYear.split('-')[0]) + 2}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <PoundSterling className="h-5 w-5" />
              Tax Rates {taxYear}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-muted-foreground">Personal Allowance</span>
              <span className="font-medium">£12,570</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-muted-foreground">Basic Rate (20%)</span>
              <span className="font-medium">£12,571 - £50,270</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-muted-foreground">Higher Rate (40%)</span>
              <span className="font-medium">£50,271 - £125,140</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-muted-foreground">Additional Rate (45%)</span>
              <span className="font-medium">Over £125,140</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Help Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Need Help?</CardTitle>
          <CardDescription>
            Resources to help you understand your tax obligations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <a
              href="https://www.gov.uk/self-assessment-tax-returns"
              target="_blank"
              rel="noopener noreferrer"
              className="p-4 border rounded-lg hover:border-[#00e3ec]/50 transition-colors"
            >
              <h3 className="font-medium mb-1">HMRC Self Assessment Guide</h3>
              <p className="text-sm text-muted-foreground">
                Official guidance on filing your tax return
              </p>
            </a>
            <a
              href="https://www.gov.uk/self-employed-national-insurance-rates"
              target="_blank"
              rel="noopener noreferrer"
              className="p-4 border rounded-lg hover:border-[#00e3ec]/50 transition-colors"
            >
              <h3 className="font-medium mb-1">National Insurance Rates</h3>
              <p className="text-sm text-muted-foreground">
                Class 2 and Class 4 NI for self-employed
              </p>
            </a>
            <a
              href="https://www.gov.uk/expenses-if-youre-self-employed"
              target="_blank"
              rel="noopener noreferrer"
              className="p-4 border rounded-lg hover:border-[#00e3ec]/50 transition-colors"
            >
              <h3 className="font-medium mb-1">Allowable Expenses</h3>
              <p className="text-sm text-muted-foreground">
                What you can claim as business expenses
              </p>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
