import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import { Avatar } from './Avatar.jsx'
import { ThemeToggle } from './ThemeToggle.jsx'
import { Button } from './ui/Button.jsx'

export function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
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
                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path d="M4 3.75A.75.75 0 0 1 4.75 3h4.5a.75.75 0 0 1 0 1.5h-4.5A.75.75 0 0 1 4 3.75Z" />
                  <path d="M4 3a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9a1 1 0 0 0-1-1h-4V4a1 1 0 0 0-1-1H4Zm10 6.5v4.25a.75.75 0 0 1-1.5 0V9.5H14Z" />
                </svg>
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

          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 sm:flex">
              <Avatar name={user?.name} src={user?.avatar} size="sm" />
              <div className="leading-tight">
                <p className="text-sm font-medium text-slate-800 dark:text-zinc-200">
                  {user?.name}
                </p>
                <p className="text-xs text-slate-500 dark:text-zinc-400">{user?.email}</p>
              </div>
            </div>
            <ThemeToggle />
            <Button variant="secondary" size="sm" onClick={handleLogout}>
              Salir
            </Button>
          </div>
        </div>
      </header>

      <main className="flex flex-1 flex-col">
        <Outlet />
      </main>
    </div>
  )
}
