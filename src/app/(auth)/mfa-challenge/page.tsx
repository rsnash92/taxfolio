'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { verifyMFALogin } from '@/lib/mfa'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Shield, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function MFAChallengePage() {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [factorId, setFactorId] = useState<string | null>(null)

  useEffect(() => {
    // Get the factor ID for the current user
    async function loadFactor() {
      const supabase = createClient()
      const { data } = await supabase.auth.mfa.listFactors()

      if (data?.totp && data.totp.length > 0) {
        const verified = data.totp.find(f => f.status === 'verified')
        if (verified) {
          setFactorId(verified.id)
        }
      }
    }

    loadFactor()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!factorId) return

    setLoading(true)
    setError(null)

    try {
      await verifyMFALogin(factorId, code)
      router.push('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid code')
      setCode('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Image
            src="/taxfolio.png"
            alt="TaxFolio"
            width={140}
            height={32}
            className="h-8 w-auto mx-auto mb-6"
          />
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/20 rounded-full mb-4">
            <Shield className="h-8 w-8 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            Two-Factor Authentication
          </h1>
          <p className="text-zinc-400">
            Enter the 6-digit code from your authenticator app
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <div className="mb-4">
            <Input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              className="text-center text-2xl tracking-widest font-mono"
              autoFocus
              disabled={loading}
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm mb-4 text-center">{error}</p>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={loading || code.length !== 6 || !factorId}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : null}
            Verify
          </Button>

          <div className="mt-4 text-center">
            <p className="text-sm text-zinc-500">
              Open your authenticator app to view your code
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}
