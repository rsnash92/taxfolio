'use client'

import { useState } from 'react'
import { disableMFA } from '@/lib/mfa'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ShieldOff, Loader2, AlertTriangle } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface MFADisableProps {
  factorId: string
}

export function MFADisable({ factorId }: MFADisableProps) {
  const router = useRouter()
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmText, setConfirmText] = useState('')

  const handleDisable = async () => {
    if (confirmText !== 'DISABLE') return

    setLoading(true)
    setError(null)

    try {
      await disableMFA(factorId)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disable MFA')
    } finally {
      setLoading(false)
    }
  }

  if (!showConfirm) {
    return (
      <Button
        variant="outline"
        onClick={() => setShowConfirm(true)}
        className="text-red-400 border-red-400/30 hover:bg-red-400/10"
      >
        <ShieldOff className="h-4 w-4 mr-2" />
        Disable Two-Factor Authentication
      </Button>
    )
  }

  return (
    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
      <div className="flex items-start gap-3 mb-4">
        <AlertTriangle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-red-400">
            Are you sure you want to disable 2FA?
          </p>
          <p className="text-sm text-red-300/70 mt-1">
            This will make your account less secure. You&apos;ll only need your
            password to sign in.
          </p>
        </div>
      </div>

      <div className="mb-4">
        <label className="text-sm text-zinc-400 block mb-2">
          Type <strong className="text-white">DISABLE</strong> to confirm:
        </label>
        <Input
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
          placeholder="DISABLE"
          className="max-w-[200px]"
        />
      </div>

      {error && (
        <p className="text-red-400 text-sm mb-4">{error}</p>
      )}

      <div className="flex gap-3">
        <Button variant="outline" onClick={() => setShowConfirm(false)}>
          Cancel
        </Button>
        <Button
          variant="destructive"
          onClick={handleDisable}
          disabled={loading || confirmText !== 'DISABLE'}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : null}
          Disable 2FA
        </Button>
      </div>
    </div>
  )
}
