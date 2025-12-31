import { getRecentActivity } from '@/lib/admin/queries'
import { ActivityFeed } from '@/components/admin/ActivityFeed'

export default async function ActivityPage() {
  const activities = await getRecentActivity(100)

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Activity</h1>
        <p className="text-zinc-400">Recent user activity and events</p>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <ActivityFeed activities={activities} />
      </div>
    </div>
  )
}
