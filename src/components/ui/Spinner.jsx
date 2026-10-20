import { IconSpinner } from '../icons.jsx'

export function Spinner({ className = 'h-5 w-5' }) {
  return <IconSpinner className={`animate-spin ${className}`} />
}

export function PageLoader({ label = 'Cargando…' }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 py-20 text-slate-500 dark:text-zinc-400">
      <Spinner className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
      <p className="text-sm">{label}</p>
    </div>
  )
}
