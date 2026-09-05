import { useEffect, useState } from 'react'
import { daysSince, todayISODate } from './dateUtils'
import { highestMilestoneReached } from './milestones'
import { ME_PERSON_ID } from './people'
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

  /** startDate defaults to today; pass an earlier date for a habit you were already doing. */
  function addHabit(
    name: string,
    colorIndex: number,
    startDate: string = todayISODate(),
    personId: string = ME_PERSON_ID,
  ) {
    const trimmed = name.trim()
    if (!trimmed) return

    const habit: Habit = {
      id: crypto.randomUUID(),
      name: trimmed,
      createdAt: startDate,
      startDate,
      bestStreakDays: 0,
      colorIndex,
      personId,
    }
    setHabits((current) => [...current, habit])
  }

  /**
   * Renames a habit, changes its card color/owner, and/or corrects its
   * start date. If the habit has never been reset, createdAt moves with
   * startDate too — they're the same fact ("when this streak began") until
   * a reset makes them different things.
   */
  function editHabit(
    id: string,
    changes: { name: string; colorIndex: number; startDate: string; personId: string },
  ) {
    const trimmed = changes.name.trim()
    if (!trimmed) return
    setHabits((current) =>
      current.map((h) => {
        if (h.id !== id) return h
        const neverReset = h.startDate === h.createdAt
        return {
          ...h,
          name: trimmed,
          colorIndex: changes.colorIndex,
          personId: changes.personId,
          startDate: changes.startDate,
          createdAt: neverReset ? changes.startDate : h.createdAt,
        }
      }),
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

  return { habits, addHabit, editHabit, deleteHabit, resetHabit, replaceHabits, initialToasts }
}
