import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { Button } from '../Button.jsx'

describe('Button', () => {
  it('renders content and responds to clicks', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()

    render(<Button onClick={onClick}>Guardar</Button>)

    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('is disabled and shows the spinner while loading', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()

    const { container } = render(
      <Button loading onClick={onClick}>
        Enviando
      </Button>,
    )

    const button = screen.getByRole('button', { name: 'Enviando' })

    expect(button).toBeDisabled()
    expect(container.querySelector('svg.animate-spin')).not.toBeNull()

    await user.click(button)
    expect(onClick).not.toHaveBeenCalled()
  })

  it('respects the disabled state', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()

    render(
      <Button disabled onClick={onClick}>
        No disponible
      </Button>,
    )

    await user.click(screen.getByRole('button', { name: 'No disponible' }))

    expect(onClick).not.toHaveBeenCalled()
  })

  it('applies variants and sizes', () => {
    const { rerender } = render(<Button size="sm">Primario</Button>)

    expect(screen.getByRole('button')).toHaveClass('bg-indigo-600')
    expect(screen.getByRole('button')).toHaveClass('px-2.5')

    rerender(
      <Button variant="secondary" size="lg">
        Secundario
      </Button>,
    )

    expect(screen.getByRole('button')).toHaveClass('bg-white')
    expect(screen.getByRole('button')).toHaveClass('dark:bg-zinc-800')
    expect(screen.getByRole('button')).toHaveClass('px-4')
  })

  it('can render as a link using the as prop', () => {
    render(
      <MemoryRouter>
        <Button as="a" href="/workspaces">
          Ir a workspaces
        </Button>
      </MemoryRouter>,
    )

    const link = screen.getByRole('link', { name: 'Ir a workspaces' })

    expect(link).toHaveAttribute('href', '/workspaces')
  })
})
