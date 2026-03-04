"use client"

import { useState, useRef } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Link2, Loader2, Save, Upload, Trash2, RotateCcw, Lock, Palette } from "lucide-react"
import { useBranding } from "@/lib/branding-context"

interface PracticeSettingsProps {
  practiceName: string
  hmrcArn: string | null
  hmrcConnected: boolean
  hmrcExpired: boolean
  isOwner: boolean
  practiceId: string
  requireDifferentReviewer?: boolean
  branding?: Record<string, string>
  subscriptionTier?: string
}

const DEFAULT_PRIMARY = "#00e3ec"
const DEFAULT_SIDEBAR_BG = "#0f172a"

export function PracticeSettings({
  practiceName: initialName,
  hmrcArn: initialArn,
  hmrcConnected,
  hmrcExpired,
  isOwner,
  requireDifferentReviewer: initialRequireDifferentReviewer = false,
  branding: initialBranding = {},
  subscriptionTier = "starter",
}: PracticeSettingsProps) {
  const [name, setName] = useState(initialName)
  const [arn, setArn] = useState(initialArn || "")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [requireDifferentReviewer, setRequireDifferentReviewer] = useState(initialRequireDifferentReviewer)

  // Branding state
  const { setBranding } = useBranding()
  const [primaryColor, setPrimaryColor] = useState(initialBranding.primary_color || DEFAULT_PRIMARY)
  const [sidebarBg, setSidebarBg] = useState(initialBranding.sidebar_bg || DEFAULT_SIDEBAR_BG)
  const [logoUrl, setLogoUrl] = useState(initialBranding.logo_url || "")
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [savingBranding, setSavingBranding] = useState(false)
  const [savedBranding, setSavedBranding] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isPracticeTier = subscriptionTier === "practice" || subscriptionTier === "enterprise"

  // Track if branding has unsaved changes
  const brandingChanged =
    primaryColor !== (initialBranding.primary_color || DEFAULT_PRIMARY) ||
    sidebarBg !== (initialBranding.sidebar_bg || DEFAULT_SIDEBAR_BG)

  function updateLivePreview(color?: string, bg?: string) {
    setBranding({
      ...initialBranding,
      primary_color: color ?? primaryColor,
      sidebar_bg: bg ?? sidebarBg,
      logo_url: logoUrl,
    })
  }

  function handlePrimaryColorChange(color: string) {
    setPrimaryColor(color)
    updateLivePreview(color, undefined)
  }

  function handleSidebarBgChange(color: string) {
    setSidebarBg(color)
    updateLivePreview(undefined, color)
  }

  function handleResetPrimary() {
    setPrimaryColor(DEFAULT_PRIMARY)
    updateLivePreview(DEFAULT_PRIMARY, undefined)
  }

  function handleResetSidebarBg() {
    setSidebarBg(DEFAULT_SIDEBAR_BG)
    updateLivePreview(undefined, DEFAULT_SIDEBAR_BG)
  }

  async function handleSave() {
    setSaving(true)
    setSaved(false)

    try {
      const res = await fetch("/api/practice/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), hmrcArn: arn.trim() || null, requireDifferentReviewer }),
      })

      if (res.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      }
    } catch {
      // ignore
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveBranding() {
    setSavingBranding(true)
    setSavedBranding(false)

    try {
      const brandingData: Record<string, string> = { ...initialBranding }

      // Only save non-default values
      if (primaryColor !== DEFAULT_PRIMARY) {
        brandingData.primary_color = primaryColor
      } else {
        delete brandingData.primary_color
      }

      if (isPracticeTier && sidebarBg !== DEFAULT_SIDEBAR_BG) {
        brandingData.sidebar_bg = sidebarBg
      } else {
        delete brandingData.sidebar_bg
      }

      // Keep logo_url if it exists
      if (logoUrl) {
        brandingData.logo_url = logoUrl
      }

      const res = await fetch("/api/practice/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ branding: brandingData }),
      })

      if (res.ok) {
        setSavedBranding(true)
        setTimeout(() => setSavedBranding(false), 3000)
      }
    } catch {
      // ignore
    } finally {
      setSavingBranding(false)
    }
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingLogo(true)
    try {
      const formData = new FormData()
      formData.append("logo", file)

      const res = await fetch("/api/practice/branding", {
        method: "POST",
        body: formData,
      })

      if (res.ok) {
        const data = await res.json()
        setLogoUrl(data.logo_url)
        setBranding({
          ...initialBranding,
          primary_color: primaryColor,
          sidebar_bg: sidebarBg,
          logo_url: data.logo_url,
        })
      }
    } catch {
      // ignore
    } finally {
      setUploadingLogo(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  async function handleLogoRemove() {
    try {
      const res = await fetch("/api/practice/branding", { method: "DELETE" })
      if (res.ok) {
        setLogoUrl("")
        setBranding({
          ...initialBranding,
          primary_color: primaryColor,
          sidebar_bg: sidebarBg,
          logo_url: "",
        })
      }
    } catch {
      // ignore
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Practice details</CardTitle>
          <CardDescription>Your practice name and reference number</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="practice-name">Practice name</Label>
            <Input
              id="practice-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={!isOwner}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="hmrc-arn">Agent Reference Number</Label>
            <Input
              id="hmrc-arn"
              value={arn}
              onChange={(e) => setArn(e.target.value)}
              placeholder="e.g. AARN1234567"
              disabled={!isOwner}
            />
          </div>

          {isOwner && (
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {saved ? "Saved" : "Save changes"}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Branding Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Branding
          </CardTitle>
          <CardDescription>Customise your practice logo and colours</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Logo Upload — available on all plans */}
          <div className="space-y-3">
            <Label>Logo</Label>
            <div className="flex items-center gap-4">
              <div className="h-12 w-40 rounded-md border bg-muted/50 flex items-center justify-center overflow-hidden">
                {logoUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={logoUrl}
                    alt="Practice logo"
                    className="h-10 w-auto max-w-[150px] object-contain"
                  />
                ) : (
                  <span className="text-xs text-muted-foreground">No custom logo</span>
                )}
              </div>
              {isOwner && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingLogo}
                  >
                    {uploadingLogo ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Upload className="h-4 w-4 mr-2" />
                    )}
                    {uploadingLogo ? "Uploading..." : "Choose file"}
                  </Button>
                  {logoUrl && (
                    <Button variant="outline" size="sm" onClick={handleLogoRemove}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remove
                    </Button>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/svg+xml,image/webp"
                    className="hidden"
                    onChange={handleLogoUpload}
                  />
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              PNG, JPEG, SVG, or WebP. Max 500KB. Recommended height: 28px.
            </p>
          </div>

          {/* Primary Colour — available on all plans */}
          <div className="space-y-3">
            <Label>Primary colour</Label>
            <div className="flex items-center gap-3">
              <div
                className="h-9 w-9 rounded-md border cursor-pointer"
                style={{ backgroundColor: primaryColor }}
                onClick={() => isOwner && document.getElementById("primary-color-input")?.click()}
              />
              <Input
                value={primaryColor}
                onChange={(e) => handlePrimaryColorChange(e.target.value)}
                className="w-32 font-mono text-sm"
                disabled={!isOwner}
              />
              <input
                id="primary-color-input"
                type="color"
                value={primaryColor}
                onChange={(e) => handlePrimaryColorChange(e.target.value)}
                className="sr-only"
                disabled={!isOwner}
              />
              {primaryColor !== DEFAULT_PRIMARY && isOwner && (
                <Button variant="ghost" size="sm" onClick={handleResetPrimary}>
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Reset
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Used for navigation accents, badges, and buttons
            </p>
          </div>

          {/* Sidebar Background — Practice+ only */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Label>Sidebar background</Label>
              {!isPracticeTier && (
                <Badge variant="secondary" className="text-xs">
                  <Lock className="h-3 w-3 mr-1" />
                  Practice plan
                </Badge>
              )}
            </div>
            {isPracticeTier ? (
              <>
                <div className="flex items-center gap-3">
                  <div
                    className="h-9 w-9 rounded-md border cursor-pointer"
                    style={{ backgroundColor: sidebarBg }}
                    onClick={() => isOwner && document.getElementById("sidebar-bg-input")?.click()}
                  />
                  <Input
                    value={sidebarBg}
                    onChange={(e) => handleSidebarBgChange(e.target.value)}
                    className="w-32 font-mono text-sm"
                    disabled={!isOwner}
                  />
                  <input
                    id="sidebar-bg-input"
                    type="color"
                    value={sidebarBg}
                    onChange={(e) => handleSidebarBgChange(e.target.value)}
                    className="sr-only"
                    disabled={!isOwner}
                  />
                  {sidebarBg !== DEFAULT_SIDEBAR_BG && isOwner && (
                    <Button variant="ghost" size="sm" onClick={handleResetSidebarBg}>
                      <RotateCcw className="h-3 w-3 mr-1" />
                      Reset
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Background colour for the sidebar navigation
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Upgrade to the Practice plan to customise your sidebar background colour.
              </p>
            )}
          </div>

          {/* Save Branding */}
          {isOwner && brandingChanged && (
            <Button onClick={handleSaveBranding} disabled={savingBranding} size="sm">
              {savingBranding ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {savedBranding ? "Saved" : "Save branding"}
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Review workflow</CardTitle>
          <CardDescription>Controls how reviews and approvals work</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Require different reviewer (4-eyes principle)</Label>
              <p className="text-xs text-muted-foreground">
                The person who prepared a return cannot approve it
              </p>
            </div>
            <Switch
              checked={requireDifferentReviewer}
              onCheckedChange={setRequireDifferentReviewer}
              disabled={!isOwner}
            />
          </div>
          {isOwner && requireDifferentReviewer !== initialRequireDifferentReviewer && (
            <Button onClick={handleSave} disabled={saving} size="sm" className="mt-3">
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Save
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>HMRC connection</CardTitle>
          <CardDescription>
            Agent OAuth connection for MTD submissions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">Status:</span>
            {hmrcConnected ? (
              hmrcExpired ? (
                <Badge variant="destructive">Expired</Badge>
              ) : (
                <Badge variant="default">Connected</Badge>
              )
            ) : (
              <Badge variant="secondary">Not connected</Badge>
            )}
          </div>

          {isOwner && (
            <Button
              variant={hmrcConnected && !hmrcExpired ? "outline" : "default"}
              onClick={() => { window.location.href = "/api/practice/auth/hmrc" }}
            >
              <Link2 className="h-4 w-4 mr-2" />
              {hmrcConnected ? "Reconnect HMRC" : "Connect HMRC"}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
