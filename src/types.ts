export interface Habit {
  id: string
  name: string
  /** ISO date (YYYY-MM-DD) the habit was first created. Never changes. */
  createdAt: string
  /** ISO date (YYYY-MM-DD) the current streak started counting from. */
  startDate: string
  /** Longest streak ever recorded for this habit, in whole days. */
  bestStreakDays: number
}
