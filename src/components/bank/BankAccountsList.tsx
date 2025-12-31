'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Building2, RefreshCw, Trash2, Loader2, AlertCircle } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

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

interface BankAccountsListProps {
  accounts: BankAccount[]
  connections: BankConnection[]
  onRefresh: () => Promise<void>
  onDisconnect: (connectionId: string) => Promise<void>
}

export function BankAccountsList({
  accounts,
  connections,
  onRefresh,
  onDisconnect,
}: BankAccountsListProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await onRefresh()
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleDisconnect = async (connectionId: string) => {
    setDisconnectingId(connectionId)
    try {
      await onDisconnect(connectionId)
    } finally {
      setDisconnectingId(null)
    }
  }

  const getConnectionStatus = (connection: BankConnection) => {
    if (connection.status === 'expired') {
      return <Badge variant="destructive">Expired</Badge>
    }
    if (connection.consent_expires_at) {
      const expiresAt = new Date(connection.consent_expires_at)
      const daysUntilExpiry = Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      if (daysUntilExpiry <= 7) {
        return <Badge variant="secondary">Expires in {daysUntilExpiry} days</Badge>
      }
    }
    return <Badge variant="default">Active</Badge>
  }

  const getAccountsForConnection = (connectionId: string) => {
    return accounts.filter((a) => a.connection_id === connectionId)
  }

  if (connections.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-center">
            No bank accounts connected yet.
            <br />
            Connect your bank to automatically import transactions.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
          {isRefreshing ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          Refresh
        </Button>
      </div>

      {connections.map((connection) => {
        const connectionAccounts = getAccountsForConnection(connection.id)
        const isDisconnecting = disconnectingId === connection.id

        return (
          <Card key={connection.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Building2 className="h-5 w-5" />
                  <div>
                    <CardTitle className="text-lg">{connection.bank_name}</CardTitle>
                    <CardDescription>
                      {connection.last_synced_at
                        ? `Last synced ${new Date(connection.last_synced_at).toLocaleDateString()}`
                        : 'Never synced'}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getConnectionStatus(connection)}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" disabled={isDisconnecting}>
                        {isDisconnecting ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                          <AlertCircle className="h-5 w-5 text-destructive" />
                          Disconnect {connection.bank_name}?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="space-y-2">
                          <p>
                            This will remove the connection to your bank and <strong>permanently delete all transactions</strong> imported from this account.
                          </p>
                          <p className="text-destructive font-medium">
                            This action cannot be undone.
                          </p>
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDisconnect(connection.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete and disconnect
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {connection.status === 'expired' && (
                <div className="flex items-center gap-2 text-destructive mb-4 p-3 bg-destructive/10 rounded-md">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm">
                    Connection expired. Please reconnect to continue importing transactions.
                  </span>
                </div>
              )}
              {connectionAccounts.length > 0 ? (
                <div className="space-y-2">
                  {connectionAccounts.map((account) => (
                    <div
                      key={account.id}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-md"
                    >
                      <div>
                        <p className="font-medium">{account.account_name}</p>
                        <p className="text-sm text-muted-foreground capitalize">
                          {account.account_type.replace('_', ' ')}
                        </p>
                      </div>
                      {account.balance !== null && (
                        <p className="font-medium">
                          {formatCurrency(account.balance, account.currency)}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No accounts found</p>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
