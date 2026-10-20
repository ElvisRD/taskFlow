import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Select } from '../Select.jsx'

describe('Select', () => {
  it('renders options and forwards changes', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()

    render(
      <Select aria-label="Rol" defaultValue="member" onChange={onChange}>
        <option value="member">Miembro</option>
        <option value="admin">Administrador</option>
      </Select>,
    )

    await user.selectOptions(screen.getByRole('combobox', { name: 'Rol' }), 'admin')

    expect(onChange).toHaveBeenCalledTimes(1)
  })

  it('renders a decorative chevron separated from the edge', () => {
    const { container } = render(
      <Select aria-label="Rol" defaultValue="member">
        <option value="member">Miembro</option>
      </Select>,
    )

    const select = screen.getByRole('combobox', { name: 'Rol' })
    const icon = container.querySelector('svg')

    expect(select).toHaveClass('appearance-none', 'pr-10')
    expect(icon).toHaveAttribute('aria-hidden', 'true')
    expect(icon).toHaveClass('pointer-events-none', 'right-2')
  })
})
