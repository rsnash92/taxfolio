"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Calculator, PiggyBank, Calendar } from "lucide-react"
import type { TaxCalculation } from "@/lib/year-end/types"

interface TaxSectionProps {
  tax: TaxCalculation
}

export function TaxSection({ tax }: TaxSectionProps) {
  const formatMoney = (amount: number) =>
    `£${amount.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Calculator className="h-5 w-5 text-purple-600" />
        Tax Breakdown
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Income Tax */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Income Tax</CardTitle>
            <CardDescription>Based on your taxable profit of {formatMoney(tax.taxableProfit)}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Personal Allowance Used</span>
              <span>{formatMoney(tax.personalAllowanceUsed)}</span>
            </div>

            {tax.incomeTax.basicRate.amount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Basic Rate (20%)</span>
                <span>{formatMoney(tax.incomeTax.basicRate.tax)}</span>
              </div>
            )}

            {tax.incomeTax.higherRate.amount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Higher Rate (40%)</span>
                <span>{formatMoney(tax.incomeTax.higherRate.tax)}</span>
              </div>
            )}

            {tax.incomeTax.additionalRate.amount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Additional Rate (45%)</span>
                <span>{formatMoney(tax.incomeTax.additionalRate.tax)}</span>
              </div>
            )}

            <div className="flex justify-between font-medium pt-2 border-t">
              <span>Total Income Tax</span>
              <span>{formatMoney(tax.incomeTax.total)}</span>
            </div>
          </CardContent>
        </Card>

        {/* National Insurance */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">National Insurance</CardTitle>
            <CardDescription>Class 2 and Class 4 contributions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {tax.nationalInsurance.class2 > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Class 2 (flat rate)</span>
                <span>{formatMoney(tax.nationalInsurance.class2)}</span>
              </div>
            )}

            {tax.nationalInsurance.class4Lower > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Class 4 (6% band)</span>
                <span>{formatMoney(tax.nationalInsurance.class4Lower)}</span>
              </div>
            )}

            {tax.nationalInsurance.class4Upper > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Class 4 (2% band)</span>
                <span>{formatMoney(tax.nationalInsurance.class4Upper)}</span>
              </div>
            )}

            <div className="flex justify-between font-medium pt-2 border-t">
              <span>Total NI</span>
              <span>{formatMoney(tax.nationalInsurance.total)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Total and Payments on Account */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        {/* Total */}
        <Card className="border-purple-500/30 bg-purple-500/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
                <PiggyBank className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Tax Due</p>
                <p className="text-2xl font-bold">{formatMoney(tax.totalTaxDue)}</p>
              </div>
            </div>
            <div className="flex gap-4 text-sm text-muted-foreground">
              <span>Effective rate: {tax.effectiveTaxRate.toFixed(1)}%</span>
              <span>Marginal rate: {tax.marginalRate}%</span>
            </div>
          </CardContent>
        </Card>

        {/* Payments on Account */}
        {tax.paymentsOnAccount.required && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                  <Calendar className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Payments on Account</p>
                  <p className="text-lg font-bold">Required</p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">31 January</span>
                  <span>{formatMoney(tax.paymentsOnAccount.firstPayment)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">31 July</span>
                  <span>{formatMoney(tax.paymentsOnAccount.secondPayment)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
