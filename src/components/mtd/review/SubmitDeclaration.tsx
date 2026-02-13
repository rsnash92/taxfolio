'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Loader2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface SubmitDeclarationProps {
  cumulativeIncome: number
  cumulativeExpenses: number
  adjustments: Record<string, number>
  submitting: boolean
  error: string | null
  onSubmit: () => void
}

export function SubmitDeclaration({
  cumulativeIncome,
  cumulativeExpenses,
  adjustments,
  submitting,
  error,
  onSubmit,
}: SubmitDeclarationProps) {
  const [confirmed, setConfirmed] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)

  const totalAdjustments = Object.values(adjustments).reduce((s, v) => s + v, 0)
  const adjustedExpenses = cumulativeExpenses + totalAdjustments
  const netProfit = cumulativeIncome - adjustedExpenses

  const handleSubmitClick = () => {
    setDialogOpen(true)
  }

  const handleConfirmSubmit = () => {
    setDialogOpen(false)
    onSubmit()
  }

  return (
    <>
      <Card>
        <CardContent className="space-y-4">
          <h2 className="text-base font-semibold text-gray-900">Declaration</h2>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-0.5 rounded border-gray-300 text-[#00e3ec] focus:ring-[#00e3ec]"
            />
            <span className="text-sm text-gray-700">
              I confirm that the information I have provided is correct and complete to the best
              of my knowledge and belief. I understand that I may have to pay financial penalties
              and face prosecution if I give false information.
            </span>
          </label>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          <Button
            onClick={handleSubmitClick}
            disabled={!confirmed || submitting}
            className="w-full bg-[#00e3ec] hover:bg-[#00c4d4] text-black font-semibold disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[#00e3ec]"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Submitting to HMRC...
              </>
            ) : (
              'Submit to HMRC'
            )}
          </Button>
        </CardContent>
      </Card>

      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit to HMRC?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>You are about to submit the following cumulative figures:</p>
                <div className="bg-gray-50 rounded-lg p-3 space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span>Total Income</span>
                    <span className="font-mono font-medium">{formatCurrency(cumulativeIncome)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Expenses</span>
                    <span className="font-mono font-medium">({formatCurrency(adjustedExpenses)})</span>
                  </div>
                  {totalAdjustments !== 0 && (
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Including adjustments</span>
                      <span className="font-mono">{totalAdjustments > 0 ? '+' : ''}{formatCurrency(totalAdjustments)}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t pt-1.5 font-semibold">
                    <span>Net Profit</span>
                    <span className={`font-mono ${netProfit >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                      {formatCurrency(netProfit)}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  This submission is cumulative — it includes all data from the start of the tax year to the end of this quarter.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmSubmit}
              className="bg-[#00e3ec] hover:bg-[#00c4d4] text-black"
            >
              Submit
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
