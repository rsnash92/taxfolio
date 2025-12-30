"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { Loader2, Settings, CreditCard, Building2 } from "lucide-react"
import type { Partner } from "@/lib/partners/types"

export default function PartnerSettingsPage() {
  const router = useRouter()
  const [partner, setPartner] = useState<Partner | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({
    phone: "",
    website: "",
    payout_method: "bank_transfer" as "bank_transfer" | "paypal",
    payout_email: "",
    bank_account_name: "",
    bank_sort_code: "",
    bank_account_number: "",
  })

  useEffect(() => {
    async function fetchPartner() {
      const res = await fetch("/api/partners/settings")
      if (res.ok) {
        const data = await res.json()
        setPartner(data)
        setFormData({
          phone: data.phone || "",
          website: data.website || "",
          payout_method: data.payout_method || "bank_transfer",
          payout_email: data.payout_email || "",
          bank_account_name: data.bank_account_name || "",
          bank_sort_code: data.bank_sort_code || "",
          bank_account_number: data.bank_account_number || "",
        })
      } else {
        router.push("/partners")
      }
      setLoading(false)
    }

    fetchPartner()
  }, [router])

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/partners/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        toast.success("Settings saved")
      } else {
        const data = await res.json()
        toast.error(data.error || "Failed to save settings")
      }
    } catch {
      toast.error("Failed to save settings")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!partner) {
    return null
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Partner Settings</h1>
        <p className="text-muted-foreground">
          Manage your partner profile and payout settings
        </p>
      </div>

      {/* Profile Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>Profile</CardTitle>
              <CardDescription>Your partner information</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Company Name</Label>
            <Input value={partner.company_name} disabled className="bg-muted" />
          </div>

          <div>
            <Label>Contact Name</Label>
            <Input value={partner.contact_name} disabled className="bg-muted" />
          </div>

          <div>
            <Label>Email</Label>
            <Input value={partner.email} disabled className="bg-muted" />
          </div>

          <Separator />

          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => updateField("phone", e.target.value)}
              placeholder="07123 456789"
            />
          </div>

          <div>
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              value={formData.website}
              onChange={(e) => updateField("website", e.target.value)}
              placeholder="https://yourwebsite.com"
            />
          </div>
        </CardContent>
      </Card>

      {/* Payout Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>Payout Settings</CardTitle>
              <CardDescription>How you receive your commissions</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Payout Method</Label>
            <div className="grid grid-cols-2 gap-3 mt-2">
              <button
                onClick={() => updateField("payout_method", "bank_transfer")}
                className={`p-4 border rounded-lg text-left transition-colors ${
                  formData.payout_method === "bank_transfer"
                    ? "border-primary bg-primary/5"
                    : "hover:border-muted-foreground/50"
                }`}
              >
                <p className="font-medium">Bank Transfer</p>
                <p className="text-sm text-muted-foreground">Direct to UK bank</p>
              </button>

              <button
                onClick={() => updateField("payout_method", "paypal")}
                className={`p-4 border rounded-lg text-left transition-colors ${
                  formData.payout_method === "paypal"
                    ? "border-primary bg-primary/5"
                    : "hover:border-muted-foreground/50"
                }`}
              >
                <p className="font-medium">PayPal</p>
                <p className="text-sm text-muted-foreground">PayPal email</p>
              </button>
            </div>
          </div>

          {formData.payout_method === "bank_transfer" && (
            <>
              <div>
                <Label htmlFor="bank_account_name">Account Name</Label>
                <Input
                  id="bank_account_name"
                  value={formData.bank_account_name}
                  onChange={(e) => updateField("bank_account_name", e.target.value)}
                  placeholder="John Smith"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="bank_sort_code">Sort Code</Label>
                  <Input
                    id="bank_sort_code"
                    value={formData.bank_sort_code}
                    onChange={(e) => updateField("bank_sort_code", e.target.value)}
                    placeholder="00-00-00"
                    maxLength={8}
                  />
                </div>

                <div>
                  <Label htmlFor="bank_account_number">Account Number</Label>
                  <Input
                    id="bank_account_number"
                    value={formData.bank_account_number}
                    onChange={(e) =>
                      updateField("bank_account_number", e.target.value)
                    }
                    placeholder="12345678"
                    maxLength={8}
                  />
                </div>
              </div>
            </>
          )}

          {formData.payout_method === "paypal" && (
            <div>
              <Label htmlFor="payout_email">PayPal Email</Label>
              <Input
                id="payout_email"
                type="email"
                value={formData.payout_email}
                onChange={(e) => updateField("payout_email", e.target.value)}
                placeholder="your@paypal.email"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Commission Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Settings className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>Commission Details</CardTitle>
              <CardDescription>Your commission structure</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="bg-muted rounded-lg p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Commission Rate</span>
              <span className="font-medium">{partner.commission_rate}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Recurring</span>
              <span className="font-medium">
                {partner.commission_recurring ? "Yes" : "First payment only"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Minimum Payout</span>
              <span className="font-medium">£{partner.minimum_payout}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Referral Code</span>
              <span className="font-mono">{partner.referral_code}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => router.push("/partners")}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Changes"
          )}
        </Button>
      </div>
    </div>
  )
}
