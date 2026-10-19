export function Spinner({ className = 'h-5 w-5' }) {
  return (
    <svg
      className={`animate-spin ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z"
      />
    </svg>
  )
}

export function PageLoader({ label = 'Cargando…' }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 py-20 text-slate-500 dark:text-zinc-400">
      <Spinner className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
      <p className="text-sm">{label}</p>
    </div>
  )
}
