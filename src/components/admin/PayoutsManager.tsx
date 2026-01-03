'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react'
import { toast } from 'sonner'

interface Payout {
  id: string
  user_id: string
  amount: number
  status: 'pending' | 'processing' | 'completed' | 'failed'
  account_holder_name: string
  sort_code: string
  account_number: string
  requested_at: string
  processed_at?: string
  failure_reason?: string
  user?: {
    email: string
    full_name: string
  }
}

interface PayoutsManagerProps {
  pendingPayouts: Payout[]
  recentPayouts: Payout[]
}

export function PayoutsManager({ pendingPayouts: initialPending, recentPayouts: initialRecent }: PayoutsManagerProps) {
  const [pendingPayouts, setPendingPayouts] = useState(initialPending)
  const [recentPayouts, setRecentPayouts] = useState(initialRecent)
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set())

  const formatSortCode = (code: string) => {
    return `${code.slice(0, 2)}-${code.slice(2, 4)}-${code.slice(4, 6)}`
  }

  const formatAccountNumber = (num: string) => {
    return `****${num.slice(-4)}`
  }

  const handleUpdateStatus = async (payoutId: string, newStatus: 'processing' | 'completed' | 'failed', failureReason?: string) => {
    setProcessingIds(prev => new Set(prev).add(payoutId))

    try {
      const response = await fetch('/api/admin/referrals/payout', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payoutId,
          status: newStatus,
          failureReason,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update payout')
      }

      // Update local state
      const updatedPayout = pendingPayouts.find(p => p.id === payoutId)
      if (updatedPayout) {
        updatedPayout.status = newStatus
        updatedPayout.processed_at = new Date().toISOString()
        if (failureReason) updatedPayout.failure_reason = failureReason

        if (newStatus === 'completed' || newStatus === 'failed') {
          setPendingPayouts(prev => prev.filter(p => p.id !== payoutId))
          setRecentPayouts(prev => [updatedPayout, ...prev].slice(0, 20))
        } else {
          setPendingPayouts(prev => prev.map(p => p.id === payoutId ? { ...p, status: newStatus } : p))
        }
      }

      toast.success(`Payout ${newStatus === 'completed' ? 'marked as completed' : newStatus === 'failed' ? 'marked as failed' : 'set to processing'}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update payout')
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev)
        next.delete(payoutId)
        return next
      })
    }
  }

  const handleMarkFailed = (payoutId: string) => {
    const reason = window.prompt('Enter failure reason:')
    if (reason) {
      handleUpdateStatus(payoutId, 'failed', reason)
    }
  }

  return (
    <div className="space-y-6">
      {/* Pending Payouts */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Pending Payouts</h2>
          {pendingPayouts.length > 0 && (
            <span className="px-2 py-1 bg-yellow-500/20 text-yellow-500 text-xs font-medium rounded-full">
              {pendingPayouts.length} awaiting action
            </span>
          )}
        </div>

        {pendingPayouts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-zinc-500 border-b border-zinc-800">
                  <th className="pb-3 font-medium">User</th>
                  <th className="pb-3 font-medium">Amount</th>
                  <th className="pb-3 font-medium">Bank Details</th>
                  <th className="pb-3 font-medium">Requested</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {pendingPayouts.map((payout) => (
                  <tr key={payout.id} className="border-b border-zinc-800 last:border-0">
                    <td className="py-4">
                      <p className="text-white">{payout.user?.full_name || 'Unknown'}</p>
                      <p className="text-zinc-500 text-xs">{payout.user?.email}</p>
                    </td>
                    <td className="py-4">
                      <span className="text-white font-medium">£{payout.amount}</span>
                    </td>
                    <td className="py-4">
                      <p className="text-white text-xs">{payout.account_holder_name}</p>
                      <p className="text-zinc-500 text-xs">
                        {formatSortCode(payout.sort_code)} | {formatAccountNumber(payout.account_number)}
                      </p>
                    </td>
                    <td className="py-4 text-zinc-400">
                      {new Date(payout.requested_at).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${
                        payout.status === 'pending'
                          ? 'bg-yellow-500/20 text-yellow-500'
                          : 'bg-blue-500/20 text-blue-500'
                      }`}>
                        {payout.status === 'pending' ? (
                          <Clock className="h-3 w-3" />
                        ) : (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        )}
                        {payout.status}
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {payout.status === 'pending' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-blue-500 border-blue-500/30 hover:bg-blue-500/10"
                            onClick={() => handleUpdateStatus(payout.id, 'processing')}
                            disabled={processingIds.has(payout.id)}
                          >
                            {processingIds.has(payout.id) ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              'Start Processing'
                            )}
                          </Button>
                        )}
                        {payout.status === 'processing' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-500 border-green-500/30 hover:bg-green-500/10"
                              onClick={() => handleUpdateStatus(payout.id, 'completed')}
                              disabled={processingIds.has(payout.id)}
                            >
                              {processingIds.has(payout.id) ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Complete
                                </>
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-500 border-red-500/30 hover:bg-red-500/10"
                              onClick={() => handleMarkFailed(payout.id)}
                              disabled={processingIds.has(payout.id)}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Failed
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <p className="text-zinc-400">No pending payouts</p>
          </div>
        )}
      </div>

      {/* Recent Payouts */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Recent Payouts</h2>

        {recentPayouts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-zinc-500 border-b border-zinc-800">
                  <th className="pb-3 font-medium">User</th>
                  <th className="pb-3 font-medium">Amount</th>
                  <th className="pb-3 font-medium">Processed</th>
                  <th className="pb-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {recentPayouts.map((payout) => (
                  <tr key={payout.id} className="border-b border-zinc-800 last:border-0">
                    <td className="py-3">
                      <p className="text-white">{payout.user?.full_name || 'Unknown'}</p>
                      <p className="text-zinc-500 text-xs">{payout.user?.email}</p>
                    </td>
                    <td className="py-3">
                      <span className="text-white">£{payout.amount}</span>
                    </td>
                    <td className="py-3 text-zinc-400">
                      {payout.processed_at
                        ? new Date(payout.processed_at).toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })
                        : '-'}
                    </td>
                    <td className="py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${
                        payout.status === 'completed'
                          ? 'bg-green-500/20 text-green-500'
                          : 'bg-red-500/20 text-red-500'
                      }`}>
                        {payout.status === 'completed' ? (
                          <CheckCircle className="h-3 w-3" />
                        ) : (
                          <XCircle className="h-3 w-3" />
                        )}
                        {payout.status}
                      </span>
                      {payout.failure_reason && (
                        <p className="text-red-400 text-xs mt-1">{payout.failure_reason}</p>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-zinc-500 text-sm text-center py-4">No processed payouts yet</p>
        )}
      </div>
    </div>
  )
}
