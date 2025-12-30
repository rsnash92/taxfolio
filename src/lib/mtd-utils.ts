// MTD (Making Tax Digital) utility functions for UK quarterly tax reporting

export interface QuarterDates {
  start: string
  end: string
  deadline: string
  label: string
}

export type QuarterStatus = 'ready' | 'in_progress' | 'upcoming' | 'overdue'

/**
 * Get the date range and deadline for a specific quarter in a tax year
 * @param taxYear Format: "2024-25"
 * @param quarter 1-4
 */
export function getQuarterDates(taxYear: string, quarter: number): QuarterDates {
  const [startYearStr] = taxYear.split('-')
  const startYear = parseInt(startYearStr, 10)
  // Handle both 2-digit (24) and 4-digit (2024) year formats
  const fullStartYear = startYear < 100
    ? (startYear > 50 ? 1900 + startYear : 2000 + startYear)
    : startYear

  const quarters: Record<number, QuarterDates> = {
    1: {
      start: `${fullStartYear}-04-06`,
      end: `${fullStartYear}-07-05`,
      deadline: `${fullStartYear}-08-07`,
      label: `Q1: 6 Apr - 5 Jul ${fullStartYear}`,
    },
    2: {
      start: `${fullStartYear}-07-06`,
      end: `${fullStartYear}-10-05`,
      deadline: `${fullStartYear}-11-07`,
      label: `Q2: 6 Jul - 5 Oct ${fullStartYear}`,
    },
    3: {
      start: `${fullStartYear}-10-06`,
      end: `${fullStartYear + 1}-01-05`,
      deadline: `${fullStartYear + 1}-02-07`,
      label: `Q3: 6 Oct - 5 Jan ${fullStartYear + 1}`,
    },
    4: {
      start: `${fullStartYear + 1}-01-06`,
      end: `${fullStartYear + 1}-04-05`,
      deadline: `${fullStartYear + 1}-05-07`,
      label: `Q4: 6 Jan - 5 Apr ${fullStartYear + 1}`,
    },
  }

  return quarters[quarter] || quarters[1]
}

/**
 * Determine the status of a quarter based on dates and transaction counts
 */
export function getQuarterStatus(
  quarterDates: QuarterDates,
  pendingCount: number,
  confirmedCount: number
): QuarterStatus {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const startDate = new Date(quarterDates.start)
  const endDate = new Date(quarterDates.end)
  const deadlineDate = new Date(quarterDates.deadline)

  // Quarter hasn't started yet
  if (today < startDate) {
    return 'upcoming'
  }

  // Past deadline with pending transactions
  if (today > deadlineDate && pendingCount > 0) {
    return 'overdue'
  }

  // Has pending transactions
  if (pendingCount > 0) {
    return 'in_progress'
  }

  // All confirmed and quarter has ended (or has transactions)
  if (today > endDate && confirmedCount > 0) {
    return 'ready'
  }

  // Quarter is current, no pending, some confirmed
  if (confirmedCount > 0) {
    return 'ready'
  }

  // No transactions yet
  if (today <= endDate) {
    return 'in_progress'
  }

  return 'ready'
}

/**
 * Format a date string for display
 */
export function formatQuarterDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

/**
 * Check if a deadline has passed
 */
export function isDeadlinePassed(deadline: string): boolean {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const deadlineDate = new Date(deadline)
  return today > deadlineDate
}

/**
 * Get all four quarters for a tax year
 */
export function getAllQuarters(taxYear: string): QuarterDates[] {
  return [1, 2, 3, 4].map((q) => getQuarterDates(taxYear, q))
}

/**
 * Determine which quarter a date falls into
 * @param date Date string in YYYY-MM-DD format
 * @param taxYear Tax year in format "2024-25"
 * @returns Quarter number (1-4) or null if date is outside tax year
 */
export function getQuarterForDate(date: string, taxYear: string): number | null {
  const dateObj = new Date(date)

  for (let q = 1; q <= 4; q++) {
    const quarter = getQuarterDates(taxYear, q)
    const start = new Date(quarter.start)
    const end = new Date(quarter.end)

    if (dateObj >= start && dateObj <= end) {
      return q
    }
  }

  return null
}
