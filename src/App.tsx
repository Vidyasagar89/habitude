import { useEffect, useMemo, useState } from 'react'
import './App.css'
import { PALETTE, gradientFor } from './palette'
import { Sheet } from './Sheet'
import { daysSince, formatShortDate } from './dateUtils'
import { ToastStack } from './Toast'
import type { Habit } from './types'
import { useHabits } from './useHabits'

type SortMode = 'streak' | 'name' | 'newest'
const SORT_LABELS: Record<SortMode, string> = {
  streak: 'Longest streak first',
  name: 'Name (A–Z)',
  newest: 'Newest first',
}
const SORT_CYCLE: SortMode[] = ['streak', 'name', 'newest']
const TOAST_DURATION_MS = 4000

function App() {
  const { habits, addHabit, deleteHabit, resetHabit, initialToasts } = useHabits()
  const [isAdding, setIsAdding] = useState(false)
  const [actionsFor, setActionsFor] = useState<Habit | null>(null)
  const [sortMode, setSortMode] = useState<SortMode>('streak')
  const [toasts, setToasts] = useState(initialToasts)

  const sortedHabits = useMemo(() => sortHabits(habits, sortMode), [habits, sortMode])

  function cycleSort() {
    const next = SORT_CYCLE[(SORT_CYCLE.indexOf(sortMode) + 1) % SORT_CYCLE.length]
    setSortMode(next)
  }

  function dismissToast(id: string) {
    setToasts((current) => current.filter((t) => t.id !== id))
  }

  // Auto-dismiss the milestone toasts computed at startup. Only depends on
  // `initialToasts`, which useHabits computes once and never changes.
  useEffect(() => {
    const timers = initialToasts.map((t) => setTimeout(() => dismissToast(t.id), TOAST_DURATION_MS))
    return () => timers.forEach(clearTimeout)
  }, [initialToasts])

  return (
    <div className="app">
      <header className="topbar">
        <button
          className="icon-btn"
          aria-label={`Sort: ${SORT_LABELS[sortMode]}. Tap to change.`}
          type="button"
          onClick={cycleSort}
        >
          <SortIcon />
        </button>
        <h1>Habitude</h1>
        <button
          className="icon-btn"
          aria-label="Add habit"
          type="button"
          onClick={() => setIsAdding(true)}
        >
          <PlusIcon />
        </button>
      </header>

      {habits.length > 1 && <p className="sort-label">{SORT_LABELS[sortMode]}</p>}

      <main className="content">
        {habits.length === 0 ? (
          <div className="empty-state">
            <span className="empty-emoji" aria-hidden="true">
              🔥
            </span>
            <h2>No habits yet</h2>
            <p>Start your first streak to see it here.</p>
          </div>
        ) : (
          <ul className="habit-grid">
            {sortedHabits.map((habit) => (
              <HabitCard
                key={habit.id}
                habit={habit}
                onOpenActions={() => setActionsFor(habit)}
              />
            ))}
          </ul>
        )}
      </main>

      <Sheet open={isAdding} onClose={() => setIsAdding(false)}>
        <AddHabitForm
          onAdd={(name, colorIndex) => {
            addHabit(name, colorIndex)
            setIsAdding(false)
          }}
          onCancel={() => setIsAdding(false)}
        />
      </Sheet>

      <Sheet open={actionsFor !== null} onClose={() => setActionsFor(null)}>
        {actionsFor && (
          <HabitActions
            habit={actionsFor}
            onReset={() => {
              resetHabit(actionsFor.id)
              setActionsFor(null)
            }}
            onConfirmDelete={() => {
              deleteHabit(actionsFor.id)
              setActionsFor(null)
            }}
            onCancel={() => setActionsFor(null)}
          />
        )}
      </Sheet>

      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </div>
  )
}

function sortHabits(habits: Habit[], mode: SortMode): Habit[] {
  const copy = [...habits]
  switch (mode) {
    case 'name':
      return copy.sort((a, b) => a.name.localeCompare(b.name))
    case 'newest':
      return copy.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    case 'streak':
    default:
      return copy.sort((a, b) => daysSince(b.startDate) - daysSince(a.startDate))
  }
}

