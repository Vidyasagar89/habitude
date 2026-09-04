import { useEffect, useState } from 'react'
import { daysSince, todayISODate } from './dateUtils'
import { loadHabits, saveHabits } from './storage'
import type { Habit } from './types'

export function useHabits() {
  const [habits, setHabits] = useState<Habit[]>(() => loadHabits())

  // Persist on every change. Skipping the very first render would save one
  // write, but it's cheap and this keeps the effect simple.
  useEffect(() => {
    saveHabits(habits)
  }, [habits])

  function addHabit(name: string) {
    const trimmed = name.trim()
    if (!trimmed) return

    const today = todayISODate()
    const habit: Habit = {
      id: crypto.randomUUID(),
      name: trimmed,
      createdAt: today,
      startDate: today,
      bestStreakDays: 0,
    }
    setHabits((current) => [...current, habit])
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
        }
      }),
    )
  }

  return { habits, addHabit, deleteHabit, resetHabit }
}
