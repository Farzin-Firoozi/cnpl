import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CalculatorButton } from './CalculatorButton'

describe('CalculatorButton', () => {
  it('renders its label', () => {
    render(
      <CalculatorButton variant="digit" onClick={() => {}}>
        7
      </CalculatorButton>,
    )
    expect(screen.getByRole('button', { name: '7' })).toBeInTheDocument()
  })

  it('calls onClick when pressed', async () => {
    const onClick = vi.fn()
    render(
      <CalculatorButton variant="operator" onClick={onClick}>
        +
      </CalculatorButton>,
    )
    await userEvent.click(screen.getByRole('button', { name: '+' }))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('does not call onClick when disabled', async () => {
    const onClick = vi.fn()
    render(
      <CalculatorButton variant="operator" onClick={onClick} disabled>
        =
      </CalculatorButton>,
    )
    await userEvent.click(screen.getByRole('button', { name: '=' }))
    expect(onClick).not.toHaveBeenCalled()
  })

  it('applies the inverted style to an active operator', () => {
    render(
      <CalculatorButton variant="operator" active onClick={() => {}}>
        +
      </CalculatorButton>,
    )
    expect(screen.getByRole('button', { name: '+' })).toHaveClass('bg-white')
  })
})
