export interface QuarterInfo {
  quarter: 1 | 2 | 3 | 4
  startDate: string
  endDate: string
  deadline: string
  deadlineDate: Date
  daysUntilDeadline: number
  isOverdue: boolean
  isPast: boolean
  isCurrent: boolean
  isUpcoming: boolean
}

/**
 * Get MTD quarter dates for a tax year
 */
export function getMTDQuarters(taxYear: string): QuarterInfo[] {
  const [startYear] = taxYear.split('-').map(Number)
  const endYear = startYear + 1
  const now = new Date()

  const quarters: Omit<QuarterInfo, 'deadlineDate' | 'daysUntilDeadline' | 'isOverdue' | 'isPast' | 'isCurrent' | 'isUpcoming'>[] = [
    {
      quarter: 1,
      startDate: `${startYear}-04-06`,
      endDate: `${startYear}-07-05`,
      deadline: `${startYear}-08-07`,
    },
    {
      quarter: 2,
      startDate: `${startYear}-07-06`,
      endDate: `${startYear}-10-05`,
      deadline: `${startYear}-11-07`,
    },
    {
      quarter: 3,
      startDate: `${startYear}-10-06`,
      endDate: `${endYear}-01-05`,
      deadline: `${endYear}-02-07`,
    },
    {
      quarter: 4,
      startDate: `${endYear}-01-06`,
      endDate: `${endYear}-04-05`,
      deadline: `${endYear}-05-07`,
    },
  ]

  return quarters.map(q => {
    const deadlineDate = new Date(q.deadline)
    const endDate = new Date(q.endDate)
    const startDate = new Date(q.startDate)
    const daysUntilDeadline = Math.ceil(
      (deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    )

    return {
      ...q,
      deadlineDate,
      daysUntilDeadline,
      isOverdue: now > deadlineDate,
      isPast: now > endDate,
      isCurrent: now >= startDate && now <= endDate,
      isUpcoming: now < startDate,
    } as QuarterInfo
  })
}

/**
 * Get the next upcoming deadline (quarter that has ended but not yet overdue)
 */
export function getNextDeadline(taxYear: string): QuarterInfo | null {
  const quarters = getMTDQuarters(taxYear)
  return quarters.find(q => q.isPast && !q.isOverdue) || null
}

/**
 * Check if any deadline is approaching (within 14 days)
 */
export function hasApproachingDeadline(taxYear: string): {
  hasApproaching: boolean
  quarter: QuarterInfo | null
  daysRemaining: number
} {
  const nextDeadline = getNextDeadline(taxYear)

  if (!nextDeadline) {
    return { hasApproaching: false, quarter: null, daysRemaining: 0 }
  }

  return {
    hasApproaching: nextDeadline.daysUntilDeadline <= 14 && nextDeadline.daysUntilDeadline > 0,
    quarter: nextDeadline,
    daysRemaining: nextDeadline.daysUntilDeadline,
  }
}

/**
 * Format deadline for display
 */
export function formatDeadline(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

/**
 * Get current tax year
 */
export function getCurrentTaxYear(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const day = now.getDate()

  if (month > 4 || (month === 4 && day >= 6)) {
    return `${year}-${(year + 1).toString().slice(-2)}`
  } else {
    return `${year - 1}-${year.toString().slice(-2)}`
  }
}
