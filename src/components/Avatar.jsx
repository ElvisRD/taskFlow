import { initials } from '../lib/format.js'

const SIZES = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
}

export function Avatar({ name, src, size = 'sm', className = '' }) {
  const dimensions = SIZES[size] ?? SIZES.sm

  if (src) {
    return (
      <img
        src={src}
        alt={name ?? ''}
        title={name}
        loading="lazy"
        referrerPolicy="no-referrer"
        className={`inline-block shrink-0 rounded-full bg-slate-100 object-cover dark:bg-zinc-800 ${dimensions} ${className}`}
      />
    )
  }

  return (
    <span
      title={name}
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-indigo-100 font-semibold text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300 ${dimensions} ${className}`}
    >
      {initials(name)}
    </span>
  )
}
