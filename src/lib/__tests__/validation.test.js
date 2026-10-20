import { describe, expect, it } from 'vitest'
import { validateOptionalText, validateRequiredText } from '../validation.js'

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
