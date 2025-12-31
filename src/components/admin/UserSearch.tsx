'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Search } from 'lucide-react'

interface UserSearchProps {
  currentSearch?: string
  currentStatus?: string
}

export function UserSearch({ currentSearch, currentStatus }: UserSearchProps) {
  const router = useRouter()
  const [search, setSearch] = useState(currentSearch || '')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (currentStatus) params.set('status', currentStatus)
    router.push(`/admin/users?${params.toString()}`)
  }

  const handleStatusChange = (status: string) => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (status) params.set('status', status)
    router.push(`/admin/users?${params.toString()}`)
  }

  return (
    <div className="flex items-center gap-4 mb-6">
      {/* Search */}
      <form onSubmit={handleSearch} className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users..."
            className="w-full pl-10 pr-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
          />
        </div>
      </form>

      {/* Status Filter */}
      <select
        value={currentStatus || ''}
        onChange={(e) => handleStatusChange(e.target.value)}
        className="px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-zinc-600"
      >
        <option value="">All statuses</option>
        <option value="trialing">Trialing</option>
        <option value="active">Active</option>
        <option value="canceled">Cancelled</option>
        <option value="past_due">Past Due</option>
      </select>
    </div>
  )
}
