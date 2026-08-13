import { CalculatorButton } from './CalculatorButton'
import { ClockIcon, KeypadIcon } from './icons'
import type { BinaryOp } from '../hooks/useCalculatorEngine'

interface CalculatorKeypadProps {
  display: string
  pendingOp: BinaryOp | null
  overwrite: boolean
  showHistory: boolean
  onDigit: (digit: string) => void
  onDecimal: () => void
  onClear: () => void
  onToggleSign: () => void
  onPercent: () => void
  onOperator: (op: BinaryOp) => void
  onEquals: () => void
  onSqrt: () => void
  onClearEntry: () => void
  onToggleHistory: () => void
}

export function CalculatorKeypad({
  display,
  pendingOp,
  overwrite,
  showHistory,
  onDigit,
  onDecimal,
  onClear,
  onToggleSign,
  onPercent,
  onOperator,
  onEquals,
  onSqrt,
  onClearEntry,
  onToggleHistory,
}: CalculatorKeypadProps) {
  const isActiveOp = (op: BinaryOp) => pendingOp === op && overwrite

  return (
    <div className="grid grid-cols-4 gap-3 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <CalculatorButton
        variant="function"
        onClick={onClearEntry}
        disabled={display === '0'}
      >
        C
      </CalculatorButton>

      <CalculatorButton variant="function" onClick={onSqrt}>
        &radic;
      </CalculatorButton>

      <CalculatorButton
        variant="function"
        active={isActiveOp('power')}
        onClick={() => onOperator('power')}
      >
        x<sup>y</sup>
      </CalculatorButton>

      <CalculatorButton
        variant="digit"
        aria-label={showHistory ? 'Hide history' : 'Show history'}
        aria-pressed={showHistory}
        onClick={onToggleHistory}
      >
        {showHistory ? <KeypadIcon /> : <ClockIcon />}
      </CalculatorButton>

      <CalculatorButton variant="function" onClick={onClear}>
        AC
      </CalculatorButton>
      <CalculatorButton variant="function" onClick={onToggleSign}>
        +/&minus;
      </CalculatorButton>
      <CalculatorButton variant="function" onClick={onPercent}>
        %
      </CalculatorButton>
      <CalculatorButton
        variant="operator"
        active={isActiveOp('divide')}
        onClick={() => onOperator('divide')}
      >
        &divide;
      </CalculatorButton>

      <CalculatorButton variant="digit" onClick={() => onDigit('7')}>
        7
      </CalculatorButton>
      <CalculatorButton variant="digit" onClick={() => onDigit('8')}>
        8
      </CalculatorButton>
      <CalculatorButton variant="digit" onClick={() => onDigit('9')}>
        9
      </CalculatorButton>
      <CalculatorButton
        variant="operator"
        active={isActiveOp('multiply')}
        onClick={() => onOperator('multiply')}
      >
        &times;
      </CalculatorButton>

      <CalculatorButton variant="digit" onClick={() => onDigit('4')}>
        4
      </CalculatorButton>
      <CalculatorButton variant="digit" onClick={() => onDigit('5')}>
        5
      </CalculatorButton>
      <CalculatorButton variant="digit" onClick={() => onDigit('6')}>
        6
      </CalculatorButton>
      <CalculatorButton
        variant="operator"
        active={isActiveOp('subtract')}
        onClick={() => onOperator('subtract')}
      >
        &minus;
      </CalculatorButton>

      <CalculatorButton variant="digit" onClick={() => onDigit('1')}>
        1
      </CalculatorButton>
      <CalculatorButton variant="digit" onClick={() => onDigit('2')}>
        2
      </CalculatorButton>
      <CalculatorButton variant="digit" onClick={() => onDigit('3')}>
        3
      </CalculatorButton>
      <CalculatorButton
        variant="operator"
        active={isActiveOp('add')}
        onClick={() => onOperator('add')}
      >
        +
      </CalculatorButton>

      <CalculatorButton variant="digit" wide onClick={() => onDigit('0')}>
        0
      </CalculatorButton>
      <CalculatorButton variant="digit" onClick={onDecimal}>
        .
      </CalculatorButton>
      <CalculatorButton variant="operator" onClick={onEquals}>
        =
      </CalculatorButton>
    </div>
  )
}
