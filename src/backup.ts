import { ME_PERSON_ID } from './people'
import type { Habit, Person } from './types'

export interface HabitsBackup {
  habits: Habit[]
  people: Person[]
}

/** Triggers a browser download of all habits and people as a JSON file. */
export function exportBackup(habits: Habit[], people: Person[]): void {
  const payload: HabitsBackup = { habits, people }
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
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
 * Understands both the current `{ habits, people }` format and the older
 * bare-array-of-habits format (from before people existed) — an old
 * backup just won't bring any people along, which the caller can treat
 * as "leave the current people list alone."
 */
export function parseBackup(fileContents: string): HabitsBackup | null {
  let parsed: unknown
  try {
    parsed = JSON.parse(fileContents)
  } catch {
    return null
  }

  if (Array.isArray(parsed)) {
    return parsed.every(isHabitShaped) ? { habits: normalizeHabits(parsed), people: [] } : null
  }

  if (typeof parsed !== 'object' || parsed === null || !('habits' in parsed)) return null
  const { habits, people } = parsed as { habits: unknown; people?: unknown }
  if (!Array.isArray(habits) || !habits.every(isHabitShaped)) return null

  return {
    habits: normalizeHabits(habits),
    people: Array.isArray(people) && people.every(isPersonShaped) ? people : [],
  }
}

function normalizeHabits(habits: RawHabit[]): Habit[] {
  // colorIndex and personId didn't exist in every schema version — default
  // them rather than reject the whole file over an older backup.
  return habits.map((h) => ({ ...h, colorIndex: h.colorIndex ?? 0, personId: h.personId ?? ME_PERSON_ID }))
}

/** The fields a backup file must have; colorIndex/personId are optional for older backups. */
type RawHabit = Omit<Habit, 'colorIndex' | 'personId'> & { colorIndex?: number; personId?: string }

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

function isPersonShaped(value: unknown): value is Person {
  if (typeof value !== 'object' || value === null) return false
  const p = value as Record<string, unknown>
  return typeof p.id === 'string' && typeof p.name === 'string'
}
