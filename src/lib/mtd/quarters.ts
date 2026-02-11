import type {
  PeriodDates,
  ObligationDetail,
  ObligationDisplayStatus,
  TaxYear,
} from '@/types/mtd';

/**
 * Get standard tax year quarters (6th April to 5th April)
 * These are the default quarterly periods for MTD ITSA
 */
export function getStandardQuarters(taxYear: TaxYear): PeriodDates[] {
  const startYear = parseInt(taxYear.split('-')[0]);

  return [
    {
      periodStartDate: `${startYear}-04-06`,
      periodEndDate: `${startYear}-07-05`,
    },
    {
      periodStartDate: `${startYear}-07-06`,
      periodEndDate: `${startYear}-10-05`,
    },
    {
      periodStartDate: `${startYear}-10-06`,
      periodEndDate: `${startYear + 1}-01-05`,
    },
    {
      periodStartDate: `${startYear + 1}-01-06`,
      periodEndDate: `${startYear + 1}-04-05`,
    },
  ];
}

/**
 * Get calendar quarters (alternative option users can elect)
 * Some businesses prefer calendar quarters for alignment with their accounting
 */
export function getCalendarQuarters(taxYear: TaxYear): PeriodDates[] {
  const startYear = parseInt(taxYear.split('-')[0]);

  return [
    {
      periodStartDate: `${startYear}-04-06`,
      periodEndDate: `${startYear}-06-30`,
    },
    {
      periodStartDate: `${startYear}-07-01`,
      periodEndDate: `${startYear}-09-30`,
    },
    {
      periodStartDate: `${startYear}-10-01`,
      periodEndDate: `${startYear}-12-31`,
    },
    {
      periodStartDate: `${startYear + 1}-01-01`,
      periodEndDate: `${startYear + 1}-03-31`,
    },
  ];
}

/**
 * Calculate the submission deadline for a period
 * Deadline is 1 month after period end, on the 5th of the following month
 * For Q1 (Apr-Jul), deadline is 5th August
 */
export function getDeadline(periodEndDate: string): string {
  const endDate = new Date(periodEndDate);
  // Add 1 month to the end date's month, set day to 5th
  const deadlineMonth = endDate.getMonth() + 1; // getMonth() is 0-indexed
  const deadlineYear =
    deadlineMonth > 11 ? endDate.getFullYear() + 1 : endDate.getFullYear();
  const normalizedMonth = deadlineMonth > 11 ? deadlineMonth - 12 : deadlineMonth;

  // Set to 5th of next month
  const deadline = new Date(deadlineYear, normalizedMonth, 5);
  return deadline.toISOString().split('T')[0];
}

/**
 * Determine the display status of an obligation based on due date and current date
 */
export function getObligationDisplayStatus(
  obligation: ObligationDetail
): ObligationDisplayStatus {
  if (obligation.status === 'Fulfilled') {
    return 'fulfilled';
  }

  const now = new Date();
  now.setHours(0, 0, 0, 0); // Normalize to start of day

  const dueDate = new Date(obligation.dueDate);
  dueDate.setHours(0, 0, 0, 0);

  const periodStart = new Date(obligation.periodStartDate);
  periodStart.setHours(0, 0, 0, 0);

  // If the period hasn't started yet, it's upcoming
  if (periodStart > now) {
    return 'upcoming';
  }

  // If past due date, it's overdue
  if (now > dueDate) {
    return 'overdue';
  }

  return 'open';
}

/**
 * Calculate days until the deadline (negative if overdue)
 */
export function getDaysUntilDue(dueDate: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);

  const diffTime = due.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
}

/**
 * Format a period for display: "Apr 25 to Jul 25"
 */
export function formatPeriod(startDate: string, endDate: string): string {
  const start = new Date(startDate);
  const end = new Date(endDate);

  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];

  const startMonth = monthNames[start.getMonth()];
  const startYear = start.getFullYear().toString().slice(-2);
  const endMonth = monthNames[end.getMonth()];
  const endYear = end.getFullYear().toString().slice(-2);

  return `${startMonth} ${startYear} to ${endMonth} ${endYear}`;
}

