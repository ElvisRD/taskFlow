import { createContext, useCallback, useEffect, useMemo, useState } from 'react'

export const STORAGE_KEY = 'taskflow-theme'

export const ThemeContext = createContext(null)

function systemPrefersDark() {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
}

function readStoredTheme() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)

    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      return stored
    }
  } catch {
    // localStorage puede no estar disponible (modo privado, permisos…).
  }

  return 'system'
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(readStoredTheme)
  const [systemDark, setSystemDark] = useState(systemPrefersDark)

  const resolvedTheme = theme === 'system' ? (systemDark ? 'dark' : 'light') : theme

  useEffect(() => {
    const query = window.matchMedia?.('(prefers-color-scheme: dark)')

    if (!query) {
      return undefined
    }

    const handleChange = (event) => setSystemDark(event.matches)

    query.addEventListener('change', handleChange)

    return () => query.removeEventListener('change', handleChange)
  }, [])

  useEffect(() => {
    const root = document.documentElement

    root.classList.toggle('dark', resolvedTheme === 'dark')
    root.style.colorScheme = resolvedTheme
  }, [resolvedTheme])

  useEffect(() => {
    const handleStorage = (event) => {
      if (event.key === STORAGE_KEY) {
        setThemeState(readStoredTheme())
      }
    }

    window.addEventListener('storage', handleStorage)

    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  const setTheme = useCallback((next) => {
    const value = next === 'light' || next === 'dark' || next === 'system' ? next : 'system'
    setThemeState(value)

    try {
      localStorage.setItem(STORAGE_KEY, value)
    } catch {
      // Sin persistencia: el tema sigue funcionando durante la sesión.
    }
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
  }, [resolvedTheme, setTheme])

  const value = useMemo(
    () => ({ theme, resolvedTheme, setTheme, toggleTheme }),
    [theme, resolvedTheme, setTheme, toggleTheme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
