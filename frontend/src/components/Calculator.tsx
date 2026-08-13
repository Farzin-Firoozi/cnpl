import { useState } from 'react'
import { useCalculatorEngine } from '../hooks/useCalculatorEngine'
import { useCalculatorKeyboard } from '../hooks/useCalculatorKeyboard'
import { CalculatorDisplay } from './CalculatorDisplay'
import { CalculatorKeypad } from './CalculatorKeypad'
import { HistoryPanel } from './HistoryPanel'

export function Calculator() {
  const engine = useCalculatorEngine()
  const [showHistory, setShowHistory] = useState(false)
  useCalculatorKeyboard(engine)

  return (
    <div className="relative flex h-dvh w-full flex-col overflow-hidden bg-black sm:h-[780px] sm:max-h-[92vh] sm:w-full sm:max-w-sm sm:rounded-[2.5rem] sm:shadow-2xl">
      <CalculatorDisplay
        display={engine.display}
        accumulator={engine.accumulator}
        pendingOp={engine.pendingOp}
        overwrite={engine.overwrite}
        error={engine.error}
        isPending={engine.isPending}
        percentLabel={engine.percentLabel}
      />

      <CalculatorKeypad
        display={engine.display}
        pendingOp={engine.pendingOp}
        overwrite={engine.overwrite}
        onDigit={engine.inputDigit}
        onDecimal={engine.inputDecimal}
        onClear={engine.clear}
        onToggleSign={engine.toggleSign}
        onPercent={engine.percent}
        onOperator={engine.chooseOp}
        onEquals={engine.equals}
        onSqrt={engine.sqrtDisplay}
        onClearEntry={engine.clearEntry}
        showHistory={showHistory}
        onToggleHistory={() => setShowHistory((v) => !v)}
      />

      {showHistory && (
        <HistoryPanel
          history={engine.history}
          onSelect={(entry) => {
            engine.applyHistoryEntry(entry)
            setShowHistory(false)
          }}
          onClear={engine.clearHistory}
          onClose={() => setShowHistory(false)}
        />
      )}
    </div>
  )
}
