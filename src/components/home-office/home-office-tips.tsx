"use client"

import { Info, CheckCircle, XCircle, AlertTriangle } from "lucide-react"

export function HomeOfficeTips() {
  return (
    <div className="space-y-6">
      {/* What you can claim */}
      <div className="p-5 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-500" />
          What you CAN claim
        </h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>Electricity used in your work area</li>
          <li>Gas / heating for your work area</li>
          <li>Metered water rates (proportion)</li>
          <li>Council tax (proportion)</li>
          <li>Mortgage interest OR rent (proportion, not both)</li>
          <li>Home insurance (proportion)</li>
          <li>Broadband and phone line</li>
          <li>General repairs and maintenance (proportion)</li>
        </ul>
      </div>

      {/* What you cannot claim */}
      <div className="p-5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <XCircle className="h-5 w-5 text-red-500" />
          What you CANNOT claim
        </h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>Mortgage capital repayments (only interest)</li>
          <li>Full cost of anything used personally too</li>
          <li>Costs if you have a separate business premises</li>
          <li>Food and drink</li>
          <li>Childcare costs</li>
        </ul>
      </div>

      {/* Important notes */}
      <div className="p-5 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl">
        <h3 className="font-semibold text-amber-800 dark:text-amber-200 mb-4 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          Important Notes
        </h3>
        <ul className="space-y-2 text-sm text-amber-700 dark:text-amber-200/80">
          <li>
            You must choose ONE method per tax year - you cannot switch mid-year
          </li>
          <li>
            Keep records of your household bills if using actual costs method
          </li>
          <li>If you work from home only sometimes, reduce proportionally</li>
          <li>
            A dedicated room gives cleaner calculation, but it&apos;s not required
          </li>
          <li>
            Capital gains tax could apply if you sell and claimed for a dedicated
            room
          </li>
        </ul>
      </div>

      {/* HMRC link */}
      <div className="p-5 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
        <h3 className="font-semibold mb-2 flex items-center gap-2">
          <Info className="h-5 w-5 text-blue-500" />
          Official HMRC Guidance
        </h3>
        <p className="text-sm text-muted-foreground mb-3">
          For complete details on working from home expenses, see the official
          HMRC guidance:
        </p>
        <a
          href="https://www.gov.uk/simpler-income-tax-simplified-expenses/working-from-home"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-[#15e49e] hover:underline"
        >
          gov.uk/simpler-income-tax-simplified-expenses
        </a>
      </div>
    </div>
  )
}
