import { useEffect, useState } from 'react'
import { daysSince, todayISODate } from './dateUtils'
import { highestMilestoneReached } from './milestones'
import { loadHabits, saveHabits } from './storage'
import type { ToastMessage } from './Toast'
import type { Habit } from './types'

/**
 * Loads habits from storage and, in the same pass, marks any streak
 * milestone that was crossed while the app was closed as celebrated —
 * returning the toasts to show for those. Computed once, at init, since a
 * habit's day count can't change again until tomorrow.
 */
function loadInitialState(): { habits: Habit[]; initialToasts: ToastMessage[] } {
  const initialToasts: ToastMessage[] = []
  const habits = loadHabits().map((h) => {
    const milestone = highestMilestoneReached(daysSince(h.startDate))
    if (!milestone || milestone <= (h.lastCelebratedMilestone ?? 0)) return h

    initialToasts.push({
      id: crypto.randomUUID(),
      text: `🎉 ${milestone}-day streak on "${h.name}"!`,
    })
    return { ...h, lastCelebratedMilestone: milestone }
  })
  return { habits, initialToasts }
}

export function useHabits() {
  const [{ habits: initialHabits, initialToasts }] = useState(loadInitialState)
  const [habits, setHabits] = useState<Habit[]>(initialHabits)

  // Persist on every change. Skipping the very first render would save one
  // write, but it's cheap and this keeps the effect simple.
  useEffect(() => {
    saveHabits(habits)
  }, [habits])

  function addHabit(name: string, colorIndex: number) {
    const trimmed = name.trim()
    if (!trimmed) return

    const today = todayISODate()
    const habit: Habit = {
      id: crypto.randomUUID(),
      name: trimmed,
      createdAt: today,
      startDate: today,
      bestStreakDays: 0,
      colorIndex,
    }
    setHabits((current) => [...current, habit])
  }

  /** Renames a habit and/or changes its card color. */
  function updateHabit(id: string, changes: { name: string; colorIndex: number }) {
    const trimmed = changes.name.trim()
    if (!trimmed) return
    setHabits((current) =>
      current.map((h) => (h.id === id ? { ...h, name: trimmed, colorIndex: changes.colorIndex } : h)),
    )
  }

  function deleteHabit(id: string) {
    setHabits((current) => current.filter((h) => h.id !== id))
  }

  /** Starts a new streak from today, folding the just-ended streak into the best-streak record. */
  function resetHabit(id: string) {
    setHabits((current) =>
      current.map((h) => {
        if (h.id !== id) return h
        const finishedStreak = daysSince(h.startDate)
        return {
          ...h,
          startDate: todayISODate(),
          bestStreakDays: Math.max(h.bestStreakDays, finishedStreak),
          lastCelebratedMilestone: undefined,
        }
      }),
    )
  }

  /** Wholesale replace all habits — used when importing a backup file. */
  function replaceHabits(newHabits: Habit[]) {
    setHabits(newHabits)
  }

  return { habits, addHabit, updateHabit, deleteHabit, resetHabit, replaceHabits, initialToasts }
}
