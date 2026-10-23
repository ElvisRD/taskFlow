import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Toggle } from '../Toggle.jsx'

describe('Toggle', () => {
  it('exposes its state through the switch role', () => {
    const { rerender } = render(
      <Toggle checked label="Notificaciones en la app" onChange={vi.fn()} />,
    )

    expect(
      screen.getByRole('switch', { name: 'Notificaciones en la app' }),
    ).toHaveAttribute('aria-checked', 'true')

    rerender(
      <Toggle checked={false} label="Notificaciones en la app" onChange={vi.fn()} />,
    )

    expect(
      screen.getByRole('switch', { name: 'Notificaciones en la app' }),
    ).toHaveAttribute('aria-checked', 'false')
  })

  it('sends the inverse value when clicked', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()

    render(<Toggle checked={false} label="Notificaciones por email" onChange={onChange} />)

    await user.click(screen.getByRole('switch', { name: 'Notificaciones por email' }))

    expect(onChange).toHaveBeenCalledWith(true)
  })

  it('cannot be changed while disabled', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()

    render(
      <Toggle
        checked={false}
        disabled
        label="Notificaciones por email"
        onChange={onChange}
      />,
    )

    const toggle = screen.getByRole('switch', { name: 'Notificaciones por email' })

    expect(toggle).toBeDisabled()

    await user.click(toggle)

    expect(onChange).not.toHaveBeenCalled()
  })
})
