import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Calendar, Users, Gift, ExternalLink } from "lucide-react"
import Link from "next/link"

function getCurrentTaxYear(): number {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const day = now.getDate()

  if (month > 4 || (month === 4 && day >= 6)) {
    return year
  } else {
    return year - 1
  }
}

// Get important tax deadlines for the current year
function getTaxDeadlines(year: number) {
  return [
    {
      title: "Self Assessment Deadline",
      date: new Date(year + 1, 0, 31), // 31 January
      description: "Avoid the £100 penalty! This is your deadline to file your personal tax return and make any potential tax liability payments to HMRC.",
    },
    {
      title: "New Tax Year!",
      date: new Date(year + 1, 3, 6), // 6 April
      description: "From the 6th April, your allowances may reset and you can begin filing for the new tax year. Ready to get ahead? We're here to make it effortless.",
    },
    {
      title: "POA 31 July",
      date: new Date(year + 1, 6, 31), // 31 July
      description: "This applies if you make advance tax payments. Your Tax Pack will highlight this if it applies to you, so you know exactly what to do.",
    },
    {
      title: "First Time Filing?",
      date: new Date(year, 9, 5), // 5 October
      description: `Register by 5 October. If this is your first year needing to file a tax return, you must register for Self Assessment by 5 October ${year}.`,
    },
  ]
}

// Tax calendar months with deadline markers
function getTaxCalendar(year: number) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const deadlineMonths = [0, 3, 6, 9] // Jan, Apr, Jul, Oct have deadlines

  return months.map((month, index) => ({
    name: month,
    hasDeadline: deadlineMonths.includes(index),
  }))
}

export default async function DashboardPage() {
  const supabase = await createClient()
  await supabase.auth.getUser()
  const taxYear = getCurrentTaxYear()
  const deadlines = getTaxDeadlines(taxYear)
  const calendar = getTaxCalendar(taxYear)

  return (
    <div className="space-y-6">
      {/* Quick Links Grid */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Link href="/personal-tax">
          <div className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-full font-medium transition-colors">
            <FileText className="h-4 w-4" />
            Personal Taxes
          </div>
        </Link>

        <Link href="/mtd">
          <div className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-full font-medium transition-colors">
            <Calendar className="h-4 w-4" />
            Making Tax Digital
          </div>
        </Link>

        <Link href="/referrals">
          <div className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-full font-medium transition-colors">
            <Users className="h-4 w-4" />
            Referrals
          </div>
        </Link>

        <Link href="/referrals">
          <div className="flex items-center justify-center gap-2 px-4 py-3 bg-green-50 hover:bg-green-100 text-green-600 rounded-full font-medium transition-colors">
            <Gift className="h-4 w-4" />
            Refer a friend
          </div>
        </Link>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Tax Calendar & Deadlines - Takes 2 columns */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle>Personal Tax dates</CardTitle>
                <span className="text-sm text-muted-foreground">{taxYear + 1}</span>
              </div>
            </CardHeader>
            <CardContent>
              {/* Calendar Grid */}
              <div className="grid grid-cols-4 gap-2 mb-6">
                {calendar.map((month, index) => (
                  <div
                    key={month.name}
                    className={`relative py-3 px-2 text-center text-sm rounded-lg ${
                      index < 4 ? 'bg-blue-50 text-blue-700' : 'bg-gray-50 text-gray-600'
                    }`}
                  >
                    {month.name}
                    {month.hasDeadline && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-400 rounded-full" />
                    )}
                  </div>
                ))}
              </div>

              {/* Deadline Cards */}
              <div className="space-y-4">
                {deadlines.map((deadline) => (
                  <div key={deadline.title} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{deadline.title}</h4>
                      <span className="text-sm font-medium text-blue-600">
                        {deadline.date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{deadline.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* HMRC Links Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>HMRC Links</CardTitle>
              <CardDescription>
                We have provided a few HMRC links that we feel could be helpful to you:
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Contact HMRC */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Contact HMRC</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Need to contact HMRC about a tax refund, address change or confirm a tax return?
                  We&apos;d recommend using their digital chat. If you ask to be routed to a human advisor
                  (twice), a HMRC agent will be able to resolve your query.
                </p>
                <a
                  href="https://www.gov.uk/contact-hmrc"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm font-medium text-[#00c4d4] hover:underline"
                >
                  Contact HMRC
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>

              <div className="border-t pt-6">
                <h4 className="font-medium text-gray-900 mb-2">Paying HMRC</h4>
                <p className="text-sm text-gray-600 mb-3">
                  If you have a tax liability, you need to get this settled with HMRC by 31 January
                  following the tax year. There&apos;s a number of different ways to pay, click the link
                  below for full details.
                </p>
                <a
                  href="https://www.gov.uk/pay-self-assessment-tax-bill"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm font-medium text-[#00c4d4] hover:underline"
                >
                  Pay HMRC
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>

              <div className="border-t pt-6">
                <h4 className="font-medium text-gray-900 mb-2">Check Your Tax Code</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Your tax code determines how much tax is deducted from your pay. You can check if
                  your tax code is correct and update your details using your Personal Tax Account.
                </p>
                <a
                  href="https://www.gov.uk/check-income-tax-current-year"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm font-medium text-[#00c4d4] hover:underline"
                >
                  Check Tax Code
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
