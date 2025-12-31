interface HMRCStatusBadgeProps {
  isConnected: boolean
  readyCount: number
  hasUrgentDeadline: boolean
}

export function HMRCStatusBadge({
  isConnected,
  readyCount,
  hasUrgentDeadline,
}: HMRCStatusBadgeProps) {
  // Show red badge if not connected and has urgent deadline
  if (!isConnected && hasUrgentDeadline) {
    return (
      <span className="flex items-center justify-center w-5 h-5 text-xs font-medium text-white bg-red-500 rounded-full animate-pulse">
        !
      </span>
    )
  }

  // Show count if quarters ready
  if (readyCount > 0) {
    return (
      <span
        className={`flex items-center justify-center w-5 h-5 text-xs font-medium rounded-full ${
          isConnected
            ? 'bg-green-500 text-white'
            : 'bg-amber-500 text-white'
        }`}
      >
        {readyCount}
      </span>
    )
  }

  return null
}
