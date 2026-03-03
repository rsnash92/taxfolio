"use client"

import { useState } from "react"
import Link from "next/link"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, ExternalLink, Loader2, Mail, Pencil } from "lucide-react"
import { getAvailableTransitions } from "@/lib/practice/permissions"
import type { Role } from "@/lib/practice/permissions"
import { ComposeEmail } from "@/components/practice/ComposeEmail"

interface ClientDetailProps {
  client: {
    id: string
    name: string
    reference: string | null
    email: string | null
    phone: string | null
    nino_last4: string | null
    agent_type: string
    auth_status: string
    businesses: { businessId: string; type: string; tradingName: string | null }[]
    data_source: string
    notes: string | null
  }
  quarters: {
    id: string
    tax_year: string
    quarter: number
    business_id: string | null
    stage: string
    period_start: string | null
    period_end: string | null
    due_date: string | null
    prepared_by: string | null
    reviewed_by: string | null
    submitted_at: string | null
    hmrc_correlation_id: string | null
    notes: string | null
  }[]
  sa100s: {
    id: string
    tax_year: string
    stage: string
    declaration_id: string | null
    prepared_by: string | null
    reviewed_by: string | null
    submitted_at: string | null
    hmrc_ref: string | null
    notes: string | null
  }[]
  emails: {
    id: string
    subject: string
    body_html: string | null
    template_type: string | null
    status: string
    sent_at: string | null
    created_at: string
  }[]
  auditLog: {
    id: string
    action: string
    details: Record<string, unknown>
    created_at: string
    actor_id: string | null
  }[]
  role: string
  practiceId: string
}

const STAGE_LABELS: Record<string, string> = {
  not_started: "Not Started",
  awaiting_data: "Awaiting Data",
  categorising: "Categorising",
  in_progress: "In Progress",
  ready_for_review: "Ready for Review",
  ready_to_submit: "Ready to Submit",
  submitted: "Submitted",
  failed: "Failed",
}

const STAGE_COLORS: Record<string, string> = {
  not_started: "bg-gray-100 text-gray-700",
  awaiting_data: "bg-yellow-100 text-yellow-800",
  categorising: "bg-blue-100 text-blue-800",
  in_progress: "bg-blue-100 text-blue-800",
  ready_for_review: "bg-orange-100 text-orange-800",
  ready_to_submit: "bg-emerald-100 text-emerald-800",
  submitted: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
}

