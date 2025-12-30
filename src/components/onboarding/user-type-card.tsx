"use client"

import { cn } from "@/lib/utils"

interface UserTypeCardProps {
  icon: string
  title: string
  description: string
  selected: boolean
  onClick: () => void
}

export function UserTypeCard({
  icon,
  title,
  description,
  selected,
  onClick,
}: UserTypeCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full p-4 rounded-lg border text-left transition-all",
        "hover:bg-muted",
        selected
          ? "border-[#15e49e] bg-[#15e49e]/10"
          : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
      )}
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl">{icon}</span>
        <div>
          <h3 className="font-medium">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
    </button>
  )
}
