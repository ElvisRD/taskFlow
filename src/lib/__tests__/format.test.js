import { describe, expect, it } from 'vitest'
import { formatBytes, formatDate, formatDateTime, formatRelativeTime, initials } from '../format.js'

describe('formatDate', () => {
  it('returns null for empty or invalid values', () => {
    expect(formatDate(null)).toBeNull()
    expect(formatDate('')).toBeNull()
    expect(formatDate('not-a-date')).toBeNull()
  })

  it('formats a YYYY-MM-DD date without timezone offset', () => {
    // If interpreted as UTC, negative timezones could display the
    // previous day.
    const result = formatDate('2026-01-01')

    expect(result).toContain('2026')
    expect(result).toContain('01')
  })

  it('accepts an ISO datetime and uses only the date part', () => {
    const result = formatDate('2026-10-19T23:59:59.000000Z')

    expect(result).toContain('2026')
    expect(result).toContain('19')
  })
})

describe('formatDateTime', () => {
  it('returns null for empty values or invalid dates', () => {
    expect(formatDateTime(null)).toBeNull()
    expect(formatDateTime('')).toBeNull()
    expect(formatDateTime('not-a-date')).toBeNull()
  })

  it('includes day, month, hour and minutes', () => {
    const result = formatDateTime('2026-10-19T14:30:00')

    expect(result).toContain('19')
    expect(result).toMatch(/\d{1,2}:\d{2}/)
  })
})

describe('formatRelativeTime', () => {
  const now = new Date('2026-10-20T12:00:00Z')

  it('returns an empty string for empty or invalid values', () => {
    expect(formatRelativeTime(null, now)).toBe('')
    expect(formatRelativeTime('', now)).toBe('')
    expect(formatRelativeTime('not-a-date', now)).toBe('')
  })

  it('formats recent dates in Spanish', () => {
    expect(formatRelativeTime('2026-10-20T11:55:00Z', now)).toBe('hace 5 minutos')
    expect(formatRelativeTime('2026-10-20T10:00:00Z', now)).toBe('hace 2 horas')
    expect(formatRelativeTime('2026-10-18T12:00:00Z', now)).toBe('anteayer')
    expect(formatRelativeTime('2026-10-20T12:00:10Z', now)).toBe(
      'dentro de 10 segundos',
    )
  })
})

describe('formatBytes', () => {
  it('returns an empty string when there is no value', () => {
    expect(formatBytes(null)).toBe('')
    expect(formatBytes(undefined)).toBe('')
    expect(formatBytes('')).toBe('')
  })

  it('formats bytes without decimals', () => {
    expect(formatBytes(0)).toBe('0 B')
    expect(formatBytes(512)).toBe('512 B')
    expect(formatBytes(1023)).toBe('1023 B')
  })

  it('converts to KB, MB and GB with one decimal', () => {
    expect(formatBytes(1024)).toBe('1.0 KB')
    expect(formatBytes(1536)).toBe('1.5 KB')
    expect(formatBytes(1024 * 1024)).toBe('1.0 MB')
    expect(formatBytes(1024 * 1024 * 1024)).toBe('1.0 GB')
  })

  it('does not go above GB', () => {
    expect(formatBytes(1024 ** 4)).toBe('1024.0 GB')
  })
})

describe('initials', () => {
  it('returns ? when there is no name', () => {
    expect(initials(null)).toBe('?')
    expect(initials('')).toBe('?')
    expect(initials('   ')).toBe('?')
  })

  it('uses the first letter of a single word', () => {
    expect(initials('Ana')).toBe('A')
    expect(initials('beto')).toBe('B')
  })

  it('uses at most the first two words and uppercases them', () => {
    expect(initials('ana propietaria')).toBe('AP')
    expect(initials('Ana María López')).toBe('AM')
    expect(initials('  elvis   rodríguez  duran ')).toBe('ER')
  })
})