export function ClientDetail({
  client,
  quarters,
  sa100s,
  emails,
  auditLog,
  role,
}: ClientDetailProps) {
  const [showCompose, setShowCompose] = useState(false)
  const [composeInitial, setComposeInitial] = useState<{ subject: string; body: string } | null>(null)
  const [showEdit, setShowEdit] = useState(false)
  const [editData, setEditData] = useState({
    name: client.name,
    email: client.email || "",
    phone: client.phone || "",
    reference: client.reference || "",
    notes: client.notes || "",
  })
  const [isSaving, setIsSaving] = useState(false)
  const [editError, setEditError] = useState("")
  const [clientData, setClientData] = useState(client)

  async function handleSaveEdit() {
    if (!editData.name.trim()) {
      setEditError("Name is required")
      return
    }
    setIsSaving(true)
    setEditError("")

    try {
      const res = await fetch(`/api/practice/clients/${clientData.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editData.name.trim(),
          email: editData.email.trim() || null,
          phone: editData.phone.trim() || null,
          reference: editData.reference.trim() || null,
          notes: editData.notes.trim() || null,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to update client")
      }

      const { client: updated } = await res.json()
      setClientData({ ...clientData, ...updated })
      setShowEdit(false)
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Failed to update")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/practice">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{clientData.name}</h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {clientData.reference && <span>{clientData.reference}</span>}
            {clientData.nino_last4 && <span>**{clientData.nino_last4}</span>}
            {clientData.email && <span>{clientData.email}</span>}
            {clientData.phone && <span>{clientData.phone}</span>}
            <Badge variant={clientData.auth_status === "authorised" ? "default" : "secondary"}>
              {clientData.agent_type} agent
            </Badge>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setEditData({
              name: clientData.name,
              email: clientData.email || "",
              phone: clientData.phone || "",
              reference: clientData.reference || "",
              notes: clientData.notes || "",
            })
            setShowEdit(!showEdit)
            setEditError("")
          }}
        >
          <Pencil className="h-4 w-4 mr-1" />
          Edit
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={!clientData.email}
          onClick={() => {
            setComposeInitial(null)
            setShowCompose(true)
          }}
        >
          <Mail className="h-4 w-4 mr-1" />
          Email
        </Button>
      </div>

      {/* Edit Client */}
      {showEdit && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Edit client details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Name</Label>
                <Input
                  id="edit-name"
                  value={editData.name}
                  onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editData.email}
                  onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                  placeholder="client@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Phone</Label>
                <Input
                  id="edit-phone"
                  value={editData.phone}
                  onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                  placeholder="07..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-reference">Reference</Label>
                <Input
                  id="edit-reference"
                  value={editData.reference}
                  onChange={(e) => setEditData({ ...editData, reference: e.target.value })}
                  placeholder="e.g. CM001"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea
                id="edit-notes"
                value={editData.notes}
                onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                rows={3}
              />
            </div>
            {editError && <p className="text-sm text-destructive">{editError}</p>}
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowEdit(false)}>Cancel</Button>
              <Button onClick={handleSaveEdit} disabled={isSaving}>
                {isSaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Save changes
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Compose Email */}
      {showCompose && (
        <ComposeEmail
          key={composeInitial?.subject || "new"}
          clientId={clientData.id}
          clientName={clientData.name}
          clientEmail={clientData.email}
          initialSubject={composeInitial?.subject}
          initialBody={composeInitial?.body}
          onClose={() => setShowCompose(false)}
          onSent={() => setShowCompose(false)}
        />
      )}

      {/* Tabs */}
      <Tabs defaultValue="mtd">
        <TabsList>
          <TabsTrigger value="mtd">MTD Quarters</TabsTrigger>
          <TabsTrigger value="sa100">SA100 Return</TabsTrigger>
          <TabsTrigger value="emails">Emails ({emails.length})</TabsTrigger>
          <TabsTrigger value="audit">Audit</TabsTrigger>
        </TabsList>

        {/* MTD Quarters */}
        <TabsContent value="mtd" className="space-y-4">
          {quarters.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No quarterly obligations found. Fetch from HMRC to populate.
              </CardContent>
            </Card>
          ) : (
            quarters.map((q) => (
              <Card key={q.id}>
                <CardHeader className="py-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">
                      {q.tax_year} Q{q.quarter}
                      {q.business_id && (
                        <span className="text-sm text-muted-foreground ml-2">
                          ({clientData.businesses.find(b => b.businessId === q.business_id)?.tradingName || q.business_id})
                        </span>
                      )}
                    </CardTitle>
                    <Badge className={STAGE_COLORS[q.stage]}>
                      {STAGE_LABELS[q.stage]}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="py-2">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    {q.period_start && q.period_end && (
                      <span>{q.period_start} to {q.period_end}</span>
                    )}
                    {q.due_date && <span>Due: {q.due_date}</span>}
                    {q.hmrc_correlation_id && <span>Ref: {q.hmrc_correlation_id}</span>}
                  </div>
                  {getAvailableTransitions(role as Role, q.stage).length > 0 && (
                    <div className="flex gap-2 mt-2">
                      {getAvailableTransitions(role as Role, q.stage).map((toStage) => (
                        <Button key={toStage} size="sm" variant="outline">
                          {STAGE_LABELS[toStage]}
                        </Button>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* SA100 Return */}
        <TabsContent value="sa100" className="space-y-4">
          {sa100s.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No SA100 records found.
              </CardContent>
            </Card>
          ) : (
            sa100s.map((sa) => (
              <Card key={sa.id}>
                <CardHeader className="py-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{sa.tax_year} SA100</CardTitle>
                    <Badge className={STAGE_COLORS[sa.stage]}>
                      {STAGE_LABELS[sa.stage]}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="py-2">
                  <div className="flex items-center gap-3">
                    <a
                      href={`${process.env.NEXT_PUBLIC_SA100_URL || 'https://assessment.taxfolio.io'}/agent/${clientData.id}/${sa.tax_year}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button size="sm" variant="outline">
                        <ExternalLink className="h-3.5 w-3.5 mr-1" />
                        Open SA100 Wizard
                      </Button>
                    </a>
                    {sa.hmrc_ref && (
                      <span className="text-sm text-muted-foreground">Ref: {sa.hmrc_ref}</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Emails */}
        <TabsContent value="emails" className="space-y-4">
          {emails.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No emails sent to this client yet.
              </CardContent>
            </Card>
          ) : (
            emails.map((email) => (
              <Card key={email.id}>
                <CardContent className="py-3">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-sm">{email.subject}</p>
                    <div className="flex items-center gap-2">
                      {(email.status === "draft" || email.status === "failed") && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const plainBody = email.body_html
                              ? email.body_html
                                  .replace(/<br\s*\/?>/gi, "\n")
                                  .replace(/<\/p>\s*<p>/gi, "\n\n")
                                  .replace(/<[^>]+>/g, "")
                              : ""
                            setComposeInitial({ subject: email.subject, body: plainBody })
                            setShowCompose(true)
                          }}
                        >
                          <Pencil className="h-3 w-3 mr-1" />
                          Edit & resend
                        </Button>
                      )}
                      <Badge variant={email.status === "sent" ? "default" : "secondary"}>
                        {email.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(email.sent_at || email.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Audit Log */}
        <TabsContent value="audit" className="space-y-2">
          {auditLog.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No activity recorded yet.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-1">
              {auditLog.map((entry) => (
                <div key={entry.id} className="flex items-start gap-3 py-2 text-sm border-b last:border-0">
                  <span className="text-xs text-muted-foreground min-w-[140px]">
                    {new Date(entry.created_at).toLocaleString()}
                  </span>
                  <span className="font-medium">{formatAuditAction(entry.action, entry.details)}</span>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

function formatAuditAction(action: string, details: Record<string, unknown>): string {
  switch (action) {
    case "stage_change":
      return `Stage changed from "${STAGE_LABELS[details.from_stage as string] || details.from_stage}" to "${STAGE_LABELS[details.to_stage as string] || details.to_stage}"${details.mode === "mtd" ? ` (Q${details.quarter})` : ""}`
    case "client_added":
      return `Client added`
    case "client_updated":
      return `Client updated (${(details.fields as string[])?.join(", ")})`
    case "client_removed":
      return `Client removed`
    case "email_sent":
      return `Email sent: "${details.subject}"`
    case "hmrc_submission":
      return `HMRC submission${details.correlation_id ? ` (${details.correlation_id})` : ""}${details.error ? ` — FAILED: ${details.error}` : ""}`
    default:
      return action.replace(/_/g, " ")
  }
}
