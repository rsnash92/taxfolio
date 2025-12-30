'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MFAEnrollment } from './MFAEnrollment'
import { MFADisable } from './MFADisable'
import { Loader2 } from 'lucide-react'

interface Factor {
  id: string
  status: string
  friendly_name?: string
}

export function MFASection() {
  const [loading, setLoading] = useState(true)
  const [enabled, setEnabled] = useState(false)
  const [factors, setFactors] = useState<Factor[]>([])

  useEffect(() => {
    async function checkMFAStatus() {
      const supabase = createClient()
      const { data, error } = await supabase.auth.mfa.listFactors()

      if (!error && data) {
        const totp = data.totp || []
        const verified = totp.filter(factor => factor.status === 'verified')
        setEnabled(verified.length > 0)
        setFactors(verified)
      }
      setLoading(false)
    }

    checkMFAStatus()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
      </div>
    )
  }

  if (enabled && factors.length > 0) {
    return (
      <div>
        <div className="flex items-center gap-2 mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
          <div className="h-2 w-2 bg-green-500 rounded-full" />
          <span className="text-green-400 text-sm font-medium">
            Two-factor authentication is enabled
          </span>
        </div>
        <MFADisable factorId={factors[0].id} />
      </div>
    )
  }

  return <MFAEnrollment />
}
