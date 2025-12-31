import {
  UserPlus,
  CreditCard,
  Building2,
  FileText,
  LogOut,
  AlertCircle,
  LucideIcon
} from 'lucide-react'

interface Activity {
  id: string
  user_email: string | null
  action: string
  details?: Record<string, unknown> | null
  created_at: string
}

interface ActivityFeedProps {
  activities: Activity[]
}

const actionConfig: Record<string, { icon: LucideIcon; color: string; label: string }> = {
  signup: { icon: UserPlus, color: 'text-green-500', label: 'signed up' },
  subscription: { icon: CreditCard, color: 'text-blue-500', label: 'subscribed' },
  subscription_cancelled: { icon: LogOut, color: 'text-red-500', label: 'cancelled subscription' },
  bank_connected: { icon: Building2, color: 'text-purple-500', label: 'connected bank' },
  bank_disconnected: { icon: Building2, color: 'text-zinc-500', label: 'disconnected bank' },
  transactions_imported: { icon: FileText, color: 'text-amber-500', label: 'imported transactions' },
  default: { icon: AlertCircle, color: 'text-zinc-500', label: '' },
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
  if (activities.length === 0) {
    return (
      <div className="text-center py-8 text-zinc-500">
        No recent activity
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {activities.map((activity) => {
        const config = actionConfig[activity.action] || actionConfig.default
        const Icon = config.icon

        return (
          <div key={activity.id} className="flex items-start gap-3">
            <div className={`p-2 rounded-lg bg-zinc-800 ${config.color}`}>
              <Icon className="h-4 w-4" />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm text-white">
                <span className="font-medium">{activity.user_email || 'Unknown user'}</span>
                {' '}
                <span className="text-zinc-400">
                  {config.label || activity.action}
                </span>
                {activity.details && typeof activity.details === 'object' && 'plan' in activity.details && (
                  <span className="text-zinc-400">
                    {' '}to <span className="text-white">{String(activity.details.plan)}</span>
                  </span>
                )}
              </p>
              <p className="text-xs text-zinc-500 mt-0.5">
                {new Date(activity.created_at).toLocaleString('en-GB', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
