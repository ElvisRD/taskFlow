import { useEffect, useState } from 'react'
import { useTheme } from '../hooks/useTheme.js'
import { IconCheck, IconMonitor, IconMoon, IconSun } from './icons.jsx'

const OPTIONS = [
  { value: 'light', label: 'Claro', Icon: IconSun },
  { value: 'dark', label: 'Oscuro', Icon: IconMoon },
  { value: 'system', label: 'Sistema', Icon: IconMonitor },
]

const TRIGGERS = {
  default:
    'text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200',
  inverse: 'text-zinc-300 hover:bg-white/10 hover:text-white',
}

const PANELS = {
  default:
    'bg-white ring-slate-200 dark:bg-zinc-800 dark:ring-zinc-700',
  inverse: 'bg-zinc-800 ring-zinc-700',
}

const ITEMS = {
  default:
    'text-slate-700 hover:bg-slate-50 dark:text-zinc-200 dark:hover:bg-zinc-700',
  inverse: 'text-zinc-200 hover:bg-zinc-700',
}

/**
 * Theme selector: light, dark, or system.
 *
 * `variant="inverse"` is intended for dark backgrounds, such as AuthShell.
 */
export function ThemeToggle({ variant = 'default', className = '' }) {
  const { theme, resolvedTheme, setTheme } = useTheme()
  const [open, setOpen] = useState(false)
  const isDark = resolvedTheme === 'dark'

  useEffect(() => {
    if (!open) {
      return undefined
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open])

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        title="Cambiar tema"
        aria-label="Cambiar tema"
        aria-haspopup="menu"
        aria-expanded={open}
        className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 ${
          TRIGGERS[variant] ?? TRIGGERS.default
        } ${className}`}
      >
        {isDark ? <IconMoon className="h-4.5 w-4.5" /> : <IconSun className="h-4.5 w-4.5" />}
      </button>

      {open ? (
        <>
          <button
            type="button"
            aria-hidden="true"
            tabIndex={-1}
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div
            role="menu"
            aria-label="Tema de la aplicación"
            className={`absolute right-0 z-50 mt-1 w-40 overflow-hidden rounded-lg py-1 text-sm shadow-lg ring-1 ${
              PANELS[variant] ?? PANELS.default
            }`}
          >
            {OPTIONS.map((option) => {
              const selected = theme === option.value

              return (
                <button
                  key={option.value}
                  type="button"
                  role="menuitemradio"
                  aria-checked={selected}
                  onClick={() => {
                    setTheme(option.value)
                    setOpen(false)
                  }}
                  className={`flex w-full items-center gap-2 px-3 py-1.5 text-left ${
                    ITEMS[variant] ?? ITEMS.default
                  }`}
                >
                  <option.Icon className="h-4 w-4 shrink-0" />
                  <span className="flex-1">{option.label}</span>
                  {selected ? (
                    <IconCheck
                      className={`h-3.5 w-3.5 shrink-0 ${
                        variant === 'inverse'
                          ? 'text-indigo-300'
                          : 'text-indigo-600 dark:text-indigo-300'
                      }`}
                    />
                  ) : null}
                </button>
              )
            })}
          </div>
        </>
      ) : null}
    </div>
  )
}
