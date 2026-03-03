"use client"

import { useState, useEffect, useCallback } from "react"
import { PipelineControls } from "./PipelineControls"
import { PipelineSummaryBar } from "./PipelineSummaryBar"
import { PipelineColumn } from "./PipelineColumn"
import { MTD_COLUMN_STAGES, SA100_COLUMN_STAGES } from "@/lib/practice/permissions"

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

  const stages = mode === "mtd" ? MTD_COLUMN_STAGES : SA100_COLUMN_STAGES
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{practiceName}</h1>
          <p className="text-muted-foreground">Client Pipeline</p>
        </div>
      </div>

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
          />
        ))}
      </div>
    </div>
  )
}
