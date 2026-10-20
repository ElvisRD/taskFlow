import { describe, expect, it } from 'vitest'
import {
  BOARD_COLORS,
  TASK_PRIORITIES,
  WORKSPACE_ROLES,
  priorityMeta,
  roleLabel,
} from '../constants.js'

describe('TASK_PRIORITIES', () => {
  it('defines the four expected priorities', () => {
    expect(TASK_PRIORITIES.map((priority) => priority.value)).toEqual([
      'low',
      'medium',
      'high',
      'urgent',
    ])
  })
})

describe('priorityMeta', () => {
  it.each(TASK_PRIORITIES)('returns the metadata for $value', (priority) => {
    expect(priorityMeta(priority.value)).toBe(priority)
  })

  it('uses medium priority as fallback', () => {
    expect(priorityMeta('desconocida').value).toBe('medium')
    expect(priorityMeta(undefined).value).toBe('medium')
    expect(priorityMeta(null).value).toBe('medium')
  })
})

describe('roleLabel', () => {
  it('translates known roles', () => {
    expect(roleLabel('admin')).toBe('Administrador')
    expect(roleLabel('member')).toBe('Miembro')
  })

  it('returns the original value for unknown roles', () => {
    expect(roleLabel('owner')).toBe('owner')
    expect(roleLabel(undefined)).toBeUndefined()
  })

  it('defined roles match the labels', () => {
    expect(WORKSPACE_ROLES).toEqual([
      { value: 'admin', label: 'Administrador' },
      { value: 'member', label: 'Miembro' },
    ])
  })
})

describe('BOARD_COLORS', () => {
  it('includes six unique colors', () => {
    expect(BOARD_COLORS).toHaveLength(6)
    expect(new Set(BOARD_COLORS.map((color) => color.value)).size).toBe(6)
  })
})
