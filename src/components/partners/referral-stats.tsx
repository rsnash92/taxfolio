import { MousePointer, Users, PoundSterling, Clock } from "lucide-react"

interface ReferralStatsProps {
  totalReferrals: number
  totalConversions: number
  totalEarnings: number
  pendingEarnings: number
}

export function ReferralStats({
  totalReferrals,
  totalConversions,
  totalEarnings,
  pendingEarnings,
}: ReferralStatsProps) {
  const conversionRate =
    totalReferrals > 0
      ? ((totalConversions / totalReferrals) * 100).toFixed(1)
      : "0"

  const stats = [
    {
      label: "Total Clicks",
      value: totalReferrals.toLocaleString(),
      icon: MousePointer,
      color: "text-blue-500",
      bgColor: "bg-blue-500/20",
    },
    {
      label: "Conversions",
      value: totalConversions.toLocaleString(),
      subtext: `${conversionRate}% rate`,
      icon: Users,
      color: "text-purple-500",
      bgColor: "bg-purple-500/20",
    },
    {
      label: "Total Earnings",
      value: `£${totalEarnings.toFixed(2)}`,
      icon: PoundSterling,
      color: "text-green-500",
      bgColor: "bg-green-500/20",
    },
    {
      label: "Pending",
      value: `£${pendingEarnings.toFixed(2)}`,
      subtext: "Awaiting payout",
      icon: Clock,
      color: "text-amber-500",
      bgColor: "bg-amber-500/20",
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <div key={stat.label} className="bg-card border rounded-xl p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className={`p-2 rounded-lg ${stat.bgColor}`}>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
            <span className="text-sm text-muted-foreground">{stat.label}</span>
          </div>
          <p className="text-2xl font-bold">{stat.value}</p>
          {stat.subtext && (
            <p className="text-xs text-muted-foreground mt-1">{stat.subtext}</p>
          )}
        </div>
      ))}
    </div>
  )
}
