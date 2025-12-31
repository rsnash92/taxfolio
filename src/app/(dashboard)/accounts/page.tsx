"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { Building2, RefreshCw, Plus, Loader2, Upload, CheckCircle, AlertTriangle } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { CSVUploadDialog } from "@/components/csv-upload-dialog"

interface Account {
  id: string
  name: string
  official_name: string | null
  type: string
  subtype: string | null
  mask: string | null
  is_business_account: boolean
  current_balance: number | null
  available_balance: number | null
  currency: string
  bank_connections: {
    institution_name: string
    status: string
    last_synced_at: string | null
  }
}

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState<string | null>(null)
  const [syncProgress, setSyncProgress] = useState(0)
  const [syncStatus, setSyncStatus] = useState("")
  const [csvDialogOpen, setCsvDialogOpen] = useState(false)
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; accountId: string; accountName: string } | null>(null)

  const fetchAccounts = useCallback(async () => {
    try {
      const res = await fetch("/api/accounts")
      const data = await res.json()
      setAccounts(data.accounts || [])
    } catch {
      toast.error("Failed to fetch accounts")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAccounts()
  }, [fetchAccounts])

  const handleToggleBusiness = async (accountId: string, isBusiness: boolean, deleteTransactions: boolean = false) => {
    try {
      const res = await fetch("/api/accounts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          account_id: accountId,
          is_business_account: isBusiness,
          delete_transactions: deleteTransactions,
        }),
      })

      if (res.ok) {
        setAccounts((prev) =>
          prev.map((acc) =>
            acc.id === accountId ? { ...acc, is_business_account: isBusiness } : acc
          )
        )
        if (deleteTransactions) {
          toast.success("Account updated and transactions deleted")
        } else {
          toast.success(isBusiness ? "Marked as business account" : "Marked as personal account")
        }
      }
    } catch {
      toast.error("Failed to update account")
    }
  }

  const handleToggleWithConfirmation = (accountId: string, isBusiness: boolean) => {
    // If turning OFF business account, show confirmation dialog
    if (!isBusiness) {
      const account = accounts.find(a => a.id === accountId)
      setConfirmDialog({
        open: true,
        accountId,
        accountName: account?.name || 'this account',
      })
    } else {
      // Turning ON - no confirmation needed
      handleToggleBusiness(accountId, true)
    }
  }

  const handleConfirmRemoveBusinessAccount = () => {
    if (confirmDialog) {
      handleToggleBusiness(confirmDialog.accountId, false, true)
      setConfirmDialog(null)
    }
  }

  const handleSync = async () => {
    setSyncing("all")
    setSyncProgress(0)
    setSyncStatus("Connecting to bank...")

    // Simulate progress for better UX
    const progressInterval = setInterval(() => {
      setSyncProgress(prev => {
        if (prev >= 90) return prev
        return prev + Math.random() * 15
      })
    }, 500)

    try {
      setSyncStatus("Fetching transactions...")
      setSyncProgress(30)

      const res = await fetch("/api/truelayer/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })

      setSyncProgress(80)
      setSyncStatus("Processing transactions...")

      const data = await res.json()

      clearInterval(progressInterval)
      setSyncProgress(100)

      if (res.ok) {
        if (data.message) {
          // No business accounts to sync
          setSyncStatus(data.message)
          toast.info(data.message)
        } else {
          setSyncStatus(`Done! ${data.imported} new, ${data.skipped} already imported`)
          toast.success(`Synced ${data.imported} new transactions (${data.skipped} already imported)`)
        }
        fetchAccounts()
      } else {
        setSyncStatus("")
        toast.error(data.error || "Failed to sync")
      }
    } catch {
      clearInterval(progressInterval)
      setSyncStatus("")
      toast.error("Failed to sync transactions")
    } finally {
      // Keep progress visible briefly before hiding
      setTimeout(() => {
        setSyncing(null)
        setSyncProgress(0)
        setSyncStatus("")
      }, 2000)
    }
  }

  const handleConnectBank = () => {
    // Redirect to TrueLayer OAuth flow
    window.location.href = "/api/truelayer/auth"
  }

  const businessAccounts = accounts.filter((a) => a.is_business_account)
  const personalAccounts = accounts.filter((a) => !a.is_business_account)

  return (
    <div className="space-y-6">
      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-2">
        {accounts.length > 0 && (
          <Button variant="outline" onClick={handleSync} disabled={syncing === "all"}>
            {syncing === "all" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Sync Transactions
          </Button>
        )}
        <Button variant="outline" onClick={() => setCsvDialogOpen(true)}>
          <Upload className="mr-2 h-4 w-4" />
          Upload CSV
        </Button>
        <Button onClick={handleConnectBank}>
          <Plus className="mr-2 h-4 w-4" />
          Connect Bank
        </Button>
      </div>

      {/* Sync Progress */}
      {syncing && (
        <div className="p-4 bg-[#15e49e]/10 border border-[#15e49e]/30 rounded-xl">
          <div className="flex items-center gap-3 mb-3">
            <Loader2 className="h-5 w-5 text-[#15e49e] animate-spin" />
            <span className="font-medium text-[#15e49e]">{syncStatus}</span>
          </div>
          <Progress value={syncProgress} className="h-2" />
        </div>
      )}

      {/* Instructions */}
      <div className="p-5 bg-[#15e49e]/10 border border-[#15e49e]/30 rounded-xl">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-[#15e49e]/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <CheckCircle className="h-5 w-5 text-[#15e49e]" />
          </div>
          <div>
            <h3 className="font-medium text-[#15e49e]">Mark your business accounts</h3>
            <p className="text-sm text-muted-foreground">
              Toggle the switch next to each account to mark it as a business account.
              Only transactions from business accounts will be included in your tax calculations.
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <Card>
          <CardContent className="pt-6 space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
                <Skeleton className="h-6 w-12" />
              </div>
            ))}
          </CardContent>
        </Card>
      ) : accounts.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-medium mb-2">No accounts connected</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Connect your bank account to start tracking transactions
              </p>
              <Button onClick={handleConnectBank}>
                <Plus className="mr-2 h-4 w-4" />
                Connect Bank
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Business Accounts */}
          {businessAccounts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Business Accounts
                  <Badge>{businessAccounts.length}</Badge>
                </CardTitle>
                <CardDescription>
                  Transactions from these accounts are included in tax calculations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {businessAccounts.map((account) => (
                    <AccountRow
                      key={account.id}
                      account={account}
                      onToggle={handleToggleWithConfirmation}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Personal Accounts */}
          {personalAccounts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Personal Accounts
                  <Badge variant="secondary">{personalAccounts.length}</Badge>
                </CardTitle>
                <CardDescription>
                  These accounts are excluded from tax calculations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {personalAccounts.map((account) => (
                    <AccountRow
                      key={account.id}
                      account={account}
                      onToggle={handleToggleWithConfirmation}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* CSV Upload Dialog */}
      <CSVUploadDialog
        open={csvDialogOpen}
        onOpenChange={setCsvDialogOpen}
        onSuccess={fetchAccounts}
      />

      {/* Confirmation Dialog for removing business account */}
      <AlertDialog open={confirmDialog?.open ?? false} onOpenChange={(open) => !open && setConfirmDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Remove business account?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Removing <strong>{confirmDialog?.accountName}</strong> as a business account will <strong>permanently delete all transactions</strong> imported from this account.
              </p>
              <p className="text-destructive font-medium">
                This action cannot be undone.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmRemoveBusinessAccount}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete transactions
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function formatCurrency(amount: number | null, currency: string = 'GBP'): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '—'
  }
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: currency,
  }).format(amount)
}

function AccountRow({
  account,
  onToggle,
}: {
  account: Account
  onToggle: (id: string, isBusiness: boolean) => void
}) {
  return (
    <div className="flex items-center gap-4 p-4 border rounded-lg">
      <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
        <Building2 className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium truncate">{account.name}</p>
          <Badge variant="outline">{account.type}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {account.bank_connections.institution_name}
          {account.mask && <> •••• {account.mask}</>}
        </p>
        {account.bank_connections.last_synced_at && (
          <p className="text-xs text-muted-foreground">
            Last synced: {new Date(account.bank_connections.last_synced_at).toLocaleString()}
          </p>
        )}
      </div>
      <div className="text-right mr-4">
        <p className="font-medium">{formatCurrency(account.current_balance, account.currency)}</p>
        {account.available_balance !== null && account.available_balance !== account.current_balance && (
          <p className="text-xs text-muted-foreground">
            Available: {formatCurrency(account.available_balance, account.currency)}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Business</span>
        <Switch
          checked={account.is_business_account}
          onCheckedChange={(checked) => onToggle(account.id, checked)}
        />
      </div>
    </div>
  )
}
