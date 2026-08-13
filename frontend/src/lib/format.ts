const EXPONENTIAL_UPPER_BOUND = 1e15
const EXPONENTIAL_LOWER_BOUND = 1e-9

export function formatResult(n: number): string {
  if (!Number.isFinite(n)) return 'Error'
  if (n !== 0 && (Math.abs(n) >= EXPONENTIAL_UPPER_BOUND || Math.abs(n) < EXPONENTIAL_LOWER_BOUND)) {
    return n.toExponential(6).replace(/\.?0+e/, 'e')
  }
  const rounded = Math.round(n * 1e10) / 1e10
  return rounded.toString()
}

/**
 * Formats a raw display string (which may end in "." or have a partial
 * decimal) with thousands separators on the integer part only, so typing
 * isn't disrupted mid-entry (e.g. "1234." stays "1,234.").
 */
export function formatDisplayValue(raw: string): string {
  if (raw === 'Error') return raw
  const negative = raw.startsWith('-')
  const unsigned = negative ? raw.slice(1) : raw
  const [intPart, decimalPart] = unsigned.split('.')
  const formattedInt = intPart === '' ? '0' : Number(intPart).toLocaleString('en-US')
  const sign = negative ? '-' : ''
  if (decimalPart === undefined) return `${sign}${formattedInt}`
  return `${sign}${formattedInt}.${decimalPart}`
}

export function opSymbol(op: 'add' | 'subtract' | 'multiply' | 'divide' | 'power'): string {
  switch (op) {
    case 'add':
      return '+'
    case 'subtract':
      return '−'
    case 'multiply':
      return '×'
    case 'divide':
      return '÷'
    case 'power':
      return '^'
  }
}
