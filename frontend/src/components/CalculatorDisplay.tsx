import { formatDisplayValue, opSymbol } from '../lib/format'
import type { BinaryOp } from '../hooks/useCalculatorEngine'

interface CalculatorDisplayProps {
  display: string
  accumulator: number | null
  pendingOp: BinaryOp | null
  overwrite: boolean
  error: string | null
  isPending: boolean
  percentLabel: string | null
}

export function CalculatorDisplay({
  display,
  accumulator,
  pendingOp,
  overwrite,
  error,
  isPending,
  percentLabel,
}: CalculatorDisplayProps) {
  const operandLabel = percentLabel ?? (overwrite ? '' : formatDisplayValue(display))
  const expression =
    pendingOp !== null && accumulator !== null
      ? `${formatDisplayValue(String(accumulator))}${opSymbol(pendingOp)}${operandLabel}`
      : ''

  return (
    <div
      className="flex flex-1 flex-col items-end justify-end gap-1 px-5 pb-4 pt-[max(1rem,env(safe-area-inset-top))]"
    >
      <div
        className="h-7 truncate text-2xl text-zinc-500"
        data-testid="expression"
      >
        {expression}
      </div>
      <div className="flex h-20 w-full items-end justify-end overflow-hidden">
        <span
          className={`truncate leading-none font-light ${
            error
              ? 'text-3xl text-red-400'
              : display.replace(/[-.]/g, '').length > 9
                ? 'text-5xl text-white'
                : 'text-7xl text-white'
          }`}
          data-testid="display"
        >
          {isPending ? '···' : error ? error : formatDisplayValue(display)}
        </span>
      </div>
    </div>
  )
}
