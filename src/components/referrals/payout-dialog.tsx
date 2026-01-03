'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertCircle, Loader2 } from 'lucide-react'
import { REFERRAL_CONFIG } from '@/lib/referrals/config'

interface PayoutDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  maxAmount: number
  onSuccess: () => void
}

export function PayoutDialog({
  open,
  onOpenChange,
  maxAmount,
  onSuccess,
}: PayoutDialogProps) {
  const [amount, setAmount] = useState(maxAmount.toString())
  const [accountHolderName, setAccountHolderName] = useState('')
  const [sortCode, setSortCode] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/referrals/payout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(amount),
          accountHolderName,
          sortCode: sortCode.replace(/-/g, ''),
          accountNumber,
        }),
      })

      const data = await res.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to request payout')
      }

      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  // Format sort code as XX-XX-XX
  const handleSortCodeChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 6)
    if (digits.length > 4) {
      setSortCode(
        `${digits.slice(0, 2)}-${digits.slice(2, 4)}-${digits.slice(4)}`
      )
    } else if (digits.length > 2) {
      setSortCode(`${digits.slice(0, 2)}-${digits.slice(2)}`)
    } else {
      setSortCode(digits)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Request Payout</DialogTitle>
          <DialogDescription>
            Enter your UK bank account details. Payments are processed within{' '}
            {REFERRAL_CONFIG.payout.processingDays} working days.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                £
              </span>
              <Input
                id="amount"
                type="number"
                min={REFERRAL_CONFIG.payout.minimumAmount}
                max={maxAmount}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-7"
                required
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Available: £{maxAmount.toFixed(2)}
            </p>
          </div>

          {/* Account holder name */}
          <div className="space-y-2">
            <Label htmlFor="accountHolderName">Account holder name</Label>
            <Input
              id="accountHolderName"
              value={accountHolderName}
              onChange={(e) => setAccountHolderName(e.target.value)}
              placeholder="John Smith"
              required
            />
          </div>

          {/* Sort code */}
          <div className="space-y-2">
            <Label htmlFor="sortCode">Sort code</Label>
            <Input
              id="sortCode"
              value={sortCode}
              onChange={(e) => handleSortCodeChange(e.target.value)}
              placeholder="00-00-00"
              required
            />
          </div>

          {/* Account number */}
          <div className="space-y-2">
            <Label htmlFor="accountNumber">Account number</Label>
            <Input
              id="accountNumber"
              value={accountNumber}
              onChange={(e) =>
                setAccountNumber(e.target.value.replace(/\D/g, '').slice(0, 8))
              }
              placeholder="12345678"
              maxLength={8}
              required
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Request Payout
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
