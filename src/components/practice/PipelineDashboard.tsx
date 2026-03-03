"use client"

import { useState, useEffect, useCallback } from "react"
import { PipelineControls } from "./PipelineControls"
import { PipelineSummaryBar } from "./PipelineSummaryBar"
import { PipelineColumn } from "./PipelineColumn"
import { Button } from "@/components/ui/button"
import { MTD_COLUMN_STAGES, SA100_COLUMN_STAGES } from "@/lib/practice/permissions"
import { canSendEmail } from "@/lib/practice/permissions"
import type { Role } from "@/lib/practice/permissions"
import { CheckSquare, X, Mail, Loader2 } from "lucide-react"

interface TeamMember {
  id: string
  name: string
  role: string
}

interface PipelineClient {
  id: string
  name: string
  reference: string | null
  businesses: { businessId: string; type: string; tradingName: string | null }[]
  assigned_to: string | null
  data_source: string
  nino_last4: string | null
  stage: string
  stages: { businessId: string; stage: string; quarter?: number }[]
}

interface PipelineData {
  columns: Record<string, PipelineClient[]>
  summary: Record<string, number>
  total: number
}

interface PipelineDashboardProps {
  practiceId: string
  practiceName: string
  role: string
  userId: string
  teamMembers: TeamMember[]
}

const MTD_COLUMN_LABELS: Record<string, string> = {
  awaiting_data: "Awaiting Data",
  categorising: "Categorising",
  ready_for_review: "Ready for Review",
  ready_to_submit: "Ready to Submit",
  submitted: "Submitted",
}

const SA100_COLUMN_LABELS: Record<string, string> = {
  awaiting_data: "Awaiting Data",
  in_progress: "In Progress",
  ready_for_review: "Ready for Review",
  ready_to_submit: "Ready to Submit",
  submitted: "Submitted",
}

function getCurrentTaxYear(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const start = month >= 4 ? year : year - 1
  return `${start}-${(start + 1).toString().slice(2)}`
}

