import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useCalculatorEngine } from './useCalculatorEngine'

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  })
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

describe('useCalculatorEngine', () => {
  beforeEach(() => {
    localStorage.clear()
  })
  afterEach(() => {
    localStorage.clear()
  })

  it('starts at 0 in overwrite mode', () => {
    const { result } = renderHook(() => useCalculatorEngine(), { wrapper })
    expect(result.current.display).toBe('0')
    expect(result.current.overwrite).toBe(true)
  })

  it('accumulates typed digits', () => {
    const { result } = renderHook(() => useCalculatorEngine(), { wrapper })
    act(() => result.current.inputDigit('1'))
    act(() => result.current.inputDigit('2'))
    act(() => result.current.inputDigit('3'))
    expect(result.current.display).toBe('123')
  })

  it('ignores a second decimal point', () => {
    const { result } = renderHook(() => useCalculatorEngine(), { wrapper })
    act(() => result.current.inputDigit('1'))
    act(() => result.current.inputDecimal())
    act(() => result.current.inputDigit('5'))
    act(() => result.current.inputDecimal())
    expect(result.current.display).toBe('1.5')
  })

  it('performs addition against the backend and records history', async () => {
    const { result } = renderHook(() => useCalculatorEngine(), { wrapper })
    act(() => result.current.inputDigit('2'))
    await act(() => result.current.chooseOp('add'))
    act(() => result.current.inputDigit('3'))
    await act(() => result.current.equals())

    await waitFor(() => expect(result.current.display).toBe('5'))
    expect(result.current.pendingOp).toBeNull()
    expect(result.current.history[0]).toMatchObject({ expression: '2+3', result: '5' })
  })

  it('chains operators, evaluating the pending one first', async () => {
    const { result } = renderHook(() => useCalculatorEngine(), { wrapper })
    act(() => result.current.inputDigit('2'))
    await act(() => result.current.chooseOp('add'))
    act(() => result.current.inputDigit('3'))
    await act(() => result.current.chooseOp('multiply'))
    act(() => result.current.inputDigit('4'))
    await act(() => result.current.equals())

    await waitFor(() => expect(result.current.display).toBe('20'))
  })

  it('repeats the last operation on subsequent equals presses', async () => {
    const { result } = renderHook(() => useCalculatorEngine(), { wrapper })
    act(() => result.current.inputDigit('5'))
    await act(() => result.current.chooseOp('add'))
    act(() => result.current.inputDigit('3'))
    await act(() => result.current.equals())
    await waitFor(() => expect(result.current.display).toBe('8'))

    await act(() => result.current.equals())
    await waitFor(() => expect(result.current.display).toBe('11'))

    await act(() => result.current.equals())
    await waitFor(() => expect(result.current.display).toBe('14'))
  })

  it('reuses the same operand when equals is pressed right after an operator', async () => {
    const { result } = renderHook(() => useCalculatorEngine(), { wrapper })
    act(() => result.current.inputDigit('5'))
    await act(() => result.current.chooseOp('add'))
    await act(() => result.current.equals())

    await waitFor(() => expect(result.current.display).toBe('10'))
  })

  it('surfaces a 422 division-by-zero error from the backend', async () => {
    const { result } = renderHook(() => useCalculatorEngine(), { wrapper })
    act(() => result.current.inputDigit('1'))
    await act(() => result.current.chooseOp('divide'))
    act(() => result.current.inputDigit('0'))
    await act(() => result.current.equals())

    await waitFor(() => expect(result.current.error).toBe('division by zero'))
  })

  it('toggles the sign without calling the backend', () => {
    const { result } = renderHook(() => useCalculatorEngine(), { wrapper })
    act(() => result.current.inputDigit('5'))
    act(() => result.current.toggleSign())
    expect(result.current.display).toBe('-5')
    act(() => result.current.toggleSign())
    expect(result.current.display).toBe('5')
  })

  it('clears back to the initial state', () => {
    const { result } = renderHook(() => useCalculatorEngine(), { wrapper })
    act(() => result.current.inputDigit('9'))
    act(() => result.current.clear())
    expect(result.current.display).toBe('0')
    expect(result.current.overwrite).toBe(true)
  })

  it('clearEntry resets the current entry but keeps the pending operator', async () => {
    const { result } = renderHook(() => useCalculatorEngine(), { wrapper })
    act(() => result.current.inputDigit('2'))
    await act(() => result.current.chooseOp('add'))
    act(() => result.current.inputDigit('9'))
    act(() => result.current.clearEntry())

    expect(result.current.display).toBe('0')
    expect(result.current.pendingOp).toBe('add')
    expect(result.current.accumulator).toBe(2)
  })

  it('deletes the last digit with backspace', () => {
    const { result } = renderHook(() => useCalculatorEngine(), { wrapper })
    act(() => result.current.inputDigit('1'))
    act(() => result.current.inputDigit('2'))
    act(() => result.current.inputDigit('3'))
    act(() => result.current.backspace())
    expect(result.current.display).toBe('12')
  })

  it('computes an exponent via the power endpoint', async () => {
    const { result } = renderHook(() => useCalculatorEngine(), { wrapper })
    act(() => result.current.inputDigit('2'))
    await act(() => result.current.chooseOp('power'))
    act(() => result.current.inputDigit('8'))
    await act(() => result.current.equals())

    await waitFor(() => expect(result.current.display).toBe('256'))
  })

  it('computes a square root via the sqrt endpoint and records history', async () => {
    const { result } = renderHook(() => useCalculatorEngine(), { wrapper })
    act(() => result.current.inputDigit('8'))
    act(() => result.current.inputDigit('1'))
    await act(() => result.current.sqrtDisplay())

    await waitFor(() => expect(result.current.display).toBe('9'))
    expect(result.current.history[0]).toMatchObject({ expression: '√(81)', result: '9' })
  })

  it('surfaces a 422 error for the square root of a negative number', async () => {
    const { result } = renderHook(() => useCalculatorEngine(), { wrapper })
    act(() => result.current.inputDigit('5'))
    act(() => result.current.toggleSign())
    await act(() => result.current.sqrtDisplay())

    await waitFor(() =>
      expect(result.current.error).toBe('cannot take square root of a negative number'),
    )
  })

  it('converts a standalone entry to a plain fraction (50% -> 0.5)', async () => {
    const { result } = renderHook(() => useCalculatorEngine(), { wrapper })
    act(() => result.current.inputDigit('5'))
    act(() => result.current.inputDigit('0'))
    await act(() => result.current.percent())

    await waitFor(() => expect(result.current.display).toBe('0.5'))
  })

  it('treats a mid-expression entry as a percentage of the accumulator (200 + 10% -> 220)', async () => {
    const { result } = renderHook(() => useCalculatorEngine(), { wrapper })
    act(() => result.current.inputDigit('2'))
    act(() => result.current.inputDigit('0'))
    act(() => result.current.inputDigit('0'))
    await act(() => result.current.chooseOp('add'))
    act(() => result.current.inputDigit('1'))
    act(() => result.current.inputDigit('0'))
    await act(() => result.current.percent())
    await waitFor(() => expect(result.current.display).toBe('20'))

    await act(() => result.current.equals())
    await waitFor(() => expect(result.current.display).toBe('220'))
  })

  it('treats a mid-expression entry as a plain fraction after × (200 × 10% -> 20)', async () => {
    const { result } = renderHook(() => useCalculatorEngine(), { wrapper })
    act(() => result.current.inputDigit('2'))
    act(() => result.current.inputDigit('0'))
    act(() => result.current.inputDigit('0'))
    await act(() => result.current.chooseOp('multiply'))
    act(() => result.current.inputDigit('1'))
    act(() => result.current.inputDigit('0'))
    await act(() => result.current.percent())
    await waitFor(() => expect(result.current.display).toBe('0.1'))

    await act(() => result.current.equals())
    await waitFor(() => expect(result.current.display).toBe('20'))
  })

  it('treats a mid-expression entry as a plain fraction after ÷', async () => {
    const { result } = renderHook(() => useCalculatorEngine(), { wrapper })
    act(() => result.current.inputDigit('2'))
    act(() => result.current.inputDigit('0'))
    act(() => result.current.inputDigit('0'))
    await act(() => result.current.chooseOp('divide'))
    act(() => result.current.inputDigit('5'))
    act(() => result.current.inputDigit('0'))
    await act(() => result.current.percent())
    await waitFor(() => expect(result.current.display).toBe('0.5'))

    await act(() => result.current.equals())
    await waitFor(() => expect(result.current.display).toBe('400'))
  })

  it('reapplies a history entry as the current display', () => {
    const { result } = renderHook(() => useCalculatorEngine(), { wrapper })
    act(() =>
      result.current.applyHistoryEntry({
        id: 'x',
        expression: '2+3',
        result: '5',
        timestamp: Date.now(),
      }),
    )
    expect(result.current.display).toBe('5')
    expect(result.current.overwrite).toBe(true)
    expect(result.current.pendingOp).toBeNull()
  })

  // ---------------------------------------------------------------------
  // Digit / decimal entry edge cases
  // ---------------------------------------------------------------------

  describe('digit and decimal entry', () => {
    it('collapses a leading zero when a digit follows', () => {
      const { result } = renderHook(() => useCalculatorEngine(), { wrapper })
      act(() => result.current.inputDigit('0'))
      act(() => result.current.inputDigit('5'))
      expect(result.current.display).toBe('5')
    })

    it('allows multiple leading zeros to collapse only once a nonzero digit is typed', () => {
      const { result } = renderHook(() => useCalculatorEngine(), { wrapper })
      act(() => result.current.inputDigit('0'))
      act(() => result.current.inputDigit('0'))
      expect(result.current.display).toBe('0')
    })

    it('starts a decimal with "0." when pressed on a fresh overwrite state', () => {
      const { result } = renderHook(() => useCalculatorEngine(), { wrapper })
      act(() => result.current.inputDecimal())
      expect(result.current.display).toBe('0.')
    })

    it('appends digits after a decimal point', () => {
      const { result } = renderHook(() => useCalculatorEngine(), { wrapper })
      act(() => result.current.inputDecimal())
      act(() => result.current.inputDigit('2'))
      act(() => result.current.inputDigit('5'))
      expect(result.current.display).toBe('0.25')
    })

    it('caps entry length and ignores further digits past the max', () => {
      const { result } = renderHook(() => useCalculatorEngine(), { wrapper })
      act(() => {
        for (const d of '1234567890123456789') result.current.inputDigit(d)
      })
      expect(result.current.display.replace(/[-.]/g, '').length).toBeLessThanOrEqual(15)
    })

    it('starts a fresh number after a completed calculation (overwrite mode)', async () => {
      const { result } = renderHook(() => useCalculatorEngine(), { wrapper })
      act(() => result.current.inputDigit('2'))
      await act(() => result.current.chooseOp('add'))
      act(() => result.current.inputDigit('3'))
      await act(() => result.current.equals())
      await waitFor(() => expect(result.current.display).toBe('5'))

      act(() => result.current.inputDigit('9'))
      expect(result.current.display).toBe('9')
      expect(result.current.overwrite).toBe(false)
    })

    it('clears a displayed error when a new digit is typed', async () => {
      const { result } = renderHook(() => useCalculatorEngine(), { wrapper })
      act(() => result.current.inputDigit('1'))
      await act(() => result.current.chooseOp('divide'))
      act(() => result.current.inputDigit('0'))
      await act(() => result.current.equals())
      await waitFor(() => expect(result.current.error).toBe('division by zero'))

      act(() => result.current.inputDigit('7'))
      expect(result.current.error).toBeNull()
    })

    it('clears a displayed error when a decimal point is typed', async () => {
      const { result } = renderHook(() => useCalculatorEngine(), { wrapper })
      act(() => result.current.inputDigit('1'))
      await act(() => result.current.chooseOp('divide'))
      act(() => result.current.inputDigit('0'))
      await act(() => result.current.equals())
      await waitFor(() => expect(result.current.error).toBe('division by zero'))

      act(() => result.current.inputDecimal())
      expect(result.current.error).toBeNull()
    })
  })

  // ---------------------------------------------------------------------
  // Backspace edge cases
  // ---------------------------------------------------------------------

  describe('backspace', () => {
    it('falls back to "0" once the last digit is removed', () => {
      const { result } = renderHook(() => useCalculatorEngine(), { wrapper })
      act(() => result.current.inputDigit('7'))
      act(() => result.current.backspace())
      expect(result.current.display).toBe('0')
    })

    it('removes a bare negative sign back down to "0"', () => {
      const { result } = renderHook(() => useCalculatorEngine(), { wrapper })
      act(() => result.current.inputDigit('5'))
      act(() => result.current.toggleSign())
      act(() => result.current.backspace())
      act(() => result.current.backspace())
      expect(result.current.display).toBe('0')
    })

    it('removes a trailing decimal point', () => {
      const { result } = renderHook(() => useCalculatorEngine(), { wrapper })
      act(() => result.current.inputDigit('5'))
      act(() => result.current.inputDecimal())
      act(() => result.current.backspace())
      expect(result.current.display).toBe('5')
    })

    it('is a no-op immediately after a result (overwrite mode)', async () => {
      const { result } = renderHook(() => useCalculatorEngine(), { wrapper })
      act(() => result.current.inputDigit('2'))
      await act(() => result.current.chooseOp('add'))
      act(() => result.current.inputDigit('3'))
      await act(() => result.current.equals())
      await waitFor(() => expect(result.current.display).toBe('5'))

      act(() => result.current.backspace())
      expect(result.current.display).toBe('5')
    })

    it('is a no-op while an error is displayed', async () => {
      const { result } = renderHook(() => useCalculatorEngine(), { wrapper })
      act(() => result.current.inputDigit('1'))
      await act(() => result.current.chooseOp('divide'))
      act(() => result.current.inputDigit('0'))
      await act(() => result.current.equals())
      await waitFor(() => expect(result.current.error).toBe('division by zero'))

      act(() => result.current.backspace())
      expect(result.current.error).toBe('division by zero')
    })
  })

  // ---------------------------------------------------------------------
  // Sign toggle edge cases
  // ---------------------------------------------------------------------

  describe('toggleSign', () => {
    it('leaves "0" unsigned', () => {
      const { result } = renderHook(() => useCalculatorEngine(), { wrapper })
      act(() => result.current.toggleSign())
      expect(result.current.display).toBe('0')
    })

    it('toggles back and forth on a mid-entry number', () => {
      const { result } = renderHook(() => useCalculatorEngine(), { wrapper })
      act(() => result.current.inputDigit('4'))
      act(() => result.current.inputDigit('2'))
      act(() => result.current.toggleSign())
      expect(result.current.display).toBe('-42')
      act(() => result.current.toggleSign())
      expect(result.current.display).toBe('42')
    })

    it('applies to a freshly computed result', async () => {
      const { result } = renderHook(() => useCalculatorEngine(), { wrapper })
      act(() => result.current.inputDigit('2'))
      await act(() => result.current.chooseOp('add'))
      act(() => result.current.inputDigit('3'))
      await act(() => result.current.equals())
      await waitFor(() => expect(result.current.display).toBe('5'))

      act(() => result.current.toggleSign())
      expect(result.current.display).toBe('-5')
    })
  })

  // ---------------------------------------------------------------------
  // Operator switching / chaining edge cases
  // ---------------------------------------------------------------------

  describe('operator switching', () => {
    it('swaps the pending operator without evaluating when pressed twice in a row', async () => {
      const { result } = renderHook(() => useCalculatorEngine(), { wrapper })
      act(() => result.current.inputDigit('5'))
      await act(() => result.current.chooseOp('add'))
      await act(() => result.current.chooseOp('multiply'))

      expect(result.current.pendingOp).toBe('multiply')
      expect(result.current.accumulator).toBe(5)

      act(() => result.current.inputDigit('4'))
      await act(() => result.current.equals())
      await waitFor(() => expect(result.current.display).toBe('20'))
    })

    it('chains three different operators left to right', async () => {
      const { result } = renderHook(() => useCalculatorEngine(), { wrapper })
      act(() => result.current.inputDigit('1'))
      act(() => result.current.inputDigit('0'))
      await act(() => result.current.chooseOp('add'))
      act(() => result.current.inputDigit('5'))
      await act(() => result.current.chooseOp('subtract'))
      act(() => result.current.inputDigit('3'))
      await act(() => result.current.chooseOp('divide'))
      act(() => result.current.inputDigit('4'))
      await act(() => result.current.equals())

      // ((10 + 5) - 3) / 4 = 3
      await waitFor(() => expect(result.current.display).toBe('3'))
    })
  })

  // ---------------------------------------------------------------------
  // Equals edge cases
  // ---------------------------------------------------------------------

  describe('equals with no operation pending', () => {
    it('is a no-op on a freshly loaded calculator', async () => {
      const { result } = renderHook(() => useCalculatorEngine(), { wrapper })
      act(() => result.current.inputDigit('9'))
      await act(() => result.current.equals())
      expect(result.current.display).toBe('9')
    })

    it('stops repeating once AC has cleared the last operation', async () => {
      const { result } = renderHook(() => useCalculatorEngine(), { wrapper })
      act(() => result.current.inputDigit('5'))
      await act(() => result.current.chooseOp('add'))
      act(() => result.current.inputDigit('3'))
      await act(() => result.current.equals())
      await waitFor(() => expect(result.current.display).toBe('8'))

      act(() => result.current.clear())
      expect(result.current.display).toBe('0')

      act(() => result.current.inputDigit('1'))
      await act(() => result.current.equals())
      // no lastOp survives AC, so equals with no pending op is a no-op
      expect(result.current.display).toBe('1')
    })
  })

  // ---------------------------------------------------------------------
  // Power / sqrt edge cases
  // ---------------------------------------------------------------------

  describe('power and sqrt edge cases', () => {
    it('computes sqrt(0) = 0', async () => {
      const { result } = renderHook(() => useCalculatorEngine(), { wrapper })
      await act(() => result.current.sqrtDisplay())
      await waitFor(() => expect(result.current.display).toBe('0'))
    })

    it('computes a negative exponent (2^-1 = 0.5)', async () => {
      const { result } = renderHook(() => useCalculatorEngine(), { wrapper })
      act(() => result.current.inputDigit('2'))
      await act(() => result.current.chooseOp('power'))
      act(() => result.current.inputDigit('1'))
      act(() => result.current.toggleSign())
      await act(() => result.current.equals())

      await waitFor(() => expect(result.current.display).toBe('0.5'))
    })

    it('chains sqrt into a pending binary operation', async () => {
      const { result } = renderHook(() => useCalculatorEngine(), { wrapper })
      act(() => result.current.inputDigit('5'))
      await act(() => result.current.chooseOp('add'))
      act(() => result.current.inputDigit('9'))
      await act(() => result.current.sqrtDisplay())
      await waitFor(() => expect(result.current.display).toBe('3'))

      await act(() => result.current.equals())
      await waitFor(() => expect(result.current.display).toBe('8'))
    })
  })

  // ---------------------------------------------------------------------
  // Percent edge cases
  // ---------------------------------------------------------------------

  describe('percent edge cases', () => {
    it('treats a mid-expression entry as a plain fraction after ^ (power)', async () => {
      const { result } = renderHook(() => useCalculatorEngine(), { wrapper })
      act(() => result.current.inputDigit('2'))
      await act(() => result.current.chooseOp('power'))
      act(() => result.current.inputDigit('5'))
      act(() => result.current.inputDigit('0'))
      await act(() => result.current.percent())

      await waitFor(() => expect(result.current.display).toBe('0.5'))
    })

    it('handles percent of zero without error', async () => {
      const { result } = renderHook(() => useCalculatorEngine(), { wrapper })
      await act(() => result.current.percent())
      await waitFor(() => expect(result.current.display).toBe('0'))
    })

    it('does not add a history entry for a standalone percent', async () => {
      const { result } = renderHook(() => useCalculatorEngine(), { wrapper })
      act(() => result.current.inputDigit('5'))
      act(() => result.current.inputDigit('0'))
      await act(() => result.current.percent())
      await waitFor(() => expect(result.current.display).toBe('0.5'))
      expect(result.current.history).toHaveLength(0)
    })

    it('clears the percent label once a new digit is typed', async () => {
      const { result } = renderHook(() => useCalculatorEngine(), { wrapper })
      act(() => result.current.inputDigit('2'))
      act(() => result.current.inputDigit('0'))
      act(() => result.current.inputDigit('0'))
      await act(() => result.current.chooseOp('add'))
      act(() => result.current.inputDigit('1'))
      act(() => result.current.inputDigit('0'))
      await act(() => result.current.percent())
      await waitFor(() => expect(result.current.percentLabel).toBe('10%'))

      act(() => result.current.inputDigit('5'))
      expect(result.current.percentLabel).toBeNull()
    })
  })

  // ---------------------------------------------------------------------
  // Clear vs. clear-entry edge cases
  // ---------------------------------------------------------------------

  describe('clear vs clearEntry', () => {
    it('AC resets the repeat-equals memory', async () => {
      const { result } = renderHook(() => useCalculatorEngine(), { wrapper })
      act(() => result.current.inputDigit('5'))
      await act(() => result.current.chooseOp('add'))
      act(() => result.current.inputDigit('3'))
      await act(() => result.current.equals())
      await waitFor(() => expect(result.current.display).toBe('8'))

      act(() => result.current.clear())
      act(() => result.current.inputDigit('9'))
      await act(() => result.current.equals())
      expect(result.current.display).toBe('9')
    })

    it('clearEntry does not reset accumulator or pending operator', async () => {
      const { result } = renderHook(() => useCalculatorEngine(), { wrapper })
      act(() => result.current.inputDigit('7'))
      await act(() => result.current.chooseOp('multiply'))
      act(() => result.current.inputDigit('9'))
      act(() => result.current.clearEntry())

      expect(result.current.pendingOp).toBe('multiply')
      expect(result.current.accumulator).toBe(7)
      expect(result.current.display).toBe('0')

      act(() => result.current.inputDigit('6'))
      await act(() => result.current.equals())
      await waitFor(() => expect(result.current.display).toBe('42'))
    })

    it('clearEntry clears a displayed error', async () => {
      const { result } = renderHook(() => useCalculatorEngine(), { wrapper })
      act(() => result.current.inputDigit('1'))
      await act(() => result.current.chooseOp('divide'))
      act(() => result.current.inputDigit('0'))
      await act(() => result.current.equals())
      await waitFor(() => expect(result.current.error).toBe('division by zero'))

      act(() => result.current.clearEntry())
      expect(result.current.error).toBeNull()
    })
  })
})
