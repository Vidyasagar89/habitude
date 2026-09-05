import { useEffect, useState } from 'react'
import type { Person } from './types'

const STORAGE_KEY = 'habitude.people.v1'

/** The person every habit belongs to until you add someone else. Stable so old data always resolves. */
export const ME_PERSON_ID = 'me'
const DEFAULT_PEOPLE: Person[] = [{ id: ME_PERSON_ID, name: 'Me' }]

function loadPeople(): Person[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_PEOPLE
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_PEOPLE
  } catch {
    return DEFAULT_PEOPLE
  }
}

function savePeople(people: Person[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(people))
  } catch {
    // Ignore — same tradeoff as storage.ts for habits.
  }
}

export function usePeople() {
  const [people, setPeople] = useState<Person[]>(loadPeople)

  useEffect(() => {
    savePeople(people)
  }, [people])

  /** Adds a new person (e.g. a family member) and returns their id. */
  function addPerson(name: string): string {
    const trimmed = name.trim()
    if (!trimmed) return ME_PERSON_ID

    const existing = people.find((p) => p.name.toLowerCase() === trimmed.toLowerCase())
    if (existing) return existing.id

    const person: Person = { id: crypto.randomUUID(), name: trimmed }
    setPeople((current) => [...current, person])
    return person.id
  }

  /** Wholesale replace all people — used when importing a backup file. */
  function replacePeople(newPeople: Person[]) {
    setPeople(newPeople)
  }

  return { people, addPerson, replacePeople }
}
