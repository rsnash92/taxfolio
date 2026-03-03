"use client"

import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Checkbox } from "@/components/ui/checkbox"
import { MoreHorizontal, ArrowRight, Mail, FileText, ExternalLink } from "lucide-react"
import { getAvailableTransitions } from "@/lib/practice/permissions"
import type { Role } from "@/lib/practice/permissions"

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

interface ClientCardProps {
  client: PipelineClient
  role: string
  userId: string
  mode: string
  onStageChange: (clientId: string, toStage: string, businessId?: string, notes?: string) => void
  selectMode?: boolean
  isSelected?: boolean
  onToggleSelect?: (clientId: string) => void
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

const DATA_SOURCE_LABELS: Record<string, string> = {
  bank: "Bank",
  csv: "CSV",
  manual: "Manual",
  none: "No data",
}

const BUSINESS_TYPE_LABELS: Record<string, string> = {
  "self-employment": "SE",
  "uk-property": "Property",
  "foreign-property": "Foreign",
}

export function ClientCard({ client, role, mode, onStageChange, selectMode, isSelected, onToggleSelect }: ClientCardProps) {
  const availableTransitions = getAvailableTransitions(role as Role, client.stage)

  return (
    <div
      className={`rounded-md border bg-card p-3 shadow-sm hover:shadow-md transition-shadow ${selectMode && isSelected ? "ring-2 ring-primary" : ""}`}
      onClick={selectMode ? () => onToggleSelect?.(client.id) : undefined}
      role={selectMode ? "button" : undefined}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        {selectMode && (
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onToggleSelect?.(client.id)}
            onClick={(e) => e.stopPropagation()}
            className="mt-0.5 mr-1"
          />
        )}
        <Link
          href={`/practice/clients/${client.id}`}
          className="flex-1 min-w-0"
        >
          <p className="font-medium text-sm truncate hover:underline">
            {client.name}
          </p>
          {client.reference && (
            <p className="text-xs text-muted-foreground">{client.reference}</p>
          )}
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              <MoreHorizontal className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {availableTransitions.map((toStage) => (
              <DropdownMenuItem
                key={toStage}
                onClick={() => onStageChange(client.id, toStage)}
              >
                <ArrowRight className="h-3.5 w-3.5 mr-2" />
                {STAGE_LABELS[toStage] || toStage}
              </DropdownMenuItem>
            ))}
            {availableTransitions.length > 0 && <DropdownMenuSeparator />}
            <DropdownMenuItem asChild>
              <Link href={`/practice/clients/${client.id}`}>
                <FileText className="h-3.5 w-3.5 mr-2" />
                View details
              </Link>
            </DropdownMenuItem>
            {mode === "sa100" && (
              <DropdownMenuItem asChild>
                <a
                  href={`${process.env.NEXT_PUBLIC_SA100_URL || 'https://assessment.taxfolio.io'}/agent/${client.id}/2025-26`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-3.5 w-3.5 mr-2" />
                  Open SA100
                </a>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem>
              <Mail className="h-3.5 w-3.5 mr-2" />
              Send email
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Business badges */}
      <div className="flex flex-wrap gap-1 mt-2">
        {client.businesses.map((biz) => (
          <Badge key={biz.businessId} variant="secondary" className="text-[10px] px-1.5 py-0">
            {BUSINESS_TYPE_LABELS[biz.type] || biz.type}
          </Badge>
        ))}
        {client.nino_last4 && (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
            **{client.nino_last4}
          </Badge>
        )}
      </div>

      {/* Bottom row: data source + assigned */}
      <div className="flex items-center justify-between mt-2 text-[10px] text-muted-foreground">
        <span>{DATA_SOURCE_LABELS[client.data_source] || client.data_source}</span>
        {client.stages.length > 1 && (
          <span>
            {client.stages.filter(s => s.stage === client.stage).length}/{client.stages.length} businesses
          </span>
        )}
      </div>
    </div>
  )
}
