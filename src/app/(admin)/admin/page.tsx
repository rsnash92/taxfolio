import {
  getAdminStats,
  getDailySignups,
  getDailyRevenue,
  getRecentActivity
} from '@/lib/admin/queries'
import { MetricCard } from '@/components/admin/MetricCard'
import { MiniChart } from '@/components/admin/MiniChart'
import { ActivityFeed } from '@/components/admin/ActivityFeed'
import {
  Users,
  CreditCard,
  Building2,
  FileText,
} from 'lucide-react'

export default async function AdminDashboard() {
  const stats = await getAdminStats()
  const dailySignups = await getDailySignups(14)
  const dailyRevenue = await getDailyRevenue(14)
  const recentActivity = await getRecentActivity(10)

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-zinc-400">Overview of TaxFolio metrics</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard
          title="Total Users"
          value={stats.total_users}
          icon={Users}
          trend={`+${stats.users_this_week} this week`}
          trendUp={stats.users_this_week > 0}
        />

        <MetricCard
          title="Active Subscriptions"
          value={stats.active_subscriptions}
          icon={CreditCard}
          trend={`${stats.trialing_users} trialing`}
          color="green"
        />

        <MetricCard
          title="Bank Connections"
          value={stats.bank_connections}
          icon={Building2}
          trend={`${stats.total_users > 0 ? Math.round((stats.bank_connections / stats.total_users) * 100) : 0}% of users`}
          color="blue"
        />

        <MetricCard
          title="Transactions"
          value={stats.total_transactions.toLocaleString()}
          icon={FileText}
          color="purple"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Signups</h2>
            <span className="text-sm text-zinc-400">Last 14 days</span>
          </div>
          <MiniChart
            data={dailySignups.map(d => ({ date: d.date, value: d.count }))}
            color="green"
          />
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Revenue</h2>
            <span className="text-sm text-zinc-400">Last 14 days</span>
          </div>
          <MiniChart
            data={dailyRevenue.map(d => ({ date: d.date, value: d.amount || 0 }))}
            color="blue"
            prefix="£"
          />
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Recent Activity</h2>
          <ActivityFeed activities={recentActivity} />
        </div>

        {/* Quick Stats */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Quick Stats</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Today&apos;s signups</span>
              <span className="text-white font-medium">{stats.users_today}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Conversion rate</span>
              <span className="text-white font-medium">
                {stats.total_users > 0
                  ? Math.round((stats.active_subscriptions / stats.total_users) * 100)
                  : 0}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Churn rate</span>
              <span className="text-white font-medium">
                {stats.total_users > 0
                  ? Math.round((stats.churned_users / stats.total_users) * 100)
                  : 0}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Bank connection rate</span>
              <span className="text-white font-medium">
                {stats.total_users > 0
                  ? Math.round((stats.bank_connections / stats.total_users) * 100)
                  : 0}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Avg transactions/user</span>
              <span className="text-white font-medium">
                {stats.total_users > 0
                  ? Math.round(stats.total_transactions / stats.total_users)
                  : 0}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
