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
