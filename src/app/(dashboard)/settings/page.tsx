"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { User, Shield, Bell, ChevronRight, FileText, Building2, LayoutGrid, Landmark, RefreshCw, Unlink, Loader2 } from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"

export default function SettingsPage() {
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [showProperties, setShowProperties] = useState<boolean | null>(null)
  const [userType, setUserType] = useState<string>("")
  const [bankConnection, setBankConnection] = useState<{
    id: string
    bank_name: string
    last_synced_at: string | null
    accounts: { id: string; account_id: string; display_name: string; account_type: string; is_visible: boolean }[]
  } | null>(null)
  const [bankLoading, setBankLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)
  const supabase = createClient()
  const router = useRouter()
  const searchParams = useSearchParams()

  const loadBankConnection = async () => {
    setBankLoading(true)
    try {
      const res = await fetch("/api/truelayer/connections")
      const data = await res.json()
      if (data.connected && data.connections?.length > 0) {
        const conn = data.connections[0]
        setBankConnection({
          id: conn.id,
          bank_name: conn.bank_name,
          last_synced_at: conn.last_synced_at,
          accounts: conn.accounts || [],
        })
      } else {
        setBankConnection(null)
      }
    } catch {
      setBankConnection(null)
    } finally {
      setBankLoading(false)
    }
  }

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setEmail(user.email || "")
        setFullName(user.user_metadata?.full_name || "")

        // Load user settings from database
        const { data: userData } = await supabase
          .from("users")
          .select("user_type, show_properties")
          .eq("id", user.id)
          .single()

        if (userData) {
          setUserType(userData.user_type || "sole_trader")
          // If show_properties is null, default based on user type
          const defaultShow = userData.user_type === "landlord" || userData.user_type === "both"
          setShowProperties(userData.show_properties ?? defaultShow)
        }
      }
    }
    loadUser()
    loadBankConnection()
  }, [supabase])

  // Handle ?bank_connected=true from OAuth redirect
  useEffect(() => {
    if (searchParams.get("bank_connected") === "true") {
      toast.success("Bank connected successfully")
      loadBankConnection()
      // Clean URL
      window.history.replaceState({}, "", "/settings")
    }
  }, [searchParams])

  const handleUpdateProfile = async () => {
    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: fullName },
      })

      if (error) {
        toast.error(error.message)
      } else {
        toast.success("Profile updated")
      }
    } catch {
      toast.error("Failed to update profile")
    } finally {
      setLoading(false)
    }
  }

  const handleSyncBank = async () => {
    setSyncing(true)
    try {
      const res = await fetch("/api/truelayer/sync", { method: "POST" })
      const data = await res.json()
      if (data.error) {
        toast.error(data.error)
      } else {
        toast.success(`Synced ${data.synced} transactions`)
        if (data.errors?.length > 0) {
          toast.warning(data.errors[0])
        }
        loadBankConnection()
      }
    } catch {
      toast.error("Sync failed")
    } finally {
      setSyncing(false)
    }
  }

  const handleDisconnectBank = async () => {
    if (!bankConnection) return
    setDisconnecting(true)
    try {
      const res = await fetch(`/api/truelayer/connections/${bankConnection.id}`, {
        method: "DELETE",
      })
      const data = await res.json()
      if (data.ok) {
        setBankConnection(null)
        toast.success("Bank disconnected")
      } else {
        toast.error(data.error || "Failed to disconnect")
      }
    } catch {
      toast.error("Failed to disconnect")
    } finally {
      setDisconnecting(false)
    }
  }

  const handleToggleAccount = async (accountId: string, currentVisible: boolean) => {
    if (!bankConnection) return
    // Optimistic update
    setBankConnection({
      ...bankConnection,
      accounts: bankConnection.accounts.map((a) =>
        a.id === accountId ? { ...a, is_visible: !currentVisible } : a
      ),
    })
    try {
      const res = await fetch(`/api/truelayer/accounts/${accountId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_visible: !currentVisible }),
      })
      const data = await res.json()
      if (!data.ok) {
        // Revert on failure
        setBankConnection({
          ...bankConnection,
          accounts: bankConnection.accounts.map((a) =>
            a.id === accountId ? { ...a, is_visible: currentVisible } : a
          ),
        })
        toast.error("Failed to update account")
      }
    } catch {
      setBankConnection({
        ...bankConnection,
        accounts: bankConnection.accounts.map((a) =>
          a.id === accountId ? { ...a, is_visible: currentVisible } : a
        ),
      })
      toast.error("Failed to update account")
    }
  }

  const handleConnectBank = () => {
    document.cookie = "settings-context=bank; path=/; max-age=600"
    window.location.href = "/api/truelayer/auth/authorize"
  }

  const handleToggleProperties = async (checked: boolean) => {
    setShowProperties(checked)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from("users")
        .update({ show_properties: checked })
        .eq("id", user.id)

      if (error) {
        toast.error("Failed to update setting")
        setShowProperties(!checked) // Revert on error
      } else {
        toast.success(checked ? "Property tracking enabled" : "Property tracking disabled")
        router.refresh() // Refresh to update sidebar
      }
    } catch {
      toast.error("Failed to update setting")
      setShowProperties(!checked)
    }
  }

  return (
    <div className="space-y-6">
      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <User className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>Profile</CardTitle>
              <CardDescription>Your personal information</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="John Smith"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              value={email}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              Contact support to change your email address
            </p>
          </div>
          <Button onClick={handleUpdateProfile} disabled={loading}>
            {loading ? "Saving..." : "Save changes"}
          </Button>
        </CardContent>
      </Card>

      {/* Features */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <LayoutGrid className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>Features</CardTitle>
              <CardDescription>Customise which features are visible</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Property tracking</p>
              <p className="text-sm text-muted-foreground">
                Track rental income and expenses for landlords
              </p>
            </div>
            <Switch
              checked={showProperties ?? false}
              onCheckedChange={handleToggleProperties}
              disabled={showProperties === null}
            />
          </div>
        </CardContent>
      </Card>

      {/* HMRC Connection */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>HMRC Connection</CardTitle>
              <CardDescription>Connect to Making Tax Digital</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Link href="/settings/hmrc" className="flex items-center justify-between hover:bg-muted/50 -mx-6 px-6 py-2 transition-colors">
            <div>
              <p className="font-medium">Government Gateway</p>
              <p className="text-sm text-muted-foreground">
                Submit Self Assessment returns directly to HMRC
              </p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </Link>
        </CardContent>
      </Card>

      {/* Bank Connection */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Landmark className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>Bank Connection</CardTitle>
              <CardDescription>Open Banking via TrueLayer</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {bankLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading...
            </div>
          ) : bankConnection ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{bankConnection.bank_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {bankConnection.accounts.length} account{bankConnection.accounts.length !== 1 ? "s" : ""} linked
                    {bankConnection.last_synced_at && (
                      <> &middot; Last synced {new Date(bankConnection.last_synced_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</>
                    )}
                  </p>
                </div>
                <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
                  Connected
                </Badge>
              </div>

              {bankConnection.accounts.length > 0 && (
                <div className="rounded-md border border-gray-100 bg-gray-50 p-3">
                  <p className="text-xs text-muted-foreground mb-2">Toggle which accounts to sync</p>
                  <ul className="space-y-2">
                    {bankConnection.accounts.map((acct) => (
                      <li key={acct.account_id} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={acct.is_visible}
                            onCheckedChange={() => handleToggleAccount(acct.id, acct.is_visible)}
                          />
                          <span className={acct.is_visible ? "font-medium text-gray-700" : "font-medium text-gray-400"}>{acct.display_name}</span>
                        </div>
                        <span className="text-xs text-muted-foreground capitalize">{acct.account_type.toLowerCase()}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSyncBank}
                  disabled={syncing}
                >
                  {syncing ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <RefreshCw className="h-4 w-4 mr-1.5" />}
                  {syncing ? "Syncing..." : "Sync Now"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDisconnectBank}
                  disabled={disconnecting}
                  className="text-destructive border-destructive/30 hover:bg-destructive/5"
                >
                  {disconnecting ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Unlink className="h-4 w-4 mr-1.5" />}
                  {disconnecting ? "Disconnecting..." : "Disconnect"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">No bank connected</p>
                <p className="text-sm text-muted-foreground">
                  Link your bank account to import transactions automatically
                </p>
              </div>
              <Button variant="outline" onClick={handleConnectBank}>
                Connect Bank
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>Security</CardTitle>
              <CardDescription>Manage your security settings</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Password</p>
              <p className="text-sm text-muted-foreground">
                Change your password
              </p>
            </div>
            <Button variant="outline" disabled>
              Change password
            </Button>
          </div>
          <Separator />
          <Link href="/settings/security" className="flex items-center justify-between hover:bg-muted/50 -mx-6 px-6 py-2 transition-colors">
            <div>
              <p className="font-medium">Two-factor authentication</p>
              <p className="text-sm text-muted-foreground">
                Add an extra layer of security
              </p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </Link>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>Email notification preferences</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Transaction sync alerts</p>
              <p className="text-sm text-muted-foreground">
                Get notified when new transactions are synced
              </p>
            </div>
            <Badge variant="secondary">Coming soon</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Legal */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>Legal</CardTitle>
              <CardDescription>Privacy and terms</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <a
            href="https://taxfolio.io/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between hover:bg-muted/50 -mx-6 px-6 py-2 transition-colors"
          >
            <div>
              <p className="font-medium">Privacy Policy</p>
              <p className="text-sm text-muted-foreground">
                How we handle your data
              </p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </a>
          <Separator />
          <a
            href="https://taxfolio.io/terms"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between hover:bg-muted/50 -mx-6 px-6 py-2 transition-colors"
          >
            <div>
              <p className="font-medium">Terms of Service</p>
              <p className="text-sm text-muted-foreground">
                Terms and conditions of use
              </p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </a>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>
            Irreversible actions that affect your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Delete all data</p>
              <p className="text-sm text-muted-foreground">
                Remove all your transactions and bank connections
              </p>
            </div>
            <Button variant="destructive" disabled>
              Delete data
            </Button>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Delete account</p>
              <p className="text-sm text-muted-foreground">
                Permanently delete your account and all data
              </p>
            </div>
            <Button variant="destructive" disabled>
              Delete account
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
