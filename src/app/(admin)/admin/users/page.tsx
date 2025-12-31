import { getUsers } from '@/lib/admin/queries'
import { UsersTable } from '@/components/admin/UsersTable'
import { UserSearch } from '@/components/admin/UserSearch'
import Link from 'next/link'

interface PageProps {
  searchParams: Promise<{
    search?: string
    status?: string
    page?: string
  }>
}

export default async function UsersPage({ searchParams }: PageProps) {
  const params = await searchParams
  const page = parseInt(params.page || '1')
  const limit = 25
  const offset = (page - 1) * limit

  const { users, total } = await getUsers({
    limit,
    offset,
    search: params.search,
    status: params.status,
  })

  const totalPages = Math.ceil(total / limit)

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Users</h1>
          <p className="text-zinc-400">{total} total users</p>
        </div>
      </div>

      {/* Search & Filters */}
      <UserSearch
        currentSearch={params.search}
        currentStatus={params.status}
      />

      {/* Users Table */}
      <UsersTable users={users} />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <p className="text-sm text-zinc-400">
            Showing {offset + 1} to {Math.min(offset + limit, total)} of {total}
          </p>

          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={`/admin/users?page=${page - 1}${params.search ? `&search=${params.search}` : ''}${params.status ? `&status=${params.status}` : ''}`}
                className="px-3 py-1 bg-zinc-800 text-white rounded hover:bg-zinc-700"
              >
                Previous
              </Link>
            )}

            <span className="px-3 py-1 text-zinc-400">
              Page {page} of {totalPages}
            </span>

            {page < totalPages && (
              <Link
                href={`/admin/users?page=${page + 1}${params.search ? `&search=${params.search}` : ''}${params.status ? `&status=${params.status}` : ''}`}
                className="px-3 py-1 bg-zinc-800 text-white rounded hover:bg-zinc-700"
              >
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
