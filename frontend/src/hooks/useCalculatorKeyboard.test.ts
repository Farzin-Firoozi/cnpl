import { describe, expect, it, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useCalculatorKeyboard } from './useCalculatorKeyboard'
import type { CalculatorEngine } from './useCalculatorEngine'

function makeFakeEngine(): CalculatorEngine {
  return {
    display: '0',
    accumulator: null,
    pendingOp: null,
    overwrite: true,
    error: null,
    isPending: false,
    percentLabel: null,
    history: [],
    inputDigit: vi.fn(),
    inputDecimal: vi.fn(),
    backspace: vi.fn(),
    toggleSign: vi.fn(),
    clear: vi.fn(),
    clearEntry: vi.fn(),
    chooseOp: vi.fn().mockResolvedValue(undefined),
    equals: vi.fn().mockResolvedValue(undefined),
    percent: vi.fn().mockResolvedValue(undefined),
    sqrtDisplay: vi.fn().mockResolvedValue(undefined),
    applyHistoryEntry: vi.fn(),
    clearHistory: vi.fn(),
  }
}

function press(key: string) {
  window.dispatchEvent(new KeyboardEvent('keydown', { key, cancelable: true }))
}

describe('useCalculatorKeyboard', () => {
  it('routes digit keys to inputDigit', () => {
    const engine = makeFakeEngine()
    renderHook(() => useCalculatorKeyboard(engine))

    press('7')
    expect(engine.inputDigit).toHaveBeenCalledWith('7')

    press('0')
    expect(engine.inputDigit).toHaveBeenCalledWith('0')
  })

  it('routes "." to inputDecimal', () => {
    const engine = makeFakeEngine()
    renderHook(() => useCalculatorKeyboard(engine))

    press('.')
    expect(engine.inputDecimal).toHaveBeenCalledTimes(1)
  })

  it.each([
    ['+', 'add'],
    ['-', 'subtract'],
    ['*', 'multiply'],
    ['/', 'divide'],
    ['^', 'power'],
  ] as const)('routes %s to chooseOp(%s)', (key, op) => {
    const engine = makeFakeEngine()
    renderHook(() => useCalculatorKeyboard(engine))

    press(key)
    expect(engine.chooseOp).toHaveBeenCalledWith(op)
  })

  it('prevents default browser behavior for operator keys (e.g. "/" quick-find)', () => {
    const engine = makeFakeEngine()
    renderHook(() => useCalculatorKeyboard(engine))

    const event = new KeyboardEvent('keydown', { key: '/', cancelable: true })
    window.dispatchEvent(event)
    expect(event.defaultPrevented).toBe(true)
  })

  it('routes both Enter and = to equals', () => {
    const engine = makeFakeEngine()
    renderHook(() => useCalculatorKeyboard(engine))

    press('Enter')
    press('=')
    expect(engine.equals).toHaveBeenCalledTimes(2)
  })

  it('routes Backspace to backspace', () => {
    const engine = makeFakeEngine()
    renderHook(() => useCalculatorKeyboard(engine))

    press('Backspace')
    expect(engine.backspace).toHaveBeenCalledTimes(1)
  })

  it('routes Escape, "c", and "C" to clear', () => {
    const engine = makeFakeEngine()
    renderHook(() => useCalculatorKeyboard(engine))

    press('Escape')
    press('c')
    press('C')
    expect(engine.clear).toHaveBeenCalledTimes(3)
  })

  it('routes "%" to percent', () => {
    const engine = makeFakeEngine()
    renderHook(() => useCalculatorKeyboard(engine))

    press('%')
    expect(engine.percent).toHaveBeenCalledTimes(1)
  })

  it('ignores unrelated keys without throwing', () => {
    const engine = makeFakeEngine()
    renderHook(() => useCalculatorKeyboard(engine))

    expect(() => press('ArrowUp')).not.toThrow()
    expect(() => press('Tab')).not.toThrow()
    expect(() => press('a')).not.toThrow()
    expect(engine.inputDigit).not.toHaveBeenCalled()
    expect(engine.chooseOp).not.toHaveBeenCalled()
  })

  it('removes its listener on unmount', () => {
    const engine = makeFakeEngine()
    const { unmount } = renderHook(() => useCalculatorKeyboard(engine))
    unmount()

    press('5')
    expect(engine.inputDigit).not.toHaveBeenCalled()
  })

  it('rebinds to a new engine instance when the engine changes', () => {
    const engineA = makeFakeEngine()
    const engineB = makeFakeEngine()
    const { rerender } = renderHook(({ engine }) => useCalculatorKeyboard(engine), {
      initialProps: { engine: engineA },
    })

    press('1')
    expect(engineA.inputDigit).toHaveBeenCalledWith('1')

    rerender({ engine: engineB })
    press('2')
    expect(engineB.inputDigit).toHaveBeenCalledWith('2')
  })
})
