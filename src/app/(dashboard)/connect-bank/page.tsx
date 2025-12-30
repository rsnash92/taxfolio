'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ConnectBankButton, BankAccountsList } from '@/components/bank'
import { CheckCircle2, AlertCircle, Loader2, Shield } from 'lucide-react'

interface BankAccount {
  id: string
  account_name: string
  account_type: string
  currency: string
  balance: number | null
  connection_id: string
}

interface BankConnection {
  id: string
  bank_name: string
  status: string
  last_synced_at: string | null
  consent_expires_at: string | null
}

export default function ConnectBankPage() {
  const searchParams = useSearchParams()
  const success = searchParams.get('success')
  const error = searchParams.get('error')

  const [accounts, setAccounts] = useState<BankAccount[]>([])
  const [connections, setConnections] = useState<BankConnection[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [syncError, setSyncError] = useState<string | null>(null)

  const fetchAccounts = useCallback(async () => {
    try {
      const response = await fetch('/api/truelayer/accounts')
      if (!response.ok) throw new Error('Failed to fetch accounts')
      const data = await response.json()
      setAccounts(data.accounts || [])
      setConnections(data.connections || [])
    } catch (err) {
      console.error('Failed to fetch accounts:', err)
      setSyncError('Failed to load accounts')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAccounts()
  }, [fetchAccounts])

  const handleRefresh = async () => {
    setSyncError(null)
    try {
      const response = await fetch('/api/truelayer/accounts', { method: 'POST' })
      if (!response.ok) throw new Error('Failed to refresh accounts')
      const data = await response.json()
      setAccounts(data.accounts || [])
      await fetchAccounts() // Refresh connections too
    } catch (err) {
      console.error('Failed to refresh:', err)
      setSyncError('Failed to refresh accounts')
    }
  }

  const handleDisconnect = async (connectionId: string) => {
    try {
      const response = await fetch('/api/truelayer/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectionId }),
      })
      if (!response.ok) throw new Error('Failed to disconnect')
      await fetchAccounts()
    } catch (err) {
      console.error('Failed to disconnect:', err)
      setSyncError('Failed to disconnect bank')
    }
  }

  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Connect Your Bank</h1>
        <p className="text-muted-foreground mt-2">
          Securely connect your UK bank account to automatically import transactions for tax
          calculations.
        </p>
      </div>

      {success && (
        <Alert className="mb-6 border-green-200 bg-green-50 text-green-800">
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>
            Bank connected successfully! Your accounts have been synced.
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{decodeURIComponent(error)}</AlertDescription>
        </Alert>
      )}

      {syncError && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{syncError}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Open Banking</CardTitle>
            <CardDescription>
              We use Open Banking to securely connect to your bank. This is regulated by the FCA and
              your data is protected.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-4 mb-6 p-4 bg-muted/50 rounded-lg">
              <Shield className="h-5 w-5 text-primary mt-0.5" />
              <div className="text-sm">
                <p className="font-medium mb-1">Your data is secure</p>
                <ul className="text-muted-foreground space-y-1">
                  <li>• We never store your bank login credentials</li>
                  <li>• Read-only access - we cannot make payments</li>
                  <li>• You can disconnect at any time</li>
                  <li>• Regulated by the Financial Conduct Authority</li>
                </ul>
              </div>
            </div>
            <ConnectBankButton size="lg" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Connected Accounts</CardTitle>
            <CardDescription>
              Manage your connected bank accounts and view sync status.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <BankAccountsList
                accounts={accounts}
                connections={connections}
                onRefresh={handleRefresh}
                onDisconnect={handleDisconnect}
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>How it works</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-4">
              <li className="flex gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                  1
                </span>
                <div>
                  <p className="font-medium">Connect your bank</p>
                  <p className="text-sm text-muted-foreground">
                    Click the button above and select your bank. You&apos;ll be redirected to your
                    bank&apos;s secure login page.
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                  2
                </span>
                <div>
                  <p className="font-medium">Authorise access</p>
                  <p className="text-sm text-muted-foreground">
                    Log in to your bank and approve read-only access to your transaction history.
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                  3
                </span>
                <div>
                  <p className="font-medium">Automatic sync</p>
                  <p className="text-sm text-muted-foreground">
                    We&apos;ll import your transactions and categorise them for tax purposes. The
                    connection lasts 90 days before requiring re-authorisation.
                  </p>
                </div>
              </li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
