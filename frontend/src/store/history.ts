import { atom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'

export interface HistoryEntry {
  id: string
  expression: string
  result: string
  timestamp: number
}

export const historyAtom = atomWithStorage<HistoryEntry[]>(
  'calculator-history',
  [],
  undefined,
  { getOnInit: true },
)

export const addHistoryEntryAtom = atom(
  null,
  (get, set, entry: Omit<HistoryEntry, 'id' | 'timestamp'>) => {
    const next: HistoryEntry = {
      ...entry,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    }
    set(historyAtom, [next, ...get(historyAtom)].slice(0, 50))
  },
)

export const clearHistoryAtom = atom(null, (_get, set) => {
  set(historyAtom, [])
})
