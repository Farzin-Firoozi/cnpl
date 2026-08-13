import { describe, expect, it } from 'vitest'
import { formatDisplayValue, formatResult, opSymbol } from './format'

describe('formatResult', () => {
  it('rounds floating point noise', () => {
    expect(formatResult(0.1 + 0.2)).toBe('0.3')
  })

  it('returns Error for non-finite numbers', () => {
    expect(formatResult(Infinity)).toBe('Error')
    expect(formatResult(NaN)).toBe('Error')
  })

  it('formats whole numbers without a trailing decimal', () => {
    expect(formatResult(42)).toBe('42')
  })
})

describe('formatDisplayValue', () => {
  it('adds thousands separators to the integer part', () => {
    expect(formatDisplayValue('1234567')).toBe('1,234,567')
  })

  it('preserves an in-progress trailing decimal point', () => {
    expect(formatDisplayValue('1234.')).toBe('1,234.')
  })

  it('preserves the decimal part unformatted', () => {
    expect(formatDisplayValue('1234.5678')).toBe('1,234.5678')
  })

  it('keeps a leading negative sign', () => {
    expect(formatDisplayValue('-1234')).toBe('-1,234')
  })

  it('passes through the Error sentinel', () => {
    expect(formatDisplayValue('Error')).toBe('Error')
  })
})

describe('opSymbol', () => {
  it('maps each operator to its display glyph', () => {
    expect(opSymbol('add')).toBe('+')
    expect(opSymbol('subtract')).toBe('−')
    expect(opSymbol('multiply')).toBe('×')
    expect(opSymbol('divide')).toBe('÷')
    expect(opSymbol('power')).toBe('^')
  })
})
