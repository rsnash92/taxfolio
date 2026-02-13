import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CalendarDays, CheckCircle2, Clock, FileText, Building2, Landmark, Wallet, BarChart3 } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ItsaStatusBanner } from "@/components/mtd/ItsaStatusBanner"

export default function MTDPage() {
  return (
    <div className="space-y-8">
      {/* ITSA Status Banner */}
      <ItsaStatusBanner />

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-[#0f172a] to-[#1e293b] rounded-2xl p-8 text-white">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-[#00e3ec]/20 rounded-xl flex items-center justify-center shrink-0">
            <Landmark className="h-6 w-6 text-[#00e3ec]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold mb-2">Making Tax Digital</h1>
            <p className="text-gray-300 max-w-2xl">
              Making Tax Digital (MTD) for Income Tax Self Assessment is HMRC&apos;s initiative to digitise the UK tax system.
              Instead of one annual tax return, you&apos;ll submit quarterly updates throughout the year.
            </p>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-[#00e3ec]" />
            When does MTD apply to you?
          </CardTitle>
          <CardDescription>
            MTD for Income Tax is being rolled out in phases based on your income
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-semibold text-sm">
                  2026
                </div>
                <div className="w-0.5 h-full bg-gray-200 mt-2" />
              </div>
              <div className="pb-6">
                <h3 className="font-semibold text-gray-900">April 2026</h3>
                <p className="text-gray-600 text-sm mt-1">
                  Mandatory for self-employed individuals and landlords with annual income over <strong>£50,000</strong>
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold text-sm">
                  2027
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">April 2027</h3>
                <p className="text-gray-600 text-sm mt-1">
                  Extended to those with annual income over <strong>£30,000</strong>
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* What MTD Means */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-[#00e3ec]" />
            What does MTD mean for you?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Quarterly Updates</h3>
              <p className="text-gray-600 text-sm">
                You&apos;ll need to submit income and expense summaries to HMRC every quarter,
                not just once a year. This gives HMRC a real-time view of your tax position.
              </p>
              <ul className="text-sm text-gray-600 space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#00e3ec] mt-0.5 shrink-0" />
                  Q1: 6 April – 5 July (deadline: 7 August)
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#00e3ec] mt-0.5 shrink-0" />
                  Q2: 6 July – 5 October (deadline: 7 November)
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#00e3ec] mt-0.5 shrink-0" />
                  Q3: 6 October – 5 January (deadline: 7 February)
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#00e3ec] mt-0.5 shrink-0" />
                  Q4: 6 January – 5 April (deadline: 7 May)
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Compatible Software Required</h3>
              <p className="text-gray-600 text-sm">
                You&apos;ll need to use MTD-compatible software to keep digital records and submit
                your quarterly updates. Spreadsheets alone won&apos;t be accepted.
              </p>
              <div className="bg-[#00e3ec]/10 border border-[#00e3ec]/20 rounded-lg p-4">
                <p className="text-sm text-[#00a8b0] font-medium">
                  Taxfolio is MTD-compatible software for quarterly submissions.
                  HMRC does not endorse or approve any software developer or product.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* How TaxFolio is Preparing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-[#00e3ec]" />
            How Taxfolio is preparing
          </CardTitle>
          <CardDescription>
            We&apos;re building MTD features so you&apos;ll be ready when quarterly submissions begin
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-[#00e3ec]/10 rounded-lg flex items-center justify-center mb-3">
                <CheckCircle2 className="h-4 w-4 text-[#00e3ec]" />
              </div>
              <h4 className="font-medium text-gray-900 text-sm">Bank Connections</h4>
              <p className="text-xs text-gray-500 mt-1">
                Connect your accounts to automatically import transactions
              </p>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-[#00e3ec]/10 rounded-lg flex items-center justify-center mb-3">
                <CheckCircle2 className="h-4 w-4 text-[#00e3ec]" />
              </div>
              <h4 className="font-medium text-gray-900 text-sm">AI Categorisation</h4>
              <p className="text-xs text-gray-500 mt-1">
                Automatically categorise income and expenses for HMRC
              </p>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-[#00e3ec]/10 rounded-lg flex items-center justify-center mb-3">
                <CheckCircle2 className="h-4 w-4 text-[#00e3ec]" />
              </div>
              <h4 className="font-medium text-gray-900 text-sm">Quarterly Tracking</h4>
              <p className="text-xs text-gray-500 mt-1">
                View your income and expenses broken down by quarter
              </p>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
              <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center mb-3">
                <Clock className="h-4 w-4 text-amber-600" />
              </div>
              <h4 className="font-medium text-gray-900 text-sm">Direct HMRC Submission</h4>
              <p className="text-xs text-gray-500 mt-1">
                Coming April 2026 – submit quarters directly to HMRC
              </p>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
              <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center mb-3">
                <Clock className="h-4 w-4 text-amber-600" />
              </div>
              <h4 className="font-medium text-gray-900 text-sm">End of Period Statement</h4>
              <p className="text-xs text-gray-500 mt-1">
                Coming April 2026 – finalise your annual position
              </p>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
              <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center mb-3">
                <Clock className="h-4 w-4 text-amber-600" />
              </div>
              <h4 className="font-medium text-gray-900 text-sm">Final Declaration</h4>
              <p className="text-xs text-gray-500 mt-1">
                Coming April 2026 – submit your annual tax calculation
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quarterly Submissions */}
      <Card className="bg-gradient-to-r from-[#0f172a] to-[#1e293b] border-0">
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-white">
              <h3 className="text-xl font-semibold mb-2">Quarterly Submissions</h3>
              <p className="text-gray-300 text-sm">
                View your filing obligations and submit quarterly updates to HMRC.
                Connect your HMRC account to get started.
              </p>
            </div>
            <Link href="/mtd/quarterly">
              <Button className="bg-[#00e3ec] hover:bg-[#00c4d4] text-black font-medium whitespace-nowrap">
                <CalendarDays className="h-4 w-4 mr-2" />
                View Quarterly Submissions
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Tax Account */}
      <Card className="bg-gradient-to-r from-[#0f172a] to-[#1e293b] border-0">
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-white">
              <h3 className="text-xl font-semibold mb-2">Tax Account</h3>
              <p className="text-gray-300 text-sm">
                View your Self Assessment balance, outstanding charges, and payment history.
              </p>
            </div>
            <Link href="/mtd/account">
              <Button className="bg-[#00e3ec] hover:bg-[#00c4d4] text-black font-medium whitespace-nowrap">
                <Wallet className="h-4 w-4 mr-2" />
                View Tax Account
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Annual Income Summary */}
      <Card className="bg-gradient-to-r from-[#0f172a] to-[#1e293b] border-0">
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-white">
              <h3 className="text-xl font-semibold mb-2">Annual Income Summary</h3>
              <p className="text-gray-300 text-sm">
                View your year-to-date income, expenses, and profit by business.
              </p>
            </div>
            <Link href="/mtd/income-summary">
              <Button className="bg-[#00e3ec] hover:bg-[#00c4d4] text-black font-medium whitespace-nowrap">
                <BarChart3 className="h-4 w-4 mr-2" />
                View Annual Summary
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Get Started */}
      <Card>
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Start preparing now</h3>
              <p className="text-gray-600 text-sm">
                Get your records in order and your bank accounts connected.
                When MTD goes live, you&apos;ll be ready.
              </p>
            </div>
            <Link href="/personal-tax">
              <Button variant="outline" className="whitespace-nowrap">
                <FileText className="h-4 w-4 mr-2" />
                Continue your tax return
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Software Limitations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-[#00e3ec]" />
            What Taxfolio supports
          </CardTitle>
          <CardDescription>
            Taxfolio currently supports the following MTD ITSA features
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-900">Supported</h4>
              <ul className="text-sm text-gray-600 space-y-1.5">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                  Self-employment (sole trader) quarterly submissions
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                  UK property income quarterly submissions
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                  Digital record keeping via Open Banking
                </li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-900">Not yet supported</h4>
              <ul className="text-sm text-gray-600 space-y-1.5">
                <li className="flex items-start gap-2">
                  <Clock className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                  End of Period Statement (EOPS)
                </li>
                <li className="flex items-start gap-2">
                  <Clock className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                  Final Declaration (crystallisation)
                </li>
                <li className="flex items-start gap-2">
                  <Clock className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                  Foreign property income
                </li>
                <li className="flex items-start gap-2">
                  <Clock className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                  Partnership income
                </li>
              </ul>
            </div>
            <p className="text-xs text-gray-500">
              If you need features not listed above, you can find other MTD-compatible software on the{" "}
              <a
                href="https://www.gov.uk/guidance/find-software-thats-compatible-with-making-tax-digital-for-income-tax"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#00c4d4] hover:underline"
              >
                HMRC software directory
              </a>.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* HMRC Personal Tax Account */}
      <Card>
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">HMRC Personal Tax Account</h3>
              <p className="text-gray-600 text-sm">
                View your full tax position, manage your details, and check submissions directly with HMRC.
              </p>
            </div>
            <a
              href="https://www.gov.uk/personal-tax-account"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" className="whitespace-nowrap">
                <Landmark className="h-4 w-4 mr-2" />
                Go to HMRC
              </Button>
            </a>
          </div>
        </CardContent>
      </Card>

      {/* Learn More */}
      <p className="text-xs text-gray-500 text-center">
        Learn more about Making Tax Digital on the{" "}
        <a
          href="https://www.gov.uk/government/publications/making-tax-digital-for-income-tax-self-assessment/making-tax-digital-for-income-tax-self-assessment"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#00c4d4] hover:underline"
        >
          official HMRC guidance page
        </a>
      </p>
    </div>
  )
}
