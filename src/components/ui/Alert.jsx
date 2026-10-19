const TONES = {
  error: 'bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/30',
  success:
    'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/30',
  info: 'bg-sky-50 text-sky-700 ring-sky-200 dark:bg-sky-500/10 dark:text-sky-300 dark:ring-sky-500/30',
  warning:
    'bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/30',
}

export function Alert({ tone = 'error', className = '', children }) {
  if (!children) {
    return null
  }

  return (
    <div
      role="alert"
      className={`rounded-lg px-3 py-2 text-sm ring-1 ring-inset ${TONES[tone] ?? TONES.error} ${className}`}
    >
      {children}
    </div>
  )
}
