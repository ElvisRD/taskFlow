import { IconChevronDown } from '../icons.jsx'
import { inputClass } from './Field.jsx'

export function Select({ className = '', children, ...props }) {
  return (
    <div className="relative">
      <select className={`${inputClass} appearance-none cursor-pointer pr-10 ${className}`} {...props}>
        {children}
      </select>
      <IconChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-zinc-500" />
    </div>
  )
}
