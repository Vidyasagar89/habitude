import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import { exportBackup, parseBackup, type HabitsBackup } from './backup'
import { PALETTE, gradientFor } from './palette'
import { ME_PERSON_ID, usePeople } from './people'
import { checkForUpdate } from './pwa'
import { Sheet } from './Sheet'
import {
  daysInMonth,
  daysSince,
  formatShortDate,
  joinISODate,
  monthName,
  splitISODate,
  todayISODate,
} from './dateUtils'
import { ToastStack } from './Toast'
import type { Habit, Person } from './types'
import { useHabits } from './useHabits'

type SortMode = 'streak' | 'name' | 'newest'
const SORT_LABELS: Record<SortMode, string> = {
  streak: 'Longest streak first',
  name: 'Name (A–Z)',
  newest: 'Newest first',
}
const SORT_CYCLE: SortMode[] = ['streak', 'name', 'newest']
const TOAST_DURATION_MS = 4000

type FormState = { mode: 'add' } | { mode: 'edit'; habit: Habit }

function App() {
  const { habits, addHabit, editHabit, deleteHabit, resetHabit, replaceHabits, initialToasts } =
    useHabits()
  const { people, addPerson, replacePeople } = usePeople()
  const [formState, setFormState] = useState<FormState | null>(null)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [actionsFor, setActionsFor] = useState<Habit | null>(null)
  const [pendingImport, setPendingImport] = useState<HabitsBackup | null>(null)
  const [sortMode, setSortMode] = useState<SortMode>('streak')
  const [personFilter, setPersonFilter] = useState<string | null>(null)
  const [toasts, setToasts] = useState(initialToasts)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const sortedHabits = useMemo(() => sortHabits(habits, sortMode), [habits, sortMode])
  const visibleHabits = personFilter
    ? sortedHabits.filter((h) => h.personId === personFilter)
    : sortedHabits

  function cycleSort() {
    const next = SORT_CYCLE[(SORT_CYCLE.indexOf(sortMode) + 1) % SORT_CYCLE.length]
    setSortMode(next)
  }

  function dismissToast(id: string) {
    setToasts((current) => current.filter((t) => t.id !== id))
  }

  function pushToast(text: string) {
    const id = crypto.randomUUID()
    setToasts((current) => [...current, { id, text }])
    setTimeout(() => dismissToast(id), TOAST_DURATION_MS)
  }

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = '' // so picking the same file again still fires onChange
    if (!file) return

    const parsed = parseBackup(await file.text())
    if (!parsed) {
      pushToast("That doesn't look like a Habitude backup file.")
      return
    }
    setPendingImport(parsed)
  }

  function confirmImport() {
    if (!pendingImport) return
    replaceHabits(pendingImport.habits)
    // Older backups (from before people existed) carry no people at all —
    // leave the current device's people list alone rather than wipe it.
    if (pendingImport.people.length > 0) replacePeople(pendingImport.people)
    const count = pendingImport.habits.length
    pushToast(`Imported ${count} habit${count === 1 ? '' : 's'}.`)
    setPendingImport(null)
    setIsSettingsOpen(false)
  }

  async function handleCheckForUpdate() {
    setIsSettingsOpen(false)
    const supported = await checkForUpdate()
    if (!supported) {
      pushToast("Can't check for updates in this browser session — try reopening the app.")
      return
    }
    pushToast('Checking for updates…')
    // If a new version is found it's applied automatically and the page
    // reloads on its own within a moment — this toast only shows if that
    // doesn't happen, i.e. there was nothing to update.
    setTimeout(() => pushToast("You're on the latest version."), 3000)
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
          aria-label="Settings"
          type="button"
          onClick={() => setIsSettingsOpen(true)}
        >
          <GearIcon />
        </button>
        <h1>Habitude</h1>
        <div className="topbar-actions">
          <button
            className="icon-btn"
            aria-label={`Sort: ${SORT_LABELS[sortMode]}. Tap to change.`}
            type="button"
            onClick={cycleSort}
          >
            <SortIcon />
          </button>
          <button
            className="icon-btn"
            aria-label="Add habit"
            type="button"
            onClick={() => setFormState({ mode: 'add' })}
          >
            <PlusIcon />
          </button>
        </div>
      </header>

      {habits.length > 1 && <p className="sort-label">{SORT_LABELS[sortMode]}</p>}

      {people.length > 1 && (
        <div className="person-filter-row">
          <PersonChip
            label="All"
            selected={personFilter === null}
            onClick={() => setPersonFilter(null)}
          />
          {people.map((person) => (
            <PersonChip
              key={person.id}
              label={person.name}
              selected={personFilter === person.id}
              onClick={() => setPersonFilter(person.id)}
            />
          ))}
        </div>
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
        ) : visibleHabits.length === 0 ? (
          <div className="empty-state">
            <span className="empty-emoji" aria-hidden="true">
              🔥
            </span>
            <h2>No habits here</h2>
            <p>{personName(people, personFilter)} doesn't have any habits yet.</p>
          </div>
        ) : (
          <ul className="habit-grid">
            {visibleHabits.map((habit) => (
              <HabitCard
                key={habit.id}
                habit={habit}
                ownerName={people.length > 1 ? personName(people, habit.personId) : null}
                onOpenActions={() => setActionsFor(habit)}
              />
            ))}
          </ul>
        )}
      </main>

      <Sheet open={formState !== null} onClose={() => setFormState(null)}>
        {formState && (
          <HabitForm
            initial={formState.mode === 'edit' ? formState.habit : undefined}
            submitLabel={formState.mode === 'edit' ? 'Save changes' : 'Add habit'}
            people={people}
            onAddPerson={addPerson}
            onSubmit={(name, colorIndex, startDate, personId) => {
              if (formState.mode === 'edit') {
                editHabit(formState.habit.id, { name, colorIndex, startDate, personId })
              } else {
                addHabit(name, colorIndex, startDate, personId)
              }
              setFormState(null)
            }}
            onCancel={() => setFormState(null)}
          />
        )}
      </Sheet>

      <Sheet open={actionsFor !== null} onClose={() => setActionsFor(null)}>
        {actionsFor && (
          <HabitActions
            habit={actionsFor}
            onEdit={() => {
              setFormState({ mode: 'edit', habit: actionsFor })
              setActionsFor(null)
            }}
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

      <Sheet open={isSettingsOpen} onClose={() => setIsSettingsOpen(false)}>
        <div className="actions-sheet">
          <p className="sheet-title">Backup</p>
          <button
            type="button"
            className="sheet-option"
            onClick={() => {
              exportBackup(habits, people)
              setIsSettingsOpen(false)
            }}
            disabled={habits.length === 0}
          >
            Export data
          </button>
          <button
            type="button"
            className="sheet-option"
            onClick={() => fileInputRef.current?.click()}
          >
            Import data
          </button>
          <p className="sheet-title">App</p>
          <button type="button" className="sheet-option" onClick={handleCheckForUpdate}>
            Check for updates
          </button>
          <button
            type="button"
            className="sheet-option sheet-option-muted"
            onClick={() => setIsSettingsOpen(false)}
          >
            Close
          </button>
        </div>
      </Sheet>

      <input
        ref={fileInputRef}
        type="file"
        accept="application/json"
        onChange={handleFileSelected}
        style={{ display: 'none' }}
      />

      <Sheet open={pendingImport !== null} onClose={() => setPendingImport(null)}>
        {pendingImport && (
          <div className="actions-sheet">
            <p className="sheet-title">
              Replace your {habits.length} habit{habits.length === 1 ? '' : 's'} with{' '}
              {pendingImport.habits.length} from this file?
            </p>
            <button type="button" className="sheet-option sheet-option-danger" onClick={confirmImport}>
              Yes, import
            </button>
            <button
              type="button"
              className="sheet-option sheet-option-muted"
              onClick={() => setPendingImport(null)}
            >
              Cancel
            </button>
          </div>
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

function personName(people: Person[], personId: string | null): string {
  return people.find((p) => p.id === personId)?.name ?? 'Someone'
}

function PersonChip({
  label,
  selected,
  onClick,
}: {
  label: string
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      className={`person-chip${selected ? ' person-chip-selected' : ''}`}
      onClick={onClick}
    >
      {label}
    </button>
  )
}

function HabitCard({
  habit,
  ownerName,
  onOpenActions,
}: {
  habit: Habit
  ownerName: string | null
  onOpenActions: () => void
}) {
  const days = daysSince(habit.startDate)
  const everReset = habit.startDate !== habit.createdAt
  const dateLabel = everReset
    ? `Reset on ${formatShortDate(habit.startDate)}`
    : `Started on ${formatShortDate(habit.createdAt)}`

  return (
    <li
      className={`habit-card${ownerName ? ' has-owner' : ''}`}
      style={{ background: gradientFor(habit.colorIndex) }}
    >
      {ownerName && <span className="card-owner-badge">{ownerName}</span>}
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
  onEdit,
  onReset,
  onConfirmDelete,
  onCancel,
}: {
  habit: Habit
  onEdit: () => void
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
      <button type="button" className="sheet-option" onClick={onEdit}>
        Edit habit
      </button>
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

function HabitForm({
  initial,
  submitLabel,
  people,
  onAddPerson,
  onSubmit,
  onCancel,
}: {
  initial?: { name: string; colorIndex: number; startDate: string; personId: string }
  submitLabel: string
  people: Person[]
  onAddPerson: (name: string) => string
  onSubmit: (name: string, colorIndex: number, startDate: string, personId: string) => void
  onCancel: () => void
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [colorIndex, setColorIndex] = useState(initial?.colorIndex ?? 0)
  const [startDate, setStartDate] = useState(initial?.startDate ?? todayISODate())
  const [personId, setPersonId] = useState(initial?.personId ?? ME_PERSON_ID)
  const [isAddingPerson, setIsAddingPerson] = useState(false)
  const [newPersonName, setNewPersonName] = useState('')

  // Plain day/month/year <select>s instead of <input type="date">: the
  // native picker overlay depends on browser chrome that a standalone
  // home-screen PWA doesn't have, and hangs there on iOS — a WebKit bug in
  // the native control itself, not fixable from here. Dropdowns never
  // invoke that overlay at all.
  const { year, month, day } = splitISODate(startDate)
  const today = splitISODate(todayISODate())
  const maxMonth = year === today.year ? today.month : 12
  const maxDay = year === today.year && month === today.month ? today.day : daysInMonth(year, month)
  const years = Array.from({ length: 101 }, (_, i) => today.year - i)
  const months = Array.from({ length: maxMonth }, (_, i) => i + 1)
  const days = Array.from({ length: maxDay }, (_, i) => i + 1)

  function updateStartDate(changes: Partial<{ year: number; month: number; day: number }>) {
    const next = { year, month, day, ...changes }
    setStartDate(joinISODate(next.year, next.month, next.day))
  }

  function confirmNewPerson() {
    const trimmed = newPersonName.trim()
    if (!trimmed) return
    setPersonId(onAddPerson(trimmed))
    setNewPersonName('')
    setIsAddingPerson(false)
  }

  return (
    <form
      className="add-form"
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit(name, colorIndex, startDate, personId)
      }}
    >
      <p className="sheet-title">{initial ? 'Edit habit' : 'New habit'}</p>
      <input
        className="add-input"
        type="text"
        placeholder="e.g. No sugar"
        value={name}
        onChange={(e) => setName(e.target.value)}
        autoFocus
      />
      <div className="field">
        <span className="field-label">Start date</span>
        <div className="date-select-row">
          <select
            className="add-input date-select"
            aria-label="Day"
            value={day}
            onChange={(e) => updateStartDate({ day: Number(e.target.value) })}
          >
            {days.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <select
            className="add-input date-select"
            aria-label="Month"
            value={month}
            onChange={(e) => updateStartDate({ month: Number(e.target.value) })}
          >
            {months.map((m) => (
              <option key={m} value={m}>
                {monthName(m)}
              </option>
            ))}
          </select>
          <select
            className="add-input date-select"
            aria-label="Year"
            value={year}
            onChange={(e) => updateStartDate({ year: Number(e.target.value) })}
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="field">
        <span className="field-label">For</span>
        <div className="person-row">
          {people.map((person) => (
            <PersonChip
              key={person.id}
              label={person.name}
              selected={personId === person.id}
              onClick={() => setPersonId(person.id)}
            />
          ))}
          <PersonChip label="+ Add" selected={false} onClick={() => setIsAddingPerson(true)} />
        </div>
        {isAddingPerson && (
          <div className="person-add-row">
            <input
              className="add-input"
              type="text"
              placeholder="Family member's name"
              value={newPersonName}
              onChange={(e) => setNewPersonName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  confirmNewPerson()
                }
              }}
              autoFocus
            />
            <button type="button" className="text-btn" disabled={!newPersonName.trim()} onClick={confirmNewPerson}>
              Add
            </button>
          </div>
        )}
      </div>
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
          {submitLabel}
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

function GearIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
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
