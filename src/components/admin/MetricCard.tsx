import { LucideIcon } from 'lucide-react'

interface MetricCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  trend?: string
  trendUp?: boolean
  color?: 'default' | 'green' | 'blue' | 'purple' | 'red'
}

const colorClasses = {
  default: 'bg-zinc-800 text-zinc-400',
  green: 'bg-green-500/20 text-green-500',
  blue: 'bg-blue-500/20 text-blue-500',
  purple: 'bg-purple-500/20 text-purple-500',
  red: 'bg-red-500/20 text-red-500',
}

export function MetricCard({
  title,
  value,
  icon: Icon,
  trend,
  trendUp,
  color = 'default'
}: MetricCardProps) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-zinc-400">{title}</span>
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>

      <div className="text-3xl font-bold text-white mb-1">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>

      {trend && (
        <div className={`text-sm ${trendUp ? 'text-green-400' : 'text-zinc-500'}`}>
          {trend}
        </div>
      )}
    </div>
  )
}
