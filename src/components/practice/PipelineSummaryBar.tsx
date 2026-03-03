"use client"

interface PipelineSummaryBarProps {
  summary: Record<string, number>
  total: number
  labels: Record<string, string>
}

export function PipelineSummaryBar({ summary, total, labels }: PipelineSummaryBarProps) {
  if (total === 0) return null

  const stages = Object.keys(summary)
  const readyCount = summary["ready_to_submit"] || 0

  // Calculate overdue (would need due dates — simplified for now)
  const totalInPipeline = Object.values(summary).reduce((a, b) => a + b, 0)

  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      {/* Progress bar */}
      <div className="flex h-2 rounded-full overflow-hidden bg-muted">
        {stages.map((stage) => {
          const count = summary[stage] || 0
          if (count === 0 || total === 0) return null
          const pct = (count / total) * 100

          const colors: Record<string, string> = {
            awaiting_data: "bg-yellow-500",
            categorising: "bg-blue-400",
            in_progress: "bg-blue-400",
            ready_for_review: "bg-orange-400",
            ready_to_submit: "bg-emerald-500",
            submitted: "bg-green-600",
          }

          return (
            <div
              key={stage}
              className={`${colors[stage] || "bg-gray-400"} transition-all`}
              style={{ width: `${pct}%` }}
              title={`${labels[stage]}: ${count}`}
            />
          )
        })}
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-6 text-sm text-muted-foreground">
        <span className="font-medium text-foreground">{total} clients</span>
        {stages.map((stage) => {
          const count = summary[stage] || 0
          if (count === 0) return null
          return (
            <span key={stage}>
              {labels[stage]}: <span className="font-medium text-foreground">{count}</span>
            </span>
          )
        })}
        {readyCount > 0 && (
          <span className="ml-auto text-emerald-600 font-medium">
            {readyCount} ready to submit
          </span>
        )}
      </div>
    </div>
  )
}
