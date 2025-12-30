"use client"

import { cn } from "@/lib/utils"
import { Checkbox } from "@/components/ui/checkbox"

interface Account {
  id: string
  name: string
  official_name?: string | null
  mask: string | null
  type: string
  subtype: string | null
  is_business_account: boolean
}

interface AccountSelectorProps {
  accounts: Account[]
  selectedIds: string[]
  onToggle: (id: string) => void
}

export function AccountSelector({
  accounts,
  selectedIds,
  onToggle,
}: AccountSelectorProps) {
  return (
    <div className="space-y-3">
      {accounts.map((account) => {
        const isSelected = selectedIds.includes(account.id)

        return (
          <button
            key={account.id}
            type="button"
            onClick={() => onToggle(account.id)}
            className={cn(
              "w-full p-4 rounded-lg border text-left transition-all flex items-center gap-3",
              "hover:bg-muted",
              isSelected
                ? "border-[#15e49e] bg-[#15e49e]/10"
                : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
            )}
          >
            <Checkbox
              checked={isSelected}
              className="pointer-events-none"
            />
            <div className="flex-1">
              <h3 className="font-medium">{account.name || account.official_name}</h3>
              <p className="text-sm text-muted-foreground">
                {account.mask ? `****${account.mask}` : ''} · {account.subtype || account.type}
              </p>
            </div>
          </button>
        )
      })}
    </div>
  )
}
