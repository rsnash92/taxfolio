import { Metadata } from 'next'
import { ReferralDashboard } from '@/components/referrals'

export const metadata: Metadata = {
  title: 'Referrals | TaxFolio',
  description: 'Invite friends and earn cash rewards',
}

export default function ReferralsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Referrals</h1>
        <p className="text-muted-foreground mt-1">
          Invite friends to TaxFolio and earn cash rewards when they file their
          return.
        </p>
      </div>

      <ReferralDashboard />
    </div>
  )
}
