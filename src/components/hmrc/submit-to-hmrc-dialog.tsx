"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Send, AlertTriangle, CheckCircle2, Loader2 } from "lucide-react"

interface SubmitToHMRCDialogProps {
  taxYear: string
  businessId: string
  periodFrom: string
  periodTo: string
  income: number
  expenses: number
  onSuccess?: () => void
  children?: React.ReactNode
}

export function SubmitToHMRCDialog({
  taxYear,
  businessId,
  periodFrom,
  periodTo,
  income,
  expenses,
  onSuccess,
  children,
}: SubmitToHMRCDialogProps) {
  const [open, setOpen] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const profit = income - expenses

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(amount)
  }

  const handleSubmit = async () => {
    if (!confirmed) {
      toast.error('Please confirm the information is correct')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/hmrc/submit-period', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId,
          periodFrom,
          periodTo,
          income,
          expenses,
        }),
      })

      if (res.ok) {
        setSubmitted(true)
        toast.success('Successfully submitted to HMRC')
        onSuccess?.()
      } else {
        const error = await res.json()
        toast.error(error.error || 'Failed to submit to HMRC')
      }
    } catch (error) {
      console.error('Submit error:', error)
      toast.error('Failed to submit to HMRC')
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    setOpen(false)
    setConfirmed(false)
    setSubmitted(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button>
            <Send className="h-4 w-4 mr-2" />
            Submit to HMRC
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        {submitted ? (
          <>
            <DialogHeader>
              <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <DialogTitle className="text-center">Submitted Successfully</DialogTitle>
              <DialogDescription className="text-center">
                Your income has been submitted to HMRC for tax year {taxYear}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button onClick={handleClose} className="w-full">
                Close
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Submit to HMRC</DialogTitle>
              <DialogDescription>
                Review and submit your income for {periodFrom} to {periodTo}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Summary */}
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax Year</span>
                  <span className="font-medium">{taxYear}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Period</span>
                  <span className="font-medium">{periodFrom} to {periodTo}</span>
                </div>
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Income</span>
                    <span className="font-medium">{formatCurrency(income)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Expenses</span>
                    <span className="font-medium">-{formatCurrency(expenses)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-medium pt-2 border-t mt-2">
                    <span>Net Profit</span>
                    <span className={profit < 0 ? 'text-red-600' : 'text-green-600'}>
                      {formatCurrency(profit)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Warning */}
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  This will submit your self-employment income directly to HMRC.
                  Please ensure all figures are correct.
                </AlertDescription>
              </Alert>

              {/* Confirmation */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="confirm"
                  checked={confirmed}
                  onCheckedChange={(checked) => setConfirmed(checked === true)}
                />
                <Label htmlFor="confirm" className="text-sm">
                  I confirm the information above is correct and complete
                </Label>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!confirmed || submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Submit to HMRC
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
