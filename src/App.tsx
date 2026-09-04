import { useState } from 'react'
import './App.css'
import { daysSince, formatShortDate } from './dateUtils'
import type { Habit } from './types'
import { useHabits } from './useHabits'

function App() {
  const { habits, addHabit, deleteHabit, resetHabit } = useHabits()
  const [isAdding, setIsAdding] = useState(false)

  return (
    <div className="app">
      <header className="topbar">
        <button className="icon-btn" aria-label="Sort habits" type="button">
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

      {isAdding && (
        <AddHabitForm
          onAdd={(name) => {
            addHabit(name)
            setIsAdding(false)
          }}
          onCancel={() => setIsAdding(false)}
        />
      )}

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
          <ul className="habit-list">
            {habits.map((habit) => (
              <HabitRow
                key={habit.id}
                habit={habit}
                onDelete={() => deleteHabit(habit.id)}
                onReset={() => resetHabit(habit.id)}
              />
            ))}
          </ul>
        )}
      </main>
    </div>
  )
}

function HabitRow({
  habit,
  onDelete,
  onReset,
}: {
  habit: Habit
  onDelete: () => void
  onReset: () => void
}) {
  const days = daysSince(habit.startDate)
  const everReset = habit.startDate !== habit.createdAt
  const dateLabel = everReset
    ? `Reset on ${formatShortDate(habit.startDate)}`
    : `Started on ${formatShortDate(habit.createdAt)}`

  return (
    <li className="habit-row">
      <div className="habit-info">
        <p className="habit-name">{habit.name}</p>
        <p className="habit-date">{dateLabel}</p>
      </div>
      <div className="habit-count">
        <span className="habit-days">{days}</span>
        <span className="habit-days-label">days</span>
      </div>
      <div className="habit-actions">
        <button
          type="button"
          className="text-btn"
          onClick={() => {
            if (confirm(`Reset "${habit.name}"? This starts a new streak from today.`)) {
              onReset()
            }
          }}
        >
          Reset
        </button>
        <button
          type="button"
          className="text-btn text-btn-danger"
          onClick={() => {
            if (confirm(`Delete "${habit.name}"? This can't be undone.`)) {
              onDelete()
            }
          }}
        >
          Delete
        </button>
      </div>
    </li>
  )
}

function AddHabitForm({
  onAdd,
  onCancel,
}: {
  onAdd: (name: string) => void
  onCancel: () => void
}) {
  const [name, setName] = useState('')

  return (
    <form
      className="add-form"
      onSubmit={(e) => {
        e.preventDefault()
        onAdd(name)
      }}
    >
      <input
        className="add-input"
        type="text"
        placeholder="Habit name, e.g. No sugar"
        value={name}
        onChange={(e) => setName(e.target.value)}
        autoFocus
      />
      <button type="submit" className="text-btn" disabled={!name.trim()}>
        Add
      </button>
      <button type="button" className="text-btn text-btn-muted" onClick={onCancel}>
        Cancel
      </button>
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

export default App
