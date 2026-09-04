/** Day counts worth celebrating. Kept ascending. */
export const MILESTONES = [7, 14, 30, 50, 100, 200, 365, 500, 1000] as const

/** The highest milestone reached at `days`, or undefined if none yet. */
export function highestMilestoneReached(days: number): number | undefined {
  let reached: number | undefined
  for (const milestone of MILESTONES) {
    if (days >= milestone) reached = milestone
  }
  return reached
}
