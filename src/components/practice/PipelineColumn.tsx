"use client"

import { useState } from "react"
import { ClientCard } from "./ClientCard"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

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

interface PipelineColumnProps {
  stage: string
  label: string
  clients: PipelineClient[]
  loading: boolean
  role: string
  userId: string
  mode: string
  onStageChange: (clientId: string, toStage: string, businessId?: string, notes?: string) => void
}

const PAGE_SIZE = 10

export function PipelineColumn({
  stage,
  label,
  clients,
  loading,
  role,
  userId,
  mode,
  onStageChange,
}: PipelineColumnProps) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const visibleClients = clients.slice(0, visibleCount)
  const hasMore = clients.length > visibleCount

  return (
    <div className="flex flex-col rounded-lg border bg-muted/30 min-h-[400px]">
      {/* Column Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/50 rounded-t-lg">
        <h3 className="text-sm font-medium">{label}</h3>
        <span className="text-xs text-muted-foreground bg-background rounded-full px-2 py-0.5">
          {clients.length}
        </span>
      </div>

      {/* Cards */}
      <div className="flex-1 p-2 space-y-2 overflow-y-auto">
        {loading ? (
          <>
            <Skeleton className="h-24 w-full rounded-md" />
            <Skeleton className="h-24 w-full rounded-md" />
            <Skeleton className="h-24 w-full rounded-md" />
          </>
        ) : visibleClients.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-8">
            No clients
          </p>
        ) : (
          visibleClients.map((client) => (
            <ClientCard
              key={client.id}
              client={client}
              role={role}
              userId={userId}
              mode={mode}
              onStageChange={onStageChange}
            />
          ))
        )}

        {hasMore && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs"
            onClick={() => setVisibleCount((v) => v + PAGE_SIZE)}
          >
            Show {Math.min(clients.length - visibleCount, PAGE_SIZE)} more
          </Button>
        )}
      </div>
    </div>
  )
}
