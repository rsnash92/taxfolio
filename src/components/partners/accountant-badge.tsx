import { Building2 } from "lucide-react"

interface AccountantBadgeProps {
  accountantName: string
}

export function AccountantBadge({ accountantName }: AccountantBadgeProps) {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-full">
      <Building2 className="h-3.5 w-3.5 text-green-500" />
      <span className="text-sm text-green-600 dark:text-green-400">
        Referred by <span className="font-medium">{accountantName}</span>
      </span>
    </div>
  )
}
