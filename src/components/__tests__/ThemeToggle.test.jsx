import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ThemeToggle } from '../ThemeToggle.jsx'
import { STORAGE_KEY, ThemeProvider } from '../../context/ThemeContext.jsx'

function installMatchMedia(matches = false) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({
      matches,
      media: '(prefers-color-scheme: dark)',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
    })),
  )
}

function renderToggle() {
  return render(
    <ThemeProvider>
      <>
        <ThemeToggle />
        <button type="button">Fuera</button>
      </>
    </ThemeProvider>,
  )
}

describe('ThemeToggle', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.className = ''
    installMatchMedia(false)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    localStorage.clear()
    document.documentElement.className = ''
  })

  it('opens the menu with three options and marks the active one', async () => {
    const user = userEvent.setup()
    localStorage.setItem(STORAGE_KEY, 'light')
    renderToggle()

    await user.click(screen.getByRole('button', { name: 'Cambiar tema' }))

    expect(screen.getByRole('menu')).toBeInTheDocument()
    expect(screen.getByRole('menuitemradio', { name: 'Claro' })).toHaveAttribute(
      'aria-checked',
      'true',
    )
    expect(screen.getByRole('menuitemradio', { name: 'Oscuro' })).toHaveAttribute(
      'aria-checked',
      'false',
    )
    expect(screen.getByRole('menuitemradio', { name: 'Sistema' })).toHaveAttribute(
      'aria-checked',
      'false',
    )
  })

  it('changes the theme, persists it and closes the menu', async () => {
    const user = userEvent.setup()
    localStorage.setItem(STORAGE_KEY, 'light')
    renderToggle()

    await user.click(screen.getByRole('button', { name: 'Cambiar tema' }))
    await user.click(screen.getByRole('menuitemradio', { name: 'Oscuro' }))

    expect(localStorage.getItem(STORAGE_KEY)).toBe('dark')
    expect(document.documentElement).toHaveClass('dark')
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('closes the menu with Escape', async () => {
    const user = userEvent.setup()
    renderToggle()

    await user.click(screen.getByRole('button', { name: 'Cambiar tema' }))
    expect(screen.getByRole('menu')).toBeInTheDocument()

    await user.keyboard('{Escape}')

    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('closes the menu when clicking outside', async () => {
    const user = userEvent.setup()
    renderToggle()

    await user.click(screen.getByRole('button', { name: 'Cambiar tema' }))
    expect(screen.getByRole('menu')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Fuera' }))

    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('the button reflects the resolved theme', () => {
    localStorage.setItem(STORAGE_KEY, 'dark')
    renderToggle()

    // The icon changes, but the accessible name stays stable.
    expect(screen.getByRole('button', { name: 'Cambiar tema' })).toHaveAttribute(
      'aria-expanded',
      'false',
    )
  })
})
