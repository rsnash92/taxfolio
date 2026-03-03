"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Link2, Loader2, Save } from "lucide-react"

interface PracticeSettingsProps {
  practiceName: string
  hmrcArn: string | null
  hmrcConnected: boolean
  hmrcExpired: boolean
  isOwner: boolean
  practiceId: string
}

export function PracticeSettings({
  practiceName: initialName,
  hmrcArn: initialArn,
  hmrcConnected,
  hmrcExpired,
  isOwner,
}: PracticeSettingsProps) {
  const [name, setName] = useState(initialName)
  const [arn, setArn] = useState(initialArn || "")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleSave() {
    setSaving(true)
    setSaved(false)

    try {
      const res = await fetch("/api/practice/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), hmrcArn: arn.trim() || null }),
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
