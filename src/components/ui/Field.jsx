export const inputClass =
  'block w-full rounded-lg border-0 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 transition placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-600 disabled:bg-slate-50 disabled:text-slate-500 dark:bg-zinc-900 dark:text-zinc-100 dark:ring-zinc-700 dark:placeholder:text-zinc-400 dark:focus:ring-indigo-500 dark:disabled:bg-zinc-800 dark:disabled:text-zinc-400'

export function Field({ label, htmlFor, error, hint, className = '', children }) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label ? (
        <label
          htmlFor={htmlFor}
          className="block text-sm font-medium text-slate-700 dark:text-zinc-300"
        >
          {label}
        </label>
      ) : null}
      {children}
      {error ? (
        <p className="text-xs text-rose-600 dark:text-rose-400">{error}</p>
      ) : hint ? (
        <p className="text-xs text-slate-500 dark:text-zinc-400">{hint}</p>
      ) : null}
    </div>
  )
}
