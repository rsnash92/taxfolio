import { createClient } from '@/lib/supabase/server'
import { MetricCard } from '@/components/admin/MetricCard'
import { Gift, Users, Wallet, Clock, CheckCircle, XCircle } from 'lucide-react'
import { PayoutsManager } from '@/components/admin/PayoutsManager'

async function getReferralStats() {
  const supabase = await createClient()

  // Get total referrals
  const { count: totalReferrals } = await supabase
    .from('referrals')
    .select('*', { count: 'exact', head: true })

  // Get converted referrals
  const { count: convertedReferrals } = await supabase
    .from('referrals')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'converted')

  // Get total rewards paid out
  const { data: paidOut } = await supabase
    .from('referral_payouts')
    .select('amount')
    .eq('status', 'completed')

  const totalPaidOut = paidOut?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0

  // Get pending payout requests
  const { count: pendingPayouts } = await supabase
    .from('referral_payouts')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending')

  // Get total balance across all users
  const { data: balances } = await supabase
    .from('referral_balance_transactions')
    .select('amount, type')

  const totalOutstandingBalance = balances?.reduce((sum, t) => {
    return sum + (t.type === 'credit' ? t.amount : -t.amount)
  }, 0) || 0

  // Get users with referral codes
  const { count: usersWithCodes } = await supabase
    .from('referral_codes')
    .select('*', { count: 'exact', head: true })

  // Get top referrers
  const { data: topReferrers } = await supabase
    .from('referrals')
    .select(`
      referrer_id,
      referrer:users!referrals_referrer_id_fkey(email, full_name)
    `)
    .eq('status', 'converted')

  // Aggregate top referrers
  const referrerCounts: Record<string, { email: string; name: string; count: number }> = {}
  topReferrers?.forEach((r) => {
    const id = r.referrer_id
    // Supabase returns joined data - handle both single object and array cases
    const referrer = Array.isArray(r.referrer) ? r.referrer[0] : r.referrer
    if (!referrerCounts[id]) {
      referrerCounts[id] = {
        email: referrer?.email || 'Unknown',
        name: referrer?.full_name || 'Unknown',
        count: 0
      }
    }
    referrerCounts[id].count++
  })

  const topReferrersList = Object.values(referrerCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  return {
    totalReferrals: totalReferrals || 0,
    convertedReferrals: convertedReferrals || 0,
    totalPaidOut,
    pendingPayouts: pendingPayouts || 0,
    totalOutstandingBalance,
    usersWithCodes: usersWithCodes || 0,
    topReferrers: topReferrersList,
  }
}

async function getPendingPayouts() {
  const supabase = await createClient()

  const { data: payouts } = await supabase
    .from('referral_payouts')
    .select(`
      *,
      user:users!referral_payouts_user_id_fkey(email, full_name)
    `)
    .in('status', ['pending', 'processing'])
    .order('requested_at', { ascending: true })

  return payouts || []
}

async function getRecentPayouts() {
  const supabase = await createClient()

  const { data: payouts } = await supabase
    .from('referral_payouts')
    .select(`
      *,
      user:users!referral_payouts_user_id_fkey(email, full_name)
    `)
    .in('status', ['completed', 'failed'])
    .order('processed_at', { ascending: false })
    .limit(20)

  return payouts || []
}

export default async function AdminReferralsPage() {
  const stats = await getReferralStats()
  const pendingPayouts = await getPendingPayouts()
  const recentPayouts = await getRecentPayouts()

  const conversionRate = stats.totalReferrals > 0
    ? Math.round((stats.convertedReferrals / stats.totalReferrals) * 100)
    : 0

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Referrals</h1>
        <p className="text-zinc-400">Manage referral program and payouts</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard
          title="Total Referrals"
          value={stats.totalReferrals}
          icon={Users}
          trend={`${conversionRate}% converted`}
          trendUp={conversionRate > 20}
        />

        <MetricCard
          title="Converted"
          value={stats.convertedReferrals}
          icon={Gift}
          trend={`${stats.usersWithCodes} users sharing`}
          color="green"
        />

        <MetricCard
          title="Total Paid Out"
          value={`£${stats.totalPaidOut.toLocaleString()}`}
          icon={Wallet}
          trend={`£${stats.totalOutstandingBalance} outstanding`}
          color="blue"
        />

        <MetricCard
          title="Pending Payouts"
          value={stats.pendingPayouts}
          icon={Clock}
          trend="Awaiting processing"
          color={stats.pendingPayouts > 0 ? 'yellow' : 'green'}
        />
      </div>

      {/* Payouts Manager */}
      <div className="mb-8">
        <PayoutsManager
          pendingPayouts={pendingPayouts}
          recentPayouts={recentPayouts}
        />
      </div>

      {/* Top Referrers */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Top Referrers</h2>
        {stats.topReferrers.length > 0 ? (
          <div className="space-y-3">
            {stats.topReferrers.map((referrer, idx) => (
              <div key={idx} className="flex items-center justify-between py-2 border-b border-zinc-800 last:border-0">
                <div className="flex items-center gap-3">
                  <span className="text-zinc-500 text-sm w-6">#{idx + 1}</span>
                  <div>
                    <p className="text-white text-sm">{referrer.name}</p>
                    <p className="text-zinc-500 text-xs">{referrer.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[#15e49e] font-medium">{referrer.count}</span>
                  <span className="text-zinc-500 text-sm">conversions</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-zinc-500 text-sm">No referrals yet</p>
        )}
      </div>
    </div>
  )
}
