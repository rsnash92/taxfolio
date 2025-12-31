import Link from 'next/link'
import { Building2, ChevronRight } from 'lucide-react'

interface User {
  id: string
  email: string
  created_at: string
  full_name: string | null
  subscription_status: string | null
  subscription_plan: string | null
  transaction_count: number
  bank_connected: boolean
}

interface UsersTableProps {
  users: User[]
}

const statusColors: Record<string, string> = {
  active: 'bg-green-500/20 text-green-400',
  trialing: 'bg-blue-500/20 text-blue-400',
  canceled: 'bg-red-500/20 text-red-400',
  past_due: 'bg-amber-500/20 text-amber-400',
  incomplete: 'bg-zinc-500/20 text-zinc-400',
}

export function UsersTable({ users }: UsersTableProps) {
  if (users.length === 0) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center text-zinc-500">
        No users found
      </div>
    )
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-zinc-800">
            <th className="text-left px-4 py-3 text-sm font-medium text-zinc-400">User</th>
            <th className="text-left px-4 py-3 text-sm font-medium text-zinc-400">Status</th>
            <th className="text-left px-4 py-3 text-sm font-medium text-zinc-400">Plan</th>
            <th className="text-left px-4 py-3 text-sm font-medium text-zinc-400">Transactions</th>
            <th className="text-left px-4 py-3 text-sm font-medium text-zinc-400">Bank</th>
            <th className="text-left px-4 py-3 text-sm font-medium text-zinc-400">Joined</th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className="border-b border-zinc-800 hover:bg-zinc-800/50">
              <td className="px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-white">
                    {user.full_name || 'Unknown'}
                  </p>
                  <p className="text-xs text-zinc-500">{user.email || user.id.slice(0, 8)}</p>
                </div>
              </td>
              <td className="px-4 py-3">
                <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                  statusColors[user.subscription_status || 'incomplete']
                }`}>
                  {user.subscription_status || 'none'}
                </span>
              </td>
              <td className="px-4 py-3 text-sm text-zinc-300">
                {user.subscription_plan || '-'}
              </td>
              <td className="px-4 py-3 text-sm text-zinc-300">
                {user.transaction_count}
              </td>
              <td className="px-4 py-3">
                {user.bank_connected ? (
                  <Building2 className="h-4 w-4 text-green-500" />
                ) : (
                  <span className="text-zinc-600">-</span>
                )}
              </td>
              <td className="px-4 py-3 text-sm text-zinc-500">
                {new Date(user.created_at).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </td>
              <td className="px-4 py-3">
                <Link
                  href={`/admin/users/${user.id}`}
                  className="p-1 hover:bg-zinc-700 rounded transition-colors inline-block"
                >
                  <ChevronRight className="h-4 w-4 text-zinc-400" />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