/**
 * Format a date for display: "06/04/2025"
 */
export function formatDate(date: string): string {
  const d = new Date(date);
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Format a date range for display: "Data spanning 06/04/2025 to 05/07/2025"
 */
export function formatDateRange(startDate: string, endDate: string): string {
  return `Data spanning ${formatDate(startDate)} to ${formatDate(endDate)}`;
}

/**
 * Get the quarter number (1-4) for a given period
 */
export function getQuarterNumber(periodStartDate: string): number {
  const start = new Date(periodStartDate);
  const month = start.getMonth(); // 0-indexed

  // Q1: Apr-Jun (months 3-5), Q2: Jul-Sep (6-8), Q3: Oct-Dec (9-11), Q4: Jan-Mar (0-2)
  if (month >= 3 && month <= 5) return 1;
  if (month >= 6 && month <= 8) return 2;
  if (month >= 9 && month <= 11) return 3;
  return 4; // Jan-Mar
}

/**
 * Get the current UK tax year in format "YYYY-YY"
 */
export function getCurrentTaxYear(): TaxYear {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed
  const day = now.getDate();

  // Tax year starts on April 6th
  // If we're before April 6th, we're in the previous tax year
  if (month < 3 || (month === 3 && day < 6)) {
    return `${year - 1}-${year.toString().slice(-2)}` as TaxYear;
  }

  return `${year}-${(year + 1).toString().slice(-2)}` as TaxYear;
}

/**
 * Parse a tax year string and return start/end dates
 */
export function getTaxYearDates(taxYear: TaxYear): { start: string; end: string } {
  const startYear = parseInt(taxYear.split('-')[0]);
  return {
    start: `${startYear}-04-06`,
    end: `${startYear + 1}-04-05`,
  };
}

/**
 * Check if a date falls within a period
 */
export function isDateInPeriod(
  date: string,
  periodStart: string,
  periodEnd: string
): boolean {
  const d = new Date(date);
  const start = new Date(periodStart);
  const end = new Date(periodEnd);

  d.setHours(0, 0, 0, 0);
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  return d >= start && d <= end;
}

/**
 * Get a human-readable deadline description
 */
export function getDeadlineDescription(dueDate: string): string {
  const days = getDaysUntilDue(dueDate);

  if (days < 0) {
    const overdueDays = Math.abs(days);
    return `${overdueDays} day${overdueDays === 1 ? '' : 's'} overdue`;
  }

  if (days === 0) {
    return 'Due today';
  }

  if (days === 1) {
    return 'Due tomorrow';
  }

  if (days <= 7) {
    return `Due in ${days} days`;
  }

  if (days <= 14) {
    return `Due in ${Math.ceil(days / 7)} week${days > 7 ? 's' : ''}`;
  }

  return `Due ${formatDate(dueDate)}`;
}

/**
 * Sort obligations by urgency (overdue first, then by due date)
 */
export function sortObligationsByUrgency<
  T extends { dueDate: string; status: 'Open' | 'Fulfilled' }
>(obligations: T[]): T[] {
  return [...obligations].sort((a, b) => {
    // Fulfilled obligations go last
    if (a.status === 'Fulfilled' && b.status !== 'Fulfilled') return 1;
    if (a.status !== 'Fulfilled' && b.status === 'Fulfilled') return -1;

    // Sort open obligations by due date (earliest first)
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });
}

/**
 * Check if a tax year uses cumulative period summaries (2025-26 onwards)
 */
export function usesCumulativePeriodSummaries(taxYear: TaxYear): boolean {
  const startYear = parseInt(taxYear.split('-')[0]);
  return startYear >= 2025;
}

/**
 * Get the API version to use based on tax year
 */
export function getApiVersion(
  taxYear: TaxYear,
  apiType: 'self-employment' | 'property'
): string {
  // For 2025-26 onwards, use the latest API versions with cumulative support
  if (usesCumulativePeriodSummaries(taxYear)) {
    return '5.0';
  }
  // For earlier years, use older API versions
  return apiType === 'self-employment' ? '4.0' : '4.0';
}
