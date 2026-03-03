"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Send, Sparkles } from "lucide-react"

interface ComposeEmailProps {
  clientId: string
  clientName: string
  clientEmail: string | null
  initialSubject?: string
  initialBody?: string
  onSent?: () => void
  onClose?: () => void
}

export function ComposeEmail({ clientId, clientName, clientEmail, initialSubject, initialBody, onSent, onClose }: ComposeEmailProps) {
  const [templateType, setTemplateType] = useState("")
  const [subject, setSubject] = useState(initialSubject || "")
  const [body, setBody] = useState(initialBody || "")
  const [isDrafting, setIsDrafting] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  async function handleGenerateDraft() {
    setIsDrafting(true)
    setError("")

    try {
      const res = await fetch("/api/practice/emails/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          templateType: templateType || undefined,
          customPrompt: !templateType ? body || undefined : undefined,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to generate draft")
      }

      const data = await res.json()
      setSubject(data.subject)
      setBody(data.body)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate draft")
    } finally {
      setIsDrafting(false)
    }
  }

  async function handleSend() {
    if (!subject.trim() || !body.trim()) {
      setError("Subject and body are required")
      return
    }

    if (!clientEmail) {
      setError("Client has no email address")
      return
    }

    setIsSending(true)
    setError("")

    try {
      // Convert plain text to basic HTML
      const bodyHtml = body
        .split("\n\n")
        .map(p => `<p>${p.replace(/\n/g, "<br/>")}</p>`)
        .join("")

      const res = await fetch("/api/practice/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          subject: subject.trim(),
          bodyHtml,
          templateType: templateType || null,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to send email")
      }

      setSuccess(true)
      onSent?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send email")
    } finally {
      setIsSending(false)
    }
  }

  if (success) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-lg font-medium">Email sent to {clientName}</p>
          <p className="text-sm text-muted-foreground mt-1">{clientEmail}</p>
          <Button variant="outline" className="mt-4" onClick={onClose}>
            Close
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Compose email to {clientName}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Template</Label>
          <Select value={templateType} onValueChange={setTemplateType}>
            <SelectTrigger>
              <SelectValue placeholder="Select a template (optional)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="chase_data">Chase missing data</SelectItem>
              <SelectItem value="deadline_reminder">Deadline reminder</SelectItem>
              <SelectItem value="ready_to_submit">Ready to submit</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleGenerateDraft}
          disabled={isDrafting}
        >
          {isDrafting ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Sparkles className="h-4 w-4 mr-2" />
          )}
          Generate AI draft
        </Button>

        <div className="space-y-2">
          <Label htmlFor="email-to">To</Label>
          <Input id="email-to" value={clientEmail || "No email on file"} disabled />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email-subject">Subject</Label>
          <Input
            id="email-subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Email subject"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email-body">Body</Label>
          <Textarea
            id="email-body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Email body..."
            rows={12}
          />
        </div>

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        <div className="flex gap-2 justify-end">
          {onClose && (
            <Button variant="outline" onClick={onClose}>Cancel</Button>
          )}
          <Button onClick={handleSend} disabled={isSending || !clientEmail}>
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Send email
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
