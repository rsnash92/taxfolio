import { getRevenueMetrics, getDailyRevenue } from '@/lib/admin/queries'
import { MetricCard } from '@/components/admin/MetricCard'
import { MiniChart } from '@/components/admin/MiniChart'
import {
  CreditCard,
  TrendingUp,
  PoundSterling,
  PieChart
} from 'lucide-react'

export default async function RevenuePage() {
  const metrics = await getRevenueMetrics()
  const dailyRevenue = await getDailyRevenue(30)

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Revenue</h1>
        <p className="text-zinc-400">Financial metrics and subscription data</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard
          title="Monthly Recurring (MRR)"
          value={`£${metrics.mrr.toFixed(2)}`}
          icon={TrendingUp}
          color="green"
        />

        <MetricCard
          title="Annual Run Rate (ARR)"
          value={`£${metrics.arr.toFixed(2)}`}
          icon={CreditCard}
          color="blue"
        />

        <MetricCard
          title="Total Revenue"
          value={`£${metrics.totalRevenue.toFixed(2)}`}
          icon={PoundSterling}
          color="purple"
        />

        <MetricCard
          title="This Month"
          value={`£${metrics.revenueThisMonth.toFixed(2)}`}
          icon={PieChart}
        />
      </div>

      {/* Revenue Chart */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Revenue (Last 30 Days)</h2>
        </div>
        <MiniChart
          data={dailyRevenue.map(d => ({ date: d.date, value: d.amount || 0 }))}
          color="green"
          prefix="£"
        />
      </div>

      {/* Subscription Breakdown */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Subscription Breakdown</h2>

        <div className="space-y-4">
          {metrics.subscriptionBreakdown.map((item) => (
            <div key={item.plan} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${
                  item.plan === 'pro' ? 'bg-purple-500' :
                  item.plan === 'lite' ? 'bg-blue-500' :
                  item.plan === 'lifetime' ? 'bg-green-500' :
                  'bg-zinc-500'
                }`} />
                <span className="text-white capitalize">{item.plan}</span>
              </div>
              <div className="text-right">
                <p className="text-white font-medium">{item.count} subscribers</p>
                <p className="text-sm text-zinc-500">£{item.revenue.toFixed(2)} total</p>
              </div>
            </div>
          ))}
        </div>

        {metrics.subscriptionBreakdown.length === 0 && (
          <p className="text-zinc-500 text-center py-4">No subscription data yet</p>
        )}
      </div>
    </div>
  )
}
