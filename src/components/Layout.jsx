import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import { Avatar } from './Avatar.jsx'
import { ThemeToggle } from './ThemeToggle.jsx'
import { NotificationBell } from '../features/notifications/NotificationBell.jsx'
import { IconChevronDown, IconLogo, IconLogout, IconSettings } from './icons.jsx'

export function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    if (!menuOpen) {
      return undefined
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setMenuOpen(false)
      }
    }

    const handlePointerDown = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('pointerdown', handlePointerDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('pointerdown', handlePointerDown)
    }
  }, [menuOpen])

  const handleLogout = async () => {
    setMenuOpen(false)
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-100 dark:bg-zinc-950">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/80">
        <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-6">
            <Link to="/workspaces" className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
                <IconLogo className="h-4 w-4" />
              </span>
              <span className="text-base font-semibold text-slate-900 dark:text-zinc-100">
                TaskFlow
              </span>
            </Link>

            <nav className="hidden items-center gap-1 sm:flex">
              <NavLink
                to="/workspaces"
                className={({ isActive }) =>
                  `rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                    isActive
                      ? 'bg-slate-100 text-slate-900 dark:bg-zinc-800 dark:text-zinc-100'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100'
                  }`
                }
              >
                Workspaces
              </NavLink>
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <NotificationBell />

            <div ref={menuRef} className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((open) => !open)}
                title="Menú de usuario"
                aria-label={`Menú de ${user?.name ?? 'usuario'}`}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                className="inline-flex items-center gap-2 rounded-lg px-1.5 py-1 transition hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:hover:bg-zinc-800"
              >
                <Avatar name={user?.name} src={user?.avatar} size="sm" />
                <span className="hidden min-w-0 text-left leading-tight sm:block">
                  <span className="block max-w-40 truncate text-sm font-medium text-slate-800 dark:text-zinc-200">
                    {user?.name}
                  </span>
                  <span className="block max-w-40 truncate text-xs text-slate-500 dark:text-zinc-400">
                    {user?.email}
                  </span>
                </span>
                <IconChevronDown
                  className={`h-3.5 w-3.5 shrink-0 text-slate-400 transition ${
                    menuOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {menuOpen ? (
                <div
                  role="menu"
                  aria-label="Menú de usuario"
                  className="absolute right-0 z-50 mt-1 w-44 overflow-hidden rounded-lg bg-white py-1 text-sm shadow-lg ring-1 ring-slate-200 dark:bg-zinc-800 dark:ring-zinc-700"
                >
                  <Link
                    to="/settings/notifications"
                    role="menuitem"
                    onClick={() => setMenuOpen(false)}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-slate-700 transition hover:bg-slate-50 dark:text-zinc-200 dark:hover:bg-zinc-700"
                  >
                    <IconSettings className="h-4 w-4 shrink-0 text-slate-400" />
                    <span>Notificaciones</span>
                  </Link>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-slate-700 transition hover:bg-slate-50 dark:text-zinc-200 dark:hover:bg-zinc-700"
                  >
                    <IconLogout className="h-4 w-4 shrink-0 text-slate-400" />
                    <span>Cerrar sesión</span>
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      <main className="flex flex-1 flex-col">
        <Outlet />
      </main>
    </div>
  )
}
