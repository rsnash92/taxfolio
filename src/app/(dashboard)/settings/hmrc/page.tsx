"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  FileText,
  ChevronDown,
  ChevronRight,
  Trash2,
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

interface ApiLogEntry {
  id: string
  timestamp: string
  method: string
  endpoint: string
  request_body?: unknown
  response_status: number
  response_body?: unknown
  error_code?: string
  error_message?: string
  duration_ms: number
  gov_test_scenario?: string
}

interface ErrorSummary {
  totalErrors: number
  errorsByCode: Record<string, number>
  recentErrors: ApiLogEntry[]
}

export default function HMRCSettingsPage() {
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<HMRCStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [disconnecting, setDisconnecting] = useState(false)
  const [creatingTestUser, setCreatingTestUser] = useState(false)
  const [testUser, setTestUser] = useState<TestUser | null>(null)

  // Logs state
  const [logs, setLogs] = useState<ApiLogEntry[]>([])
  const [logsLoading, setLogsLoading] = useState(false)
  const [errorSummary, setErrorSummary] = useState<ErrorSummary | null>(null)
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null)
  const [logFilter, setLogFilter] = useState<'all' | 'success' | 'error'>('all')

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

  const fetchLogs = async (filter: 'all' | 'success' | 'error' = 'all') => {
    setLogsLoading(true)
    try {
      const res = await fetch(`/api/hmrc/logs?status=${filter}&limit=50`)
      if (res.ok) {
        const data = await res.json()
        setLogs(data.logs || [])
      }
    } catch (error) {
      console.error('Failed to fetch logs:', error)
    } finally {
      setLogsLoading(false)
    }
  }

  const fetchErrorSummary = async () => {
    try {
      const res = await fetch('/api/hmrc/logs?summary=true')
      if (res.ok) {
        const data = await res.json()
        setErrorSummary(data)
      }
    } catch (error) {
      console.error('Failed to fetch error summary:', error)
    }
  }

  const clearOldLogs = async () => {
    if (!confirm('Clear logs older than 30 days?')) return

    try {
      const res = await fetch('/api/hmrc/logs?daysToKeep=30', { method: 'DELETE' })
      if (res.ok) {
        const data = await res.json()
        toast.success(`Cleared ${data.deleted} old log entries`)
        fetchLogs(logFilter)
      }
    } catch (error) {
      console.error('Failed to clear logs:', error)
      toast.error('Failed to clear logs')
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

  const formatTimestamp = (ts: string) => {
    return new Date(ts).toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  const getStatusBadge = (statusCode: number) => {
    if (statusCode >= 200 && statusCode < 300) {
      return <Badge variant="default" className="bg-green-500">{statusCode}</Badge>
    }
    if (statusCode >= 400 && statusCode < 500) {
      return <Badge variant="destructive">{statusCode}</Badge>
    }
    if (statusCode >= 500) {
      return <Badge variant="destructive">{statusCode}</Badge>
    }
    return <Badge variant="secondary">{statusCode}</Badge>
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

      <Tabs defaultValue="connection" className="space-y-4">
        <TabsList>
          <TabsTrigger value="connection">Connection</TabsTrigger>
          <TabsTrigger value="logs" onClick={() => { fetchLogs(logFilter); fetchErrorSummary(); }}>
            API Logs
          </TabsTrigger>
          {isSandbox && <TabsTrigger value="sandbox">Sandbox</TabsTrigger>}
        </TabsList>

        {/* Connection Tab */}
        <TabsContent value="connection" className="space-y-6">
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
        </TabsContent>

        {/* API Logs Tab */}
        <TabsContent value="logs" className="space-y-6">
          {/* Error Summary */}
          {errorSummary && errorSummary.totalErrors > 0 && (
            <Card className="border-destructive/50">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  <CardTitle className="text-base">Error Summary (Last 7 Days)</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(errorSummary.errorsByCode).map(([code, count]) => (
                    <Badge key={code} variant="destructive" className="text-xs">
                      {code}: {count}
                    </Badge>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {errorSummary.totalErrors} total errors
                </p>
              </CardContent>
            </Card>
          )}

          {/* Logs List */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  <CardTitle className="text-base">API Request Logs</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={logFilter}
                    onChange={(e) => {
                      const filter = e.target.value as 'all' | 'success' | 'error'
                      setLogFilter(filter)
                      fetchLogs(filter)
                    }}
                    className="text-sm border rounded-md px-2 py-1"
                  >
                    <option value="all">All</option>
                    <option value="success">Success</option>
                    <option value="error">Errors</option>
                  </select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchLogs(logFilter)}
                    disabled={logsLoading}
                  >
                    <RefreshCw className={`h-4 w-4 ${logsLoading ? 'animate-spin' : ''}`} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearOldLogs}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {logsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : logs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No API logs found</p>
                  <p className="text-sm">Logs will appear here after making HMRC API requests</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {logs.map((log) => (
                    <div
                      key={log.id}
                      className="border rounded-lg overflow-hidden"
                    >
                      <button
                        className="w-full px-4 py-3 flex items-center gap-4 hover:bg-muted/50 transition-colors text-left"
                        onClick={() => setExpandedLogId(expandedLogId === log.id ? null : log.id)}
                      >
                        {expandedLogId === log.id ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                        <Badge variant="outline" className="font-mono text-xs">
                          {log.method}
                        </Badge>
                        <span className="flex-1 font-mono text-sm truncate">
                          {log.endpoint}
                        </span>
                        {getStatusBadge(log.response_status)}
                        <span className="text-xs text-muted-foreground">
                          {log.duration_ms}ms
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatTimestamp(log.timestamp)}
                        </span>
                      </button>

                      {expandedLogId === log.id && (
                        <div className="border-t bg-muted/30 p-4 space-y-4">
                          {log.error_code && (
                            <div>
                              <p className="text-xs font-semibold text-destructive mb-1">Error</p>
                              <code className="text-xs text-destructive">
                                {log.error_code}: {log.error_message}
                              </code>
                            </div>
                          )}

                          {log.gov_test_scenario && (
                            <div>
                              <p className="text-xs font-semibold text-muted-foreground mb-1">
                                Gov-Test-Scenario
                              </p>
                              <code className="text-xs">{log.gov_test_scenario}</code>
                            </div>
                          )}

                          {log.request_body !== undefined && log.request_body !== null ? (
                            <div>
                              <p className="text-xs font-semibold text-muted-foreground mb-1">
                                Request Body
                              </p>
                              <pre className="text-xs bg-background p-2 rounded overflow-auto max-h-40">
                                {JSON.stringify(log.request_body, null, 2)}
                              </pre>
                            </div>
                          ) : null}

                          {log.response_body !== undefined && log.response_body !== null ? (
                            <div>
                              <p className="text-xs font-semibold text-muted-foreground mb-1">
                                Response Body
                              </p>
                              <pre className="text-xs bg-background p-2 rounded overflow-auto max-h-40">
                                {JSON.stringify(log.response_body, null, 2)}
                              </pre>
                            </div>
                          ) : null}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sandbox Tab */}
        {isSandbox && (
          <TabsContent value="sandbox" className="space-y-6">
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

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Sandbox Environment</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p>
                  The sandbox environment is a testing area where you can safely experiment
                  with HMRC API calls without affecting real tax data.
                </p>
                <p>
                  Test data created in the sandbox will persist for approximately 7 days.
                  Use the Gov-Test-Scenario header to trigger different response scenarios.
                </p>
                <p>
                  <a
                    href="https://developer.service.hmrc.gov.uk/api-documentation/docs/testing"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline inline-flex items-center gap-1"
                  >
                    HMRC Testing Documentation
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
