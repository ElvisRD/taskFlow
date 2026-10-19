const TONES = {
  error: 'bg-rose-50 text-rose-700 ring-rose-200',
  success: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  info: 'bg-sky-50 text-sky-700 ring-sky-200',
  warning: 'bg-amber-50 text-amber-800 ring-amber-200',
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
