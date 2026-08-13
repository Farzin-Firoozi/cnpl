import { useState } from 'react'
import { useAtomValue, useSetAtom } from 'jotai'
import {
  useAdd,
  useSubtract,
  useMultiply,
  useDivide,
  usePercentage,
  usePower,
  useSqrt,
} from '../api/functions/calculator'
import type { ErrorType } from '../api/mutator'
import { getErrorMessageFromErrorResponse } from '../api/mutator/utils/error-message'
import { historyAtom, addHistoryEntryAtom, clearHistoryAtom, type HistoryEntry } from '../store/history'
import { formatResult, opSymbol } from '../lib/format'

export type BinaryOp = 'add' | 'subtract' | 'multiply' | 'divide' | 'power'

const MAX_DIGITS = 15

function extractErrorMessage(err: unknown): string {
  const axiosErr = err as ErrorType<unknown>
  return getErrorMessageFromErrorResponse(axiosErr?.response?.data)
}

export function useCalculatorEngine() {
  const [display, setDisplay] = useState('0')
  const [accumulator, setAccumulator] = useState<number | null>(null)
  const [pendingOp, setPendingOp] = useState<BinaryOp | null>(null)
  const [overwrite, setOverwrite] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastOp, setLastOp] = useState<BinaryOp | null>(null)
  const [lastOperand, setLastOperand] = useState<number | null>(null)
  const [percentLabel, setPercentLabel] = useState<string | null>(null)

  const history = useAtomValue(historyAtom)
  const addHistoryEntry = useSetAtom(addHistoryEntryAtom)
  const clearHistory = useSetAtom(clearHistoryAtom)

  const add = useAdd()
  const subtract = useSubtract()
  const multiply = useMultiply()
  const divide = useDivide()
  const percentage = usePercentage()
  const power = usePower()
  const sqrt = useSqrt()

  const isPending =
    add.isPending ||
    subtract.isPending ||
    multiply.isPending ||
    divide.isPending ||
    percentage.isPending ||
    power.isPending ||
    sqrt.isPending

  async function runBinary(op: BinaryOp, a: number, b: number): Promise<number | null> {
    try {
      setError(null)
      switch (op) {
        case 'add':
          return (await add.mutateAsync({ data: { a, b } })).result
        case 'subtract':
          return (await subtract.mutateAsync({ data: { a, b } })).result
        case 'multiply':
          return (await multiply.mutateAsync({ data: { a, b } })).result
        case 'divide':
          return (await divide.mutateAsync({ data: { a, b } })).result
        case 'power':
          return (await power.mutateAsync({ data: { base: a, exponent: b } })).result
      }
    } catch (err) {
      setError(extractErrorMessage(err))
      return null
    }
  }

  function inputDigit(digit: string) {
    if (error) setError(null)
    setPercentLabel(null)
    if (overwrite) {
      setDisplay(digit)
      setOverwrite(false)
      return
    }
    if (display.replace(/[-.]/g, '').length >= MAX_DIGITS) return
    setDisplay((prev) => (prev === '0' ? digit : prev + digit))
  }

  function inputDecimal() {
    if (error) setError(null)
    setPercentLabel(null)
    if (overwrite) {
      setDisplay('0.')
      setOverwrite(false)
      return
    }
    if (display.includes('.')) return
    setDisplay((prev) => prev + '.')
  }

  function backspace() {
    if (overwrite || error) return
    setPercentLabel(null)
    setDisplay((prev) => {
      const next = prev.length > 1 ? prev.slice(0, -1) : '0'
      return next === '-' ? '0' : next
    })
  }

  function toggleSign() {
    if (error) setError(null)
    setPercentLabel(null)
    setDisplay((prev) => {
      if (prev === '0') return prev
      return prev.startsWith('-') ? prev.slice(1) : `-${prev}`
    })
  }

  function clear() {
    setDisplay('0')
    setAccumulator(null)
    setPendingOp(null)
    setOverwrite(true)
    setError(null)
    setLastOp(null)
    setLastOperand(null)
    setPercentLabel(null)
  }

  /** Clears only the current entry, keeping any pending operator/accumulator (like a "CE" key). */
  function clearEntry() {
    setDisplay('0')
    setOverwrite(true)
    setError(null)
    setPercentLabel(null)
  }

  async function chooseOp(op: BinaryOp) {
    const current = parseFloat(display)
    setPercentLabel(null)
    if (pendingOp !== null && !overwrite && accumulator !== null) {
      const result = await runBinary(pendingOp, accumulator, current)
      if (result === null) return
      setAccumulator(result)
      setDisplay(formatResult(result))
    } else {
      setAccumulator(current)
    }
    setPendingOp(op)
    setOverwrite(true)
  }

  async function equals() {
    // Mid-expression: "5 + 3 =". The display already holds the right-hand
    // operand in every case, including "5 + =" (unchanged, still "5", so it
    // reuses the accumulator) and "200 + 10% =" (percent already rewrote the
    // display to the transformed value before equals runs).
    if (pendingOp !== null && accumulator !== null) {
      const operand = parseFloat(display)
      const result = await runBinary(pendingOp, accumulator, operand)
      if (result === null) return
      const resultStr = formatResult(result)
      addHistoryEntry({
        expression: `${formatResult(accumulator)}${opSymbol(pendingOp)}${formatResult(operand)}`,
        result: resultStr,
      })
      setDisplay(resultStr)
      setAccumulator(null)
      setPendingOp(null)
      setOverwrite(true)
      setLastOp(pendingOp)
      setLastOperand(operand)
      setPercentLabel(null)
      return
    }

    // Repeated "=": redo the last operation against the current display,
    // like a physical calculator (e.g. "5+3=" then "=" -> 11, "=" -> 14).
    if (lastOp !== null && lastOperand !== null) {
      const current = parseFloat(display)
      const result = await runBinary(lastOp, current, lastOperand)
      if (result === null) return
      const resultStr = formatResult(result)
      addHistoryEntry({
        expression: `${formatResult(current)}${opSymbol(lastOp)}${formatResult(lastOperand)}`,
        result: resultStr,
      })
      setDisplay(resultStr)
      setOverwrite(true)
    }
  }

  /**
   * Matches standard calculator "%" behavior, which depends on the pending
   * operator:
   *  - No pending op, or pending × / ÷ / ^: plain fraction (50 -> 0.5), e.g.
   *    "200 × 10%" -> "200 × 0.1" (10% is not "of" anything here).
   *  - Pending + / −: percentage of the accumulator (10% of 200 -> 20), e.g.
   *    "200 + 10%" -> "200 + 20".
   * In both cases the display is rewritten now; equals still applies the op.
   */
  async function percent() {
    const current = parseFloat(display)
    const isRelativeToAccumulator =
      accumulator !== null && (pendingOp === 'add' || pendingOp === 'subtract')
    const base = isRelativeToAccumulator ? accumulator : 1
    try {
      setError(null)
      const { result } = await percentage.mutateAsync({ data: { a: current, b: base } })
      setDisplay(formatResult(result))
      setOverwrite(true)
      // Freeze the "10%" label in the expression line so the transform is
      // visible, since the raw typed value is about to be replaced.
      setPercentLabel(pendingOp !== null && accumulator !== null ? `${formatResult(current)}%` : null)
    } catch (err) {
      setError(extractErrorMessage(err))
    }
  }

  async function sqrtDisplay() {
    const current = parseFloat(display)
    try {
      setError(null)
      const { result } = await sqrt.mutateAsync({ data: { a: current } })
      const resultStr = formatResult(result)
      addHistoryEntry({ expression: `√(${formatResult(current)})`, result: resultStr })
      setDisplay(resultStr)
      setOverwrite(true)
      setPercentLabel(null)
    } catch (err) {
      setError(extractErrorMessage(err))
    }
  }

  function applyHistoryEntry(entry: HistoryEntry) {
    setDisplay(entry.result)
    setAccumulator(null)
    setPendingOp(null)
    setOverwrite(true)
    setError(null)
    setLastOp(null)
    setLastOperand(null)
    setPercentLabel(null)
  }

  return {
    display,
    accumulator,
    pendingOp,
    overwrite,
    error,
    isPending,
    percentLabel,
    history,
    inputDigit,
    inputDecimal,
    backspace,
    toggleSign,
    clear,
    clearEntry,
    chooseOp,
    equals,
    percent,
    sqrtDisplay,
    applyHistoryEntry,
    clearHistory,
  }
}

export type CalculatorEngine = ReturnType<typeof useCalculatorEngine>
