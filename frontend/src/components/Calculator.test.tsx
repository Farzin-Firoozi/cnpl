import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Calculator } from './Calculator'

function renderCalculator() {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <Calculator />
    </QueryClientProvider>,
  )
}

describe('Calculator', () => {
  beforeEach(() => {
    localStorage.clear()
  })
  afterEach(() => {
    localStorage.clear()
  })

  it('computes a result from button clicks', async () => {
    const user = userEvent.setup()
    renderCalculator()

    await user.click(screen.getByRole('button', { name: '2' }))
    await user.click(screen.getByRole('button', { name: '+' }))
    await user.click(screen.getByRole('button', { name: '3' }))
    await user.click(screen.getByRole('button', { name: '=' }))

    await waitFor(() => expect(screen.getByTestId('display')).toHaveTextContent('5'))
  })

  it('repeats the last operation when = is pressed again', async () => {
    const user = userEvent.setup()
    renderCalculator()

    await user.keyboard('5+3=')
    await waitFor(() => expect(screen.getByTestId('display')).toHaveTextContent('8'))

    await user.keyboard('=')
    await waitFor(() => expect(screen.getByTestId('display')).toHaveTextContent('11'))
  })

  it('responds to physical keyboard input', async () => {
    const user = userEvent.setup()
    renderCalculator()

    await user.keyboard('7*6=')

    await waitFor(() => expect(screen.getByTestId('display')).toHaveTextContent('42'))
  })

  it('clears with the AC button', async () => {
    const user = userEvent.setup()
    renderCalculator()

    await user.click(screen.getByRole('button', { name: '9' }))
    expect(screen.getByTestId('display')).toHaveTextContent('9')

    await user.click(screen.getByRole('button', { name: 'AC' }))
    expect(screen.getByTestId('display')).toHaveTextContent('0')
  })

  it('opens the history panel and reuses a past result', async () => {
    const user = userEvent.setup()
    renderCalculator()

    await user.keyboard('4+5=')
    await waitFor(() => expect(screen.getByTestId('display')).toHaveTextContent('9'))

    await user.click(screen.getByRole('button', { name: /show history/i }))
    expect(screen.getByText('4+5')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /= 9/ }))
    expect(screen.getByTestId('display')).toHaveTextContent('9')
  })

  it('computes an exponent via the x^y button', async () => {
    const user = userEvent.setup()
    renderCalculator()

    await user.click(screen.getByRole('button', { name: '2' }))
    await user.click(screen.getByRole('button', { name: 'xy' }))
    await user.click(screen.getByRole('button', { name: '5' }))
    await user.click(screen.getByRole('button', { name: '=' }))

    await waitFor(() => expect(screen.getByTestId('display')).toHaveTextContent('32'))
  })

  it('computes a square root via the sqrt button', async () => {
    const user = userEvent.setup()
    renderCalculator()

    await user.click(screen.getByRole('button', { name: '9' }))
    await user.click(screen.getByRole('button', { name: '√' }))

    await waitFor(() => expect(screen.getByTestId('display')).toHaveTextContent('3'))
  })

  it('clears only the current entry with C, keeping the pending operator', async () => {
    const user = userEvent.setup()
    renderCalculator()

    await user.click(screen.getByRole('button', { name: '2' }))
    await user.click(screen.getByRole('button', { name: '+' }))
    await user.click(screen.getByRole('button', { name: '9' }))
    await user.click(screen.getByRole('button', { name: 'C' }))
    expect(screen.getByTestId('display')).toHaveTextContent('0')

    await user.click(screen.getByRole('button', { name: '3' }))
    await user.click(screen.getByRole('button', { name: '=' }))
    await waitFor(() => expect(screen.getByTestId('display')).toHaveTextContent('5'))
  })

  it('converts a standalone entry to a fraction with %', async () => {
    const user = userEvent.setup()
    renderCalculator()

    await user.click(screen.getByRole('button', { name: '5' }))
    await user.click(screen.getByRole('button', { name: '0' }))
    await user.click(screen.getByRole('button', { name: '%' }))

    await waitFor(() => expect(screen.getByTestId('display')).toHaveTextContent('0.5'))
  })

  it('shows the percent action in the expression line and applies it on equals', async () => {
    const user = userEvent.setup()
    renderCalculator()

    await user.click(screen.getByRole('button', { name: '2' }))
    await user.click(screen.getByRole('button', { name: '0' }))
    await user.click(screen.getByRole('button', { name: '0' }))
    await user.click(screen.getByRole('button', { name: '+' }))
    await user.click(screen.getByRole('button', { name: '1' }))
    await user.click(screen.getByRole('button', { name: '0' }))
    await user.click(screen.getByRole('button', { name: '%' }))

    await waitFor(() => expect(screen.getByTestId('display')).toHaveTextContent('20'))
    expect(screen.getByTestId('expression')).toHaveTextContent('200+10%')

    await user.click(screen.getByRole('button', { name: '=' }))
    await waitFor(() => expect(screen.getByTestId('display')).toHaveTextContent('220'))
  })

  it('shows a backend error for divide by zero and recovers on next input', async () => {
    const user = userEvent.setup()
    renderCalculator()

    await user.keyboard('5/0=')
    await waitFor(() =>
      expect(screen.getByTestId('display')).toHaveTextContent('division by zero'),
    )

    await user.click(screen.getByRole('button', { name: '1' }))
    expect(screen.getByTestId('display')).toHaveTextContent('1')
  })
})
