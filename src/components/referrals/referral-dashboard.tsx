'use client'

import { useEffect, useState } from 'react'
import { ReferralCodeCard } from './referral-code-card'
import { RewardsTable } from './rewards-table'
import { BalanceCard } from './balance-card'
import { InvitesTable } from './invites-table'
import { PayoutsTable } from './payouts-table'
import { Skeleton } from '@/components/ui/skeleton'

interface ReferralStats {
  code: string
  balance: number
  total_earned: number
  total_paid_out: number
  referral_count: number
  converted_count: number
}

interface Referral {
  id: string
  referred_email: string
  status: 'signed_up' | 'started_return' | 'submitted' | 'paid'
  signed_up_at: string
  paid_at: string | null
  product_type: string | null
  reward_amount: number | null
  reward_status: string
}

interface Payout {
  id: string
  amount: number
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
  requested_at: string
  processed_at: string | null
}

export function ReferralDashboard() {
  const [stats, setStats] = useState<ReferralStats | null>(null)
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [payouts, setPayouts] = useState<Payout[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [statsRes, invitesRes, payoutsRes] = await Promise.all([
        fetch('/api/referrals/stats'),
        fetch('/api/referrals/invites'),
        fetch('/api/referrals/payout'),
      ])

      const statsData = await statsRes.json()
      const invitesData = await invitesRes.json()
      const payoutsData = await payoutsRes.json()

      setStats(statsData)
      setReferrals(invitesData.referrals || [])
      setPayouts(payoutsData.payouts || [])
    } catch (error) {
      console.error('Failed to load referral data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePayoutSuccess = () => {
    // Reload data after payout request
    loadData()
  }

  if (loading) {
    return <ReferralDashboardSkeleton />
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Failed to load referral data.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Top row: Code + Rewards */}
      <div className="grid gap-6 md:grid-cols-2">
        <ReferralCodeCard code={stats.code} />
        <RewardsTable />
      </div>

      {/* Balance card */}
      <BalanceCard
        balance={stats.balance}
        totalEarned={stats.total_earned}
        totalPaidOut={stats.total_paid_out}
        onPayoutSuccess={handlePayoutSuccess}
      />

      {/* Invites table */}
      <InvitesTable referrals={referrals} />

      {/* Payouts history */}
      {payouts.length > 0 && <PayoutsTable payouts={payouts} />}
    </div>
  )
}

function ReferralDashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
      <Skeleton className="h-32" />
      <Skeleton className="h-48" />
    </div>
  )
}
