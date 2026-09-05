import type { Habit } from './types'

/** Triggers a browser download of the current habits as a JSON file. */
export function exportHabits(habits: Habit[]): void {
  const blob = new Blob([JSON.stringify(habits, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `habitude-backup-${new Date().toISOString().slice(0, 10)}.json`
  link.click()
  URL.revokeObjectURL(url)
}

/**
 * Parses and shape-checks a backup file's contents. Returns null if it
 * doesn't look like a Habitude export, rather than importing junk data.
 */
export function parseHabitsBackup(fileContents: string): Habit[] | null {
  let parsed: unknown
  try {
    parsed = JSON.parse(fileContents)
  } catch {
    return null
  }

  if (!Array.isArray(parsed)) return null
  if (!parsed.every(isHabitShaped)) return null
  // colorIndex didn't exist in every schema version — default it rather
  // than reject the whole file over one missing field.
  return parsed.map((h): Habit => ({ ...h, colorIndex: h.colorIndex ?? 0 }))
}

/** The fields a backup file must have; colorIndex is optional for older backups. */
type RawHabit = Omit<Habit, 'colorIndex'> & { colorIndex?: number }

function isHabitShaped(value: unknown): value is RawHabit {
  if (typeof value !== 'object' || value === null) return false
  const h = value as Record<string, unknown>
  return (
    typeof h.id === 'string' &&
    typeof h.name === 'string' &&
    typeof h.createdAt === 'string' &&
    typeof h.startDate === 'string' &&
    typeof h.bestStreakDays === 'number'
  )
}
