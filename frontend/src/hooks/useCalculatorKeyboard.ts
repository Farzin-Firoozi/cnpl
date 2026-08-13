import { useEffect } from 'react'
import type { CalculatorEngine } from './useCalculatorEngine'

const OP_KEYS: Record<string, 'add' | 'subtract' | 'multiply' | 'divide' | 'power'> = {
  '+': 'add',
  '-': 'subtract',
  '*': 'multiply',
  '/': 'divide',
  '^': 'power',
}

/**
 * Wires physical keyboard input to the calculator engine: digits, the four
 * operators, Enter/= for equals, Backspace to delete, Escape/c to clear.
 */
export function useCalculatorKeyboard(engine: CalculatorEngine) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key >= '0' && e.key <= '9') {
        engine.inputDigit(e.key)
        return
      }
      if (e.key === '.') {
        engine.inputDecimal()
        return
      }
      if (e.key in OP_KEYS) {
        e.preventDefault()
        void engine.chooseOp(OP_KEYS[e.key])
        return
      }
      if (e.key === 'Enter' || e.key === '=') {
        e.preventDefault()
        void engine.equals()
        return
      }
      if (e.key === 'Backspace') {
        engine.backspace()
        return
      }
      if (e.key === 'Escape' || e.key === 'c' || e.key === 'C') {
        engine.clear()
        return
      }
      if (e.key === '%') {
        void engine.percent()
        return
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [engine])
}
