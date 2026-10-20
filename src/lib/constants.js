export const TASK_PRIORITIES = [
  {
    value: 'low',
    label: 'Baja',
    badge:
      'bg-slate-100 text-slate-600 ring-slate-200 dark:bg-zinc-700/50 dark:text-zinc-300 dark:ring-zinc-600',
    dot: 'bg-slate-400',
  },
  {
    value: 'medium',
    label: 'Media',
    badge:
      'bg-sky-100 text-sky-700 ring-sky-200 dark:bg-sky-500/10 dark:text-sky-300 dark:ring-sky-500/30',
    dot: 'bg-sky-500',
  },
  {
    value: 'high',
    label: 'Alta',
    badge:
      'bg-amber-100 text-amber-700 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/30',
    dot: 'bg-amber-500',
  },
  {
    value: 'urgent',
    label: 'Urgente',
    badge:
      'bg-rose-100 text-rose-700 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/30',
    dot: 'bg-rose-500',
  },
]

export function priorityMeta(value) {
  return TASK_PRIORITIES.find((priority) => priority.value === value) ?? TASK_PRIORITIES[1]
}

export const WORKSPACE_ROLES = [
  { value: 'admin', label: 'Administrador' },
  { value: 'member', label: 'Miembro' },
]

export function roleLabel(value) {
  return WORKSPACE_ROLES.find((role) => role.value === value)?.label ?? value
}

/** Colors available when creating a board. */
export const BOARD_COLORS = [
  { value: '#6366f1', label: 'Índigo' },
  { value: '#0ea5e9', label: 'Azul' },
  { value: '#10b981', label: 'Esmeralda' },
  { value: '#f59e0b', label: 'Ámbar' },
  { value: '#ef4444', label: 'Rojo' },
  { value: '#a855f7', label: 'Púrpura' },
]
