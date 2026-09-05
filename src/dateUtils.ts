/** Today's date as YYYY-MM-DD, in the viewer's local timezone. */
export function todayISODate(): string {
  return toISODate(new Date())
}

export function toISODate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** Whole days between an ISO date and today (local time), never negative. */
export function daysSince(isoDate: string): number {
  const start = new Date(`${isoDate}T00:00:00`)
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const diffMs = startOfToday.getTime() - start.getTime()
  const days = Math.round(diffMs / (1000 * 60 * 60 * 24))
  return Math.max(0, days)
}

const SHORT_DATE = new Intl.DateTimeFormat(undefined, {
  day: 'numeric',
  month: 'short',
})

/** e.g. "21 Jun" — matches how the reference app labels start/reset dates. */
export function formatShortDate(isoDate: string): string {
  return SHORT_DATE.format(new Date(`${isoDate}T00:00:00`))
}

/** Number of days in a given month (1-12) of a given year, e.g. Feb 2026 → 28. */
export function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

/** Splits an ISO date (YYYY-MM-DD) into its numeric year/month(1-12)/day. */
export function splitISODate(isoDate: string): { year: number; month: number; day: number } {
  const [year, month, day] = isoDate.split('-').map(Number)
  return { year, month, day }
}

/** Joins year/month(1-12)/day into an ISO date string, clamping the day to what that month actually has. */
export function joinISODate(year: number, month: number, day: number): string {
  return toISODate(new Date(year, month - 1, Math.min(day, daysInMonth(year, month))))
}

const MONTH_NAME = new Intl.DateTimeFormat(undefined, { month: 'short' })

/** e.g. 6 → "Jun" — locale-aware short month name for a 1-12 month number. */
export function monthName(month: number): string {
  return MONTH_NAME.format(new Date(2000, month - 1, 1))
}
