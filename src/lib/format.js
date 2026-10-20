/**
 * Formats a `YYYY-MM-DD` date without timezone shifts.
 */
export function formatDate(value) {
  if (!value) {
    return null
  }

  const [year, month, day] = String(value).slice(0, 10).split('-').map(Number)

  if (!year || !month || !day || month < 1 || month > 12 || day < 1 || day > 31) {
    return null
  }

  const date = new Date(year, month - 1, day)

  if (Number.isNaN(date.getTime())) {
    return null
  }

  return new Intl.DateTimeFormat('es', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

export function formatDateTime(value) {
  if (!value) {
    return null
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return null
  }

  return new Intl.DateTimeFormat('es', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export function formatBytes(bytes) {
  if (!bytes && bytes !== 0) {
    return ''
  }

  const units = ['B', 'KB', 'MB', 'GB']
  let size = Number(bytes)
  let unit = 0

  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024
    unit += 1
  }

  return `${size.toFixed(unit === 0 ? 0 : 1)} ${units[unit]}`
}

export function initials(name) {
  const trimmed = name?.trim()

  if (!trimmed) {
    return '?'
  }

  return trimmed
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')
}
