import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createStore } from 'jotai'
import { addHistoryEntryAtom, clearHistoryAtom, historyAtom } from './history'

describe('history store', () => {
  beforeEach(() => {
    localStorage.clear()
  })
  afterEach(() => {
    localStorage.clear()
  })

  it('starts empty', () => {
    const store = createStore()
    expect(store.get(historyAtom)).toEqual([])
  })

  it('prepends new entries (most recent first)', () => {
    const store = createStore()
    store.set(addHistoryEntryAtom, { expression: '2+3', result: '5' })
    store.set(addHistoryEntryAtom, { expression: '4+4', result: '8' })

    const history = store.get(historyAtom)
    expect(history).toHaveLength(2)
    expect(history[0]).toMatchObject({ expression: '4+4', result: '8' })
    expect(history[1]).toMatchObject({ expression: '2+3', result: '5' })
  })

  it('assigns a unique id and timestamp to each entry', () => {
    const store = createStore()
    store.set(addHistoryEntryAtom, { expression: '1+1', result: '2' })
    store.set(addHistoryEntryAtom, { expression: '2+2', result: '4' })

    const [newer, older] = store.get(historyAtom)
    expect(newer.id).not.toBe(older.id)
    expect(typeof newer.timestamp).toBe('number')
  })

  it('caps history at 50 entries, dropping the oldest', () => {
    const store = createStore()
    for (let i = 0; i < 55; i++) {
      store.set(addHistoryEntryAtom, { expression: `${i}+1`, result: String(i + 1) })
    }

    const history = store.get(historyAtom)
    expect(history).toHaveLength(50)
    // Most recent (i=54) is first; the oldest 5 entries (i=0..4) were dropped.
    expect(history[0]).toMatchObject({ expression: '54+1' })
    expect(history[49]).toMatchObject({ expression: '5+1' })
  })

  it('clears all entries', () => {
    const store = createStore()
    store.set(addHistoryEntryAtom, { expression: '2+3', result: '5' })
    store.set(clearHistoryAtom)

    expect(store.get(historyAtom)).toEqual([])
  })

  it('persists entries to localStorage under the expected key', () => {
    const store = createStore()
    store.set(addHistoryEntryAtom, { expression: '2+3', result: '5' })

    const raw = localStorage.getItem('calculator-history')
    expect(raw).not.toBeNull()
    const parsed = JSON.parse(raw!)
    expect(parsed).toHaveLength(1)
    expect(parsed[0]).toMatchObject({ expression: '2+3', result: '5' })
  })
})
