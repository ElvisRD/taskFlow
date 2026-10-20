import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { STORAGE_KEY, ThemeProvider } from '../ThemeContext.jsx'
import { useTheme } from '../../hooks/useTheme.js'

function ThemeConsumer() {
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme()

  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <span data-testid="resolved">{resolvedTheme}</span>
      <button type="button" onClick={() => setTheme('dark')}>
        set dark
      </button>
      <button type="button" onClick={() => setTheme('light')}>
        set light
      </button>
      <button type="button" onClick={() => setTheme('invalid')}>
        set invalid
      </button>
      <button type="button" onClick={toggleTheme}>
        toggle
      </button>
    </div>
  )
}

function installMatchMedia(initialMatches = false) {
  const listeners = new Set()
  let matches = initialMatches

  const mediaQuery = {
    media: '(prefers-color-scheme: dark)',
    get matches() {
      return matches
    },
    onchange: null,
    addEventListener: vi.fn((event, listener) => {
      if (event === 'change') {
        listeners.add(listener)
      }
    }),
    removeEventListener: vi.fn((event, listener) => {
      listeners.delete(listener)
    }),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }

  const matchMedia = vi.fn(() => mediaQuery)
  vi.stubGlobal('matchMedia', matchMedia)

  return {
    matchMedia,
    setSystemDark(next) {
      matches = next
      listeners.forEach((listener) => listener({ matches: next }))
    },
  }
}

function renderProvider() {
  return render(
    <ThemeProvider>
      <ThemeConsumer />
    </ThemeProvider>,
  )
}

describe('ThemeContext', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.className = ''
    document.documentElement.style.colorScheme = ''
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    localStorage.clear()
    document.documentElement.className = ''
    document.documentElement.style.colorScheme = ''
  })

  it('starts in system mode and resolves the system theme', () => {
    installMatchMedia(false)
    renderProvider()

    expect(screen.getByTestId('theme')).toHaveTextContent('system')
    expect(screen.getByTestId('resolved')).toHaveTextContent('light')
    expect(document.documentElement).not.toHaveClass('dark')
    expect(document.documentElement.style.colorScheme).toBe('light')
  })

  it('respects the theme stored in localStorage', () => {
    installMatchMedia(false)
    localStorage.setItem(STORAGE_KEY, 'dark')

    renderProvider()

    expect(screen.getByTestId('theme')).toHaveTextContent('dark')
    expect(screen.getByTestId('resolved')).toHaveTextContent('dark')
    expect(document.documentElement).toHaveClass('dark')
    expect(document.documentElement.style.colorScheme).toBe('dark')
  })

  it('ignores invalid stored values and falls back to system', () => {
    installMatchMedia(true)
    localStorage.setItem(STORAGE_KEY, 'morado')

    renderProvider()

    expect(screen.getByTestId('theme')).toHaveTextContent('system')
    expect(document.documentElement).toHaveClass('dark')
  })

  it('applies and persists the theme when using setTheme', async () => {
    const user = userEvent.setup()
    installMatchMedia(false)
    renderProvider()

    await user.click(screen.getByRole('button', { name: 'set dark' }))

    expect(screen.getByTestId('theme')).toHaveTextContent('dark')
    expect(screen.getByTestId('resolved')).toHaveTextContent('dark')
    expect(localStorage.getItem(STORAGE_KEY)).toBe('dark')
    expect(document.documentElement).toHaveClass('dark')

    await user.click(screen.getByRole('button', { name: 'set light' }))

    expect(localStorage.getItem(STORAGE_KEY)).toBe('light')
    expect(document.documentElement).not.toHaveClass('dark')
    expect(document.documentElement.style.colorScheme).toBe('light')
  })

  it('normalizes invalid values to system', async () => {
    const user = userEvent.setup()
    installMatchMedia(true)
    renderProvider()

    await user.click(screen.getByRole('button', { name: 'set invalid' }))

    expect(screen.getByTestId('theme')).toHaveTextContent('system')
    expect(localStorage.getItem(STORAGE_KEY)).toBe('system')
    expect(document.documentElement).toHaveClass('dark')
  })

  it('toggles between light and dark', async () => {
    const user = userEvent.setup()
    installMatchMedia(false)
    localStorage.setItem(STORAGE_KEY, 'light')
    renderProvider()

    await user.click(screen.getByRole('button', { name: 'toggle' }))
    expect(screen.getByTestId('theme')).toHaveTextContent('dark')

    await user.click(screen.getByRole('button', { name: 'toggle' }))
    expect(screen.getByTestId('theme')).toHaveTextContent('light')
  })

  it('responds to system preference changes in system mode', () => {
    const { setSystemDark } = installMatchMedia(false)
    renderProvider()

    expect(screen.getByTestId('resolved')).toHaveTextContent('light')

    act(() => setSystemDark(true))

    expect(screen.getByTestId('resolved')).toHaveTextContent('dark')
    expect(document.documentElement).toHaveClass('dark')
  })

  it('does not change the theme if the system changes and the theme is explicit', () => {
    const { setSystemDark } = installMatchMedia(false)
    localStorage.setItem(STORAGE_KEY, 'light')
    renderProvider()

    act(() => setSystemDark(true))

    expect(screen.getByTestId('resolved')).toHaveTextContent('light')
    expect(document.documentElement).not.toHaveClass('dark')
  })

  it('syncs the theme from another tab via the storage event', () => {
    installMatchMedia(false)
    localStorage.setItem(STORAGE_KEY, 'light')
    renderProvider()

    localStorage.setItem(STORAGE_KEY, 'dark')
    act(() => {
      window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY, newValue: 'dark' }))
    })

    expect(screen.getByTestId('theme')).toHaveTextContent('dark')
    expect(document.documentElement).toHaveClass('dark')
  })

  it('ignores storage events for other keys', () => {
    installMatchMedia(false)
    localStorage.setItem(STORAGE_KEY, 'light')
    renderProvider()

    localStorage.setItem(STORAGE_KEY, 'dark')
    act(() => {
      window.dispatchEvent(new StorageEvent('storage', { key: 'otra-clave', newValue: 'dark' }))
    })

    expect(screen.getByTestId('theme')).toHaveTextContent('light')
  })

  it('useTheme throws outside the provider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => render(<ThemeConsumer />)).toThrow(
      'useTheme debe usarse dentro de un ThemeProvider.',
    )
  })
})
