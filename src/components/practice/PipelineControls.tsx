"use client"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"

interface TeamMember {
  id: string
  name: string
  role: string
}

interface PipelineControlsProps {
  mode: "mtd" | "sa100"
  onModeChange: (mode: "mtd" | "sa100") => void
  taxYear: string
  onTaxYearChange: (year: string) => void
  quarter: number | null
  onQuarterChange: (q: number | null) => void
  search: string
  onSearchChange: (s: string) => void
  assignedTo: string
  onAssignedToChange: (id: string) => void
  teamMembers: TeamMember[]
}

export function PipelineControls({
  mode,
  onModeChange,
  taxYear,
  onTaxYearChange,
  quarter,
  onQuarterChange,
  search,
  onSearchChange,
  assignedTo,
  onAssignedToChange,
  teamMembers,
}: PipelineControlsProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* SA100 / MTD Toggle */}
      <Tabs value={mode} onValueChange={(v) => onModeChange(v as "mtd" | "sa100")}>
        <TabsList>
          <TabsTrigger value="mtd">MTD</TabsTrigger>
          <TabsTrigger value="sa100">SA100</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Tax Year */}
      <Select value={taxYear} onValueChange={onTaxYearChange}>
        <SelectTrigger className="w-[140px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="2025-26">2025-26</SelectItem>
          <SelectItem value="2024-25">2024-25</SelectItem>
        </SelectContent>
      </Select>

      {/* Quarter (MTD only) */}
      {mode === "mtd" && (
        <Select
          value={quarter?.toString() || "all"}
          onValueChange={(v) => onQuarterChange(v === "all" ? null : parseInt(v))}
        >
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Quarter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Qs</SelectItem>
            <SelectItem value="1">Q1</SelectItem>
            <SelectItem value="2">Q2</SelectItem>
            <SelectItem value="3">Q3</SelectItem>
            <SelectItem value="4">Q4</SelectItem>
          </SelectContent>
        </Select>
      )}

      {/* Search */}
      <Input
        placeholder="Search clients..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        className="w-[200px]"
      />

      {/* Team filter */}
      {teamMembers.length > 1 && (
        <Select value={assignedTo || "all"} onValueChange={(v) => onAssignedToChange(v === "all" ? "" : v)}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Team member" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All team</SelectItem>
            {teamMembers.map((m) => (
              <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Add Client */}
      <div className="ml-auto">
        <Link href="/practice/clients/new">
          <Button size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Add Client
          </Button>
        </Link>
      </div>
    </div>
  )
}
