'use client'

import { useState } from 'react'
import { enrollMFA, verifyMFAEnrollment } from '@/lib/mfa'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { QrCode, Shield, Loader2, CheckCircle, Copy } from 'lucide-react'

type Step = 'intro' | 'qr' | 'verify' | 'complete'

export function MFAEnrollment() {
  const [step, setStep] = useState<Step>('intro')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Enrollment data
  const [factorId, setFactorId] = useState<string>('')
  const [qrCode, setQrCode] = useState<string>('')
  const [secret, setSecret] = useState<string>('')

  // Verification
  const [code, setCode] = useState('')
  const [copied, setCopied] = useState(false)

  const startEnrollment = async () => {
    setLoading(true)
    setError(null)

    try {
      const data = await enrollMFA()
      setFactorId(data.factorId)
      setQrCode(data.qrCode)
      setSecret(data.secret)
      setStep('qr')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start enrollment')
    } finally {
      setLoading(false)
    }
  }

  const copySecret = () => {
    navigator.clipboard.writeText(secret)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const verifyCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      await verifyMFAEnrollment(factorId, code)
      setStep('complete')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid code')
    } finally {
      setLoading(false)
    }
  }

  // Step 1: Introduction
  if (step === 'intro') {
    return (
      <div>
        <div className="space-y-4 mb-6">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-zinc-800 rounded-lg">
              <Shield className="h-5 w-5 text-green-400" />
            </div>
            <div>
              <p className="font-medium text-white">Enhanced security</p>
              <p className="text-sm text-zinc-400">
                Protect your account even if your password is compromised
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="p-2 bg-zinc-800 rounded-lg">
              <QrCode className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="font-medium text-white">Works with any authenticator app</p>
              <p className="text-sm text-zinc-400">
                Google Authenticator, Authy, 1Password, and more
              </p>
            </div>
          </div>
        </div>

        {error && (
          <p className="text-red-400 text-sm mb-4">{error}</p>
        )}

        <Button onClick={startEnrollment} disabled={loading}>
          {loading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Shield className="h-4 w-4 mr-2" />
          )}
          Enable Two-Factor Authentication
        </Button>
      </div>
    )
  }

  // Step 2: QR Code
  if (step === 'qr') {
    return (
      <div>
        <h3 className="font-medium text-white mb-4">
          1. Scan this QR code with your authenticator app
        </h3>

        <div className="bg-white p-4 rounded-lg inline-block mb-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrCode} alt="QR Code" className="w-48 h-48" />
        </div>

        <div className="mb-6">
          <p className="text-sm text-zinc-400 mb-2">
            Can&apos;t scan? Enter this code manually:
          </p>
          <div className="flex items-center gap-2">
            <code className="bg-zinc-800 px-3 py-2 rounded text-sm font-mono text-zinc-300 flex-1 break-all">
              {secret}
            </code>
            <Button
              variant="outline"
              size="sm"
              onClick={copySecret}
            >
              {copied ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        <Button onClick={() => setStep('verify')}>
          Continue
        </Button>
      </div>
    )
  }

  // Step 3: Verify
  if (step === 'verify') {
    return (
      <div>
        <h3 className="font-medium text-white mb-4">
          2. Enter the 6-digit code from your authenticator app
        </h3>

        <form onSubmit={verifyCode}>
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
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm mb-4">{error}</p>
          )}

          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={() => setStep('qr')}>
              Back
            </Button>
            <Button type="submit" disabled={loading || code.length !== 6}>
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              Verify & Enable
            </Button>
          </div>
        </form>
      </div>
    )
  }

  // Step 4: Complete
  if (step === 'complete') {
    return (
      <div className="text-center py-6">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/20 rounded-full mb-4">
          <Shield className="h-8 w-8 text-green-500" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">
          You&apos;re all set!
        </h3>
        <p className="text-zinc-400 mb-4">
          Your account is now protected with two-factor authentication.
          You&apos;ll need your authenticator app each time you sign in.
        </p>
        <Button onClick={() => window.location.reload()}>
          Done
        </Button>
      </div>
    )
  }

  return null
}
