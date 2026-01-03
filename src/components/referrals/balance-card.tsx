'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PayoutDialog } from './payout-dialog'
import { REFERRAL_CONFIG } from '@/lib/referrals/config'

interface BalanceCardProps {
  balance: number
  totalEarned: number
  totalPaidOut: number
  onPayoutSuccess: () => void
}

export function BalanceCard({
  balance,
  totalEarned,
  totalPaidOut,
  onPayoutSuccess,
}: BalanceCardProps) {
  const [showPayoutDialog, setShowPayoutDialog] = useState(false)

  const canRequestPayout = balance >= REFERRAL_CONFIG.payout.minimumAmount

  return (
    <>
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            {/* Balance */}
            <div className="flex items-center gap-8">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Cash Balance
                </p>
                <p className="text-4xl font-bold">£{balance.toFixed(0)}</p>
              </div>

              <div className="h-12 w-px bg-border hidden md:block" />

              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Total Earned
                </p>
                <p className="text-2xl font-semibold">
                  £{totalEarned.toFixed(0)}
                </p>
              </div>

              <div className="h-12 w-px bg-border hidden md:block" />

              <div>
                <p className="text-sm text-muted-foreground mb-1">Cashed Out</p>
                <p className="text-2xl font-semibold">
                  £{totalPaidOut.toFixed(0)}
                </p>
              </div>
            </div>

            {/* Payout button */}
            <div className="flex flex-col items-end gap-1">
              <Button
                onClick={() => setShowPayoutDialog(true)}
                disabled={!canRequestPayout}
                variant={canRequestPayout ? 'default' : 'outline'}
              >
                Cash out
              </Button>
              {!canRequestPayout && balance > 0 && (
                <p className="text-xs text-muted-foreground">
                  Min. £{REFERRAL_CONFIG.payout.minimumAmount} to cash out
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <PayoutDialog
        open={showPayoutDialog}
        onOpenChange={setShowPayoutDialog}
        maxAmount={balance}
        onSuccess={() => {
          setShowPayoutDialog(false)
          onPayoutSuccess()
        }}
      />
    </>
  )
}
