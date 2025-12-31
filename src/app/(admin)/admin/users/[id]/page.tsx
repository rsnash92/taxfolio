import { getUserDetails } from '@/lib/admin/queries'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Building2, CreditCard, FileText, Calendar } from 'lucide-react'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function UserDetailPage({ params }: PageProps) {
  const { id } = await params
  const user = await getUserDetails(id)

  if (!user) {
    notFound()
  }

  const statusColors: Record<string, string> = {
    active: 'bg-green-500/20 text-green-400',
    trialing: 'bg-blue-500/20 text-blue-400',
    canceled: 'bg-red-500/20 text-red-400',
    past_due: 'bg-amber-500/20 text-amber-400',
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/admin/users"
          className="p-2 bg-zinc-800 rounded-lg hover:bg-zinc-700 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 text-white" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">{user.full_name || 'Unknown User'}</h1>
          <p className="text-zinc-400">{user.email}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Account Info */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Account Information</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b border-zinc-800">
                <span className="text-zinc-400">User ID</span>
                <span className="text-white font-mono text-sm">{user.id}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-zinc-800">
                <span className="text-zinc-400">Email</span>
                <span className="text-white">{user.email}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-zinc-800">
                <span className="text-zinc-400">Joined</span>
                <span className="text-white">
                  {new Date(user.created_at).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-zinc-400">Subscription</span>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  statusColors[user.subscription_status || ''] || 'bg-zinc-700 text-zinc-400'
                }`}>
                  {user.subscription_status || 'none'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Stats */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Stats</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <FileText className="h-4 w-4 text-purple-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{user.transaction_count}</p>
                  <p className="text-xs text-zinc-400">Transactions</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${user.bank_connected ? 'bg-green-500/20' : 'bg-zinc-700'}`}>
                  <Building2 className={`h-4 w-4 ${user.bank_connected ? 'text-green-500' : 'text-zinc-500'}`} />
                </div>
                <div>
                  <p className="text-white font-medium">
                    {user.bank_connected ? 'Connected' : 'Not Connected'}
                  </p>
                  <p className="text-xs text-zinc-400">Bank Status</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <CreditCard className="h-4 w-4 text-blue-500" />
                </div>
                <div>
                  <p className="text-white font-medium capitalize">
                    {user.subscription_plan || 'None'}
                  </p>
                  <p className="text-xs text-zinc-400">Plan</p>
                </div>
              </div>
              {user.trial_ends_at && (
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-500/20 rounded-lg">
                    <Calendar className="h-4 w-4 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-white font-medium">
                      {new Date(user.trial_ends_at).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </p>
                    <p className="text-xs text-zinc-400">Trial Ends</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
