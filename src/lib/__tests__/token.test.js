import { beforeEach, describe, expect, it } from 'vitest'
import { clearToken, getToken, setToken } from '../token.js'

describe('token', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('stores, retrieves and removes the token', () => {
    expect(getToken()).toBeNull()

    setToken('abc-123')
    expect(getToken()).toBe('abc-123')
    expect(localStorage.getItem('taskflow.token')).toBe('abc-123')

    clearToken()
    expect(getToken()).toBeNull()
  })

  it('overwrites a previous token', () => {
    setToken('primero')
    setToken('segundo')

    expect(getToken()).toBe('segundo')
  })

  it('deleting a missing token does not fail', () => {
    expect(() => clearToken()).not.toThrow()
  })
})