export function PipelineDashboard({
  practiceName,
  role,
  userId,
  teamMembers,
}: PipelineDashboardProps) {
  const [mode, setMode] = useState<"mtd" | "sa100">("mtd")
  const [taxYear, setTaxYear] = useState(getCurrentTaxYear())
  const [quarter, setQuarter] = useState<number | null>(null)
  const [search, setSearch] = useState("")
  const [assignedTo, setAssignedTo] = useState("")
  const [data, setData] = useState<PipelineData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectMode, setSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkSending, setBulkSending] = useState(false)
  const [bulkProgress, setBulkProgress] = useState("")

  const stages = mode === "mtd" ? MTD_COLUMN_STAGES : SA100_COLUMN_STAGES
  const showSelectToggle = canSendEmail(role as Role)
  const labels = mode === "mtd" ? MTD_COLUMN_LABELS : SA100_COLUMN_LABELS

  const fetchPipeline = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ mode, taxYear })
      if (quarter && mode === "mtd") params.set("quarter", quarter.toString())
      if (search) params.set("search", search)
      if (assignedTo) params.set("assignedTo", assignedTo)

      const res = await fetch(`/api/practice/pipeline?${params}`)
      if (res.ok) {
        const json = await res.json()
        setData(json)
      }
    } catch (err) {
      console.error("Failed to fetch pipeline:", err)
    } finally {
      setLoading(false)
    }
  }, [mode, taxYear, quarter, search, assignedTo])

  useEffect(() => {
    fetchPipeline()
  }, [fetchPipeline])

  const handleStageChange = async (
    clientId: string,
    toStage: string,
    businessId?: string,
    notes?: string
  ) => {
    const body: Record<string, unknown> = {
      mode,
      taxYear,
      toStage,
      notes,
    }
    if (mode === "mtd") {
      body.quarter = quarter || 1
      if (businessId) body.businessId = businessId
    }

    const res = await fetch(`/api/practice/clients/${clientId}/stage`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })

    if (res.ok) {
      // Refresh pipeline data
      fetchPipeline()
    }
  }

  function handleToggleSelect(clientId: string) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(clientId)) {
        next.delete(clientId)
      } else {
        next.add(clientId)
      }
      return next
    })
  }

  function handleExitSelectMode() {
    setSelectMode(false)
    setSelectedIds(new Set())
  }

  async function handleBulkEmail(templateType: string) {
    if (selectedIds.size === 0) return
    setBulkSending(true)
    setBulkProgress(`Sending to ${selectedIds.size} clients...`)

    try {
      const res = await fetch("/api/practice/emails/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientIds: Array.from(selectedIds),
          templateType,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Bulk send failed")
      }

      const result = await res.json()
      const parts = []
      if (result.sent > 0) parts.push(`${result.sent} sent`)
      if (result.skipped > 0) parts.push(`${result.skipped} skipped (no email)`)
      if (result.failed > 0) parts.push(`${result.failed} failed`)
      setBulkProgress(parts.join(", "))

      // Clear selection after a moment
      setTimeout(() => {
        handleExitSelectMode()
        setBulkProgress("")
        fetchPipeline()
      }, 3000)
    } catch (err) {
      setBulkProgress(err instanceof Error ? err.message : "Bulk send failed")
      setTimeout(() => setBulkProgress(""), 5000)
    } finally {
      setBulkSending(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{practiceName}</h1>
          <p className="text-muted-foreground">Client Pipeline</p>
        </div>
        {showSelectToggle && (
          <Button
            variant={selectMode ? "default" : "outline"}
            size="sm"
            onClick={() => selectMode ? handleExitSelectMode() : setSelectMode(true)}
          >
            <CheckSquare className="h-4 w-4 mr-2" />
            {selectMode ? "Cancel select" : "Select"}
          </Button>
        )}
      </div>

      {/* Bulk Action Bar */}
      {selectMode && selectedIds.size > 0 && (
        <div className="flex items-center gap-3 rounded-lg border bg-primary/5 px-4 py-3">
          <span className="text-sm font-medium">{selectedIds.size} selected</span>
          <div className="flex gap-2 ml-auto">
            {bulkSending ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                {bulkProgress}
              </div>
            ) : bulkProgress ? (
              <span className="text-sm text-muted-foreground">{bulkProgress}</span>
            ) : (
              <>
                <Button size="sm" variant="outline" onClick={() => handleBulkEmail("chase_data")}>
                  <Mail className="h-3.5 w-3.5 mr-1.5" />
                  Chase for data
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleBulkEmail("deadline_reminder")}>
                  <Mail className="h-3.5 w-3.5 mr-1.5" />
                  Deadline reminder
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleBulkEmail("ready_to_submit")}>
                  <Mail className="h-3.5 w-3.5 mr-1.5" />
                  Ready to submit
                </Button>
                <Button size="sm" variant="ghost" onClick={handleExitSelectMode}>
                  <X className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Controls */}
      <PipelineControls
        mode={mode}
        onModeChange={setMode}
        taxYear={taxYear}
        onTaxYearChange={setTaxYear}
        quarter={quarter}
        onQuarterChange={setQuarter}
        search={search}
        onSearchChange={setSearch}
        assignedTo={assignedTo}
        onAssignedToChange={setAssignedTo}
        teamMembers={teamMembers}
      />

      {/* Summary Bar */}
      {data && (
        <PipelineSummaryBar
          summary={data.summary}
          total={data.total}
          labels={labels}
        />
      )}

      {/* Kanban Columns */}
      <div className="grid grid-cols-5 gap-4 min-h-[500px]">
        {stages.map((stage) => (
          <PipelineColumn
            key={stage}
            stage={stage}
            label={labels[stage] || stage}
            clients={data?.columns[stage] || []}
            loading={loading}
            role={role}
            userId={userId}
            mode={mode}
            onStageChange={handleStageChange}
            selectMode={selectMode}
            selectedIds={selectedIds}
            onToggleSelect={handleToggleSelect}
          />
        ))}
      </div>
    </div>
  )
}
