"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { toast } from "sonner"
import {
  Building2,
  CheckCircle2,
  XCircle,
  ExternalLink,
  RefreshCw,
  AlertTriangle,
  Clock,
  Shield,
  TestTube,
  Copy,
} from "lucide-react"
import Link from "next/link"

interface HMRCStatus {
  connected: boolean
  expiresAt: string | null
  scope: string | null
}

interface TestUser {
  userId: string
  password: string
  userFullName: string
  emailAddress: string
  nino: string
  mtdItId: string
}

export default function HMRCSettingsPage() {
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<HMRCStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [disconnecting, setDisconnecting] = useState(false)
  const [creatingTestUser, setCreatingTestUser] = useState(false)
  const [testUser, setTestUser] = useState<TestUser | null>(null)

  const isSandbox = process.env.NEXT_PUBLIC_HMRC_SANDBOX === 'true' ||
    typeof window !== 'undefined' && window.location.hostname === 'localhost'

  useEffect(() => {
    // Handle redirect params
    const success = searchParams.get('success')
    const error = searchParams.get('error')

    if (success === 'true') {
      toast.success('HMRC account connected successfully')
    } else if (error) {
      toast.error(`Failed to connect: ${error}`)
    }

    fetchStatus()
  }, [searchParams])

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/hmrc/status')
      if (res.ok) {
        const data = await res.json()
        setStatus(data)
      }
    } catch (error) {
      console.error('Failed to fetch HMRC status:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleConnect = () => {
    window.location.href = '/api/hmrc/auth'
  }

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect your HMRC account? You will need to reconnect to submit tax returns.')) {
      return
    }

    setDisconnecting(true)
    try {
      const res = await fetch('/api/hmrc/disconnect', { method: 'POST' })
      if (res.ok) {
        toast.success('HMRC account disconnected')
        setStatus({ connected: false, expiresAt: null, scope: null })
      } else {
        toast.error('Failed to disconnect')
      }
    } catch (error) {
      console.error('Failed to disconnect:', error)
      toast.error('Failed to disconnect')
    } finally {
      setDisconnecting(false)
    }
  }

  const handleCreateTestUser = async () => {
    setCreatingTestUser(true)
    try {
      const res = await fetch('/api/hmrc/test-user', { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        setTestUser(data)
        toast.success('Test user created and NINO saved to your profile')
      } else {
        const error = await res.json()
        toast.error(error.error || 'Failed to create test user')
      }
    } catch (error) {
      console.error('Failed to create test user:', error)
      toast.error('Failed to create test user')
    } finally {
      setCreatingTestUser(false)
    }
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copied to clipboard`)
  }

  const formatExpiry = (expiresAt: string | null) => {
    if (!expiresAt) return 'Unknown'
    const date = new Date(expiresAt)
    const now = new Date()
    const diffMs = date.getTime() - now.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 0) return 'Expired'
    if (diffMins < 60) return `${diffMins} minutes`
    const diffHours = Math.floor(diffMins / 60)
    return `${diffHours} hour${diffHours > 1 ? 's' : ''}`
  }

  const isExpiringSoon = (expiresAt: string | null) => {
    if (!expiresAt) return false
    const date = new Date(expiresAt)
    const now = new Date()
    const diffMs = date.getTime() - now.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    return diffMins < 30
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Link href="/settings" className="text-muted-foreground hover:text-foreground">
          Settings
        </Link>
        <span className="text-muted-foreground">/</span>
        <span>HMRC Connection</span>
      </div>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">HMRC Connection</h1>
        <p className="text-muted-foreground">
          Connect your Government Gateway account to submit Self Assessment returns
        </p>
      </div>

      {/* Sandbox Mode Alert */}
      {isSandbox && (
        <Alert>
          <TestTube className="h-4 w-4" />
          <AlertTitle>Sandbox Mode</AlertTitle>
          <AlertDescription>
            You&apos;re using the HMRC sandbox environment. No real tax data will be submitted.
            Create a test user below to test the connection.
          </AlertDescription>
        </Alert>
      )}

      {/* Connection Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Building2 className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <CardTitle>Government Gateway</CardTitle>
              <CardDescription>
                Connect to HMRC Making Tax Digital
              </CardDescription>
            </div>
            {!loading && (
              <Badge variant={status?.connected ? "default" : "secondary"}>
                {status?.connected ? (
                  <><CheckCircle2 className="h-3 w-3 mr-1" /> Connected</>
                ) : (
                  <><XCircle className="h-3 w-3 mr-1" /> Not connected</>
                )}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <RefreshCw className="h-4 w-4 animate-spin" />
              Checking connection status...
            </div>
          ) : status?.connected ? (
            <>
              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Token expires in:</span>
                  </div>
                  <Badge variant={isExpiringSoon(status.expiresAt) ? "destructive" : "outline"}>
                    {formatExpiry(status.expiresAt)}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Permissions:</span>
                  </div>
                  <span className="text-sm">Read & Write Self Assessment</span>
                </div>
              </div>

              {isExpiringSoon(status.expiresAt) && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Token expiring soon</AlertTitle>
                  <AlertDescription>
                    Your connection will expire soon. Reconnect to continue using HMRC features.
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2">
                <Button onClick={handleConnect} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reconnect
                </Button>
                <Button
                  onClick={handleDisconnect}
                  variant="destructive"
                  disabled={disconnecting}
                >
                  {disconnecting ? 'Disconnecting...' : 'Disconnect'}
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Connect your Government Gateway account to:
              </p>
              <ul className="text-sm space-y-2 ml-4">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Submit self-employment income (SA103)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Submit property income (SA105)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  View tax calculations
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Check submission deadlines
                </li>
              </ul>

              <Button onClick={handleConnect} className="mt-4">
                <ExternalLink className="h-4 w-4 mr-2" />
                Connect Government Gateway
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Test User Creation (Sandbox only) */}
      {isSandbox && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-amber-500/10 rounded-lg flex items-center justify-center">
                <TestTube className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <CardTitle>Test User</CardTitle>
                <CardDescription>
                  Create a test user for the HMRC sandbox
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {testUser ? (
              <>
                <Alert>
                  <AlertTitle>Test User Created</AlertTitle>
                  <AlertDescription>
                    Use these credentials when connecting to Government Gateway
                  </AlertDescription>
                </Alert>
                <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                  {[
                    { label: 'User ID', value: testUser.userId },
                    { label: 'Password', value: testUser.password },
                    { label: 'Name', value: testUser.userFullName },
                    { label: 'NINO', value: testUser.nino },
                    { label: 'MTD IT ID', value: testUser.mtdItId },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{item.label}:</span>
                      <div className="flex items-center gap-2">
                        <code className="text-sm bg-background px-2 py-1 rounded">
                          {item.value}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(item.value, item.label)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                <Separator />
                <Button
                  variant="outline"
                  onClick={handleCreateTestUser}
                  disabled={creatingTestUser}
                >
                  {creatingTestUser ? (
                    <><RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Creating...</>
                  ) : (
                    'Create New Test User'
                  )}
                </Button>
              </>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  Create a test individual with MTD enrollment. You&apos;ll receive credentials
                  to use when connecting to Government Gateway in sandbox mode.
                </p>
                <Button
                  onClick={handleCreateTestUser}
                  disabled={creatingTestUser}
                  variant="outline"
                >
                  {creatingTestUser ? (
                    <><RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Creating...</>
                  ) : (
                    <><TestTube className="h-4 w-4 mr-2" /> Create Test User</>
                  )}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">About HMRC Connection</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            TaxFolio connects to HMRC&apos;s Making Tax Digital (MTD) APIs to submit your
            Self Assessment information directly to HMRC.
          </p>
          <p>
            Your connection is secured using OAuth 2.0 and tokens are stored encrypted.
            HMRC requires certain fraud prevention headers which we collect to comply
            with their API requirements.
          </p>
          <p>
            You can disconnect at any time and your tax data in TaxFolio will be preserved.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
