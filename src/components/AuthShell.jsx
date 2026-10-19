import { Link } from 'react-router-dom'

export function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center justify-center gap-2 text-white">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500">
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path d="M4 3a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9a1 1 0 0 0-1-1h-4V4a1 1 0 0 0-1-1H4Z" />
            </svg>
          </span>
          <span className="text-xl font-semibold tracking-tight">TaskFlow</span>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-xl sm:p-8">
          <div className="mb-6">
            <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
            {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
          </div>

          {children}
        </div>

        {footer ? <div className="mt-4 text-center text-sm text-slate-300">{footer}</div> : null}

        <p className="mt-6 text-center text-xs text-slate-400">
          <Link to="/" className="hover:text-slate-200">
            TaskFlow · Gestor de tableros y tareas
          </Link>
        </p>
      </div>
    </div>
  )
}
