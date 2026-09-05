import type { Habit } from './types'

const STORAGE_KEY = 'habitude.habits.v1'

/**
 * localStorage can throw (Safari private browsing, storage quota, disabled
 * storage) — every call here is guarded so a storage failure never crashes
 * the app, it just silently no-ops.
 */
export function loadHabits(): Habit[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveHabits(habits: Habit[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(habits))
  } catch {
    // Ignore — e.g. storage full or unavailable. Data just won't persist.
  }
}