function HabitCard({
  habit,
  onOpenActions,
}: {
  habit: Habit
  onOpenActions: () => void
}) {
  const days = daysSince(habit.startDate)
  const everReset = habit.startDate !== habit.createdAt
  const dateLabel = everReset
    ? `Reset on ${formatShortDate(habit.startDate)}`
    : `Started on ${formatShortDate(habit.createdAt)}`

  return (
    <li
      className="habit-card"
      style={{ background: gradientFor(habit.colorIndex) }}
    >
      <button
        className="card-menu-btn"
        type="button"
        aria-label={`Options for ${habit.name}`}
        onClick={onOpenActions}
      >
        <DotsIcon />
      </button>
      <div className="card-count">
        <span className="card-days">{days}</span>
        <span className="card-days-label">days</span>
      </div>
      <div className="card-footer">
        <p className="card-name">{habit.name}</p>
        <p className="card-date">{dateLabel}</p>
        {habit.bestStreakDays > days && (
          <p className="card-best">🏆 Best: {habit.bestStreakDays} days</p>
        )}
      </div>
    </li>
  )
}

function HabitActions({
  habit,
  onReset,
  onConfirmDelete,
  onCancel,
}: {
  habit: Habit
  onReset: () => void
  onConfirmDelete: () => void
  onCancel: () => void
}) {
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  if (confirmingDelete) {
    return (
      <div className="actions-sheet">
        <p className="sheet-title">Delete "{habit.name}"? This can't be undone.</p>
        <button type="button" className="sheet-option sheet-option-danger" onClick={onConfirmDelete}>
          Yes, delete it
        </button>
        <button
          type="button"
          className="sheet-option sheet-option-muted"
          onClick={() => setConfirmingDelete(false)}
        >
          Cancel
        </button>
      </div>
    )
  }

  return (
    <div className="actions-sheet">
      <p className="sheet-title">{habit.name}</p>
      <button type="button" className="sheet-option" onClick={onReset}>
        Reset streak
      </button>
      <button
        type="button"
        className="sheet-option sheet-option-danger"
        onClick={() => setConfirmingDelete(true)}
      >
        Delete habit
      </button>
      <button type="button" className="sheet-option sheet-option-muted" onClick={onCancel}>
        Cancel
      </button>
    </div>
  )
}

function AddHabitForm({
  onAdd,
  onCancel,
}: {
  onAdd: (name: string, colorIndex: number) => void
  onCancel: () => void
}) {
  const [name, setName] = useState('')
  const [colorIndex, setColorIndex] = useState(0)

  return (
    <form
      className="add-form"
      onSubmit={(e) => {
        e.preventDefault()
        onAdd(name, colorIndex)
      }}
    >
      <p className="sheet-title">New habit</p>
      <input
        className="add-input"
        type="text"
        placeholder="e.g. No sugar"
        value={name}
        onChange={(e) => setName(e.target.value)}
        autoFocus
      />
      <div className="swatch-row">
        {PALETTE.map((color, index) => (
          <button
            key={color.name}
            type="button"
            aria-label={color.name}
            aria-pressed={colorIndex === index}
            className={`swatch${colorIndex === index ? ' swatch-selected' : ''}`}
            style={{ background: `linear-gradient(135deg, ${color.from}, ${color.to})` }}
            onClick={() => setColorIndex(index)}
          />
        ))}
      </div>
      <div className="sheet-buttons">
        <button type="button" className="text-btn text-btn-muted" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="text-btn" disabled={!name.trim()}>
          Add habit
        </button>
      </div>
    </form>
  )
}

function SortIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path
        d="M7 4v16m0 0-3-3m3 3 3-3M17 20V4m0 0 3 3m-3-3-3 3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 5v14M5 12h14"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

function DotsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="5" cy="12" r="2" />
      <circle cx="12" cy="12" r="2" />
      <circle cx="19" cy="12" r="2" />
    </svg>
  )
}

export default App
