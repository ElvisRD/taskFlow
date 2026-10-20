import { describe, expect, it } from 'vitest'
import {
  TEXT_LIMITS,
  validateOptionalText,
  validateRequiredText,
  validateWorkspaceForm,
} from '../validation.js'

describe('TEXT_LIMITS', () => {
  it('defines the shared input limits', () => {
    expect(TEXT_LIMITS).toEqual({
      workspaceName: 30,
      workspaceDescription: 200,
      boardName: 30,
      boardDescription: 100,
      listName: 40,
      taskTitle: 40,
      taskDescription: 1000,
      commentBody: 300,
      search: 20,
    })
  })
})

describe('validateRequiredText', () => {
  it('rejects empty and whitespace-only values', () => {
    expect(validateRequiredText('', 'El nombre', 40)).toBe('El nombre no es válido.')
    expect(validateRequiredText('   ', 'El nombre', 40)).toBe('El nombre no es válido.')
  })

  it('rejects values over the limit after trimming', () => {
    expect(validateRequiredText(`  ${'a'.repeat(41)}  `, 'El nombre', 40)).toBe(
      'El nombre no puede superar los 40 caracteres.',
    )
  })

  it('accepts values within the limit', () => {
    expect(validateRequiredText('  Lista  ', 'El nombre', 40)).toBe('')
  })
})

describe('validateOptionalText', () => {
  it('allows empty values', () => {
    expect(validateOptionalText('', 'La descripción', 100)).toBe('')
    expect(validateOptionalText('   ', 'La descripción', 100)).toBe('')
  })

  it('rejects values over the limit', () => {
    expect(validateOptionalText('a'.repeat(101), 'La descripción', 100)).toBe(
      'La descripción no puede superar los 100 caracteres.',
    )
  })
})

describe('validateWorkspaceForm', () => {
  it('validates the workspace name and description limits', () => {
    expect(
      validateWorkspaceForm({
        name: 'a'.repeat(31),
        description: 'b'.repeat(201),
      }),
    ).toEqual({
      name: 'El nombre no puede superar los 30 caracteres.',
      description: 'La descripción no puede superar los 200 caracteres.',
    })
  })

  it('requires a non-empty name', () => {
    expect(validateWorkspaceForm({ name: '   ', description: '' })).toEqual({
      name: 'El nombre no es válido.',
    })
  })

  it('accepts values within the limits', () => {
    expect(
      validateWorkspaceForm({
        name: 'Producto',
        description: 'Equipo de producto',
      }),
    ).toEqual({})
  })
})
