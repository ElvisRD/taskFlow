import { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import { api, UNAUTHORIZED_EVENT, VERIFICATION_REQUIRED_EVENT } from '../lib/api'
import { disconnectEcho } from '../lib/realtime'
import { clearToken, getToken, setToken } from '../lib/token'

export const AuthContext = createContext(null)

/**
 * Provides the authenticated user and session actions.
 *
 * The token is stored in localStorage and sent in the Authorization header.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [status, setStatus] = useState('loading')

  // Restores the session when the app mounts.
  useEffect(() => {
    let active = true

    if (!getToken()) {
      setStatus('guest')
      return undefined
    }

    api
      .get('/auth/me')
      .then(({ data }) => {
        if (!active) {
          return
        }

        setUser(data.data)
        setStatus('authenticated')
      })
      .catch(() => {
        if (!active) {
          return
        }

        clearToken()
        setUser(null)
        setStatus('guest')
      })

    return () => {
      active = false
    }
  }, [])

  // Logs out if the token is no longer valid.
  useEffect(() => {
    const handleUnauthorized = () => {
      disconnectEcho()
      setUser(null)
      setStatus('guest')
    }

    window.addEventListener(UNAUTHORIZED_EVENT, handleUnauthorized)

    return () => window.removeEventListener(UNAUTHORIZED_EVENT, handleUnauthorized)
  }, [])

  // Marks the session as unverified if the API rejects a request for that reason.
  useEffect(() => {
    const handleVerificationRequired = () => {
      setUser((current) => (current ? { ...current, email_verified: false } : current))
    }

    window.addEventListener(VERIFICATION_REQUIRED_EVENT, handleVerificationRequired)

    return () =>
      window.removeEventListener(VERIFICATION_REQUIRED_EVENT, handleVerificationRequired)
  }, [])

  const login = useCallback(async (credentials) => {
    const { data } = await api.post('/auth/login', {
      device_name: 'taskflow-web',
      ...credentials,
    })

    setToken(data.token)
    setUser(data.data)
    setStatus('authenticated')

    return data.data
  }, [])

  const register = useCallback(async (payload) => {
    const { data } = await api.post('/auth/register', {
      device_name: 'taskflow-web',
      ...payload,
    })

    setToken(data.token)
    setUser(data.data)
    setStatus('authenticated')

    return data.data
  }, [])

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout')
    } catch {
      // The token may have expired; clear the local session anyway.
    }

    clearToken()
    disconnectEcho()
    setUser(null)
    setStatus('guest')
  }, [])

  const loginWithGoogle = useCallback(async (credential) => {
    const { data } = await api.post('/auth/google', {
      credential,
      device_name: 'taskflow-web',
    })

    setToken(data.token)
    setUser(data.data)
    setStatus('authenticated')

    return data.data
  }, [])

  const forgotPassword = useCallback(async (email) => {
    const { data } = await api.post('/auth/forgot-password', { email })

    return data
  }, [])

  const resetPassword = useCallback(async (payload) => {
    const { data } = await api.post('/auth/reset-password', payload)

    return data
  }, [])

  const resendVerificationEmail = useCallback(async () => {
    await api.post('/auth/email/verification-notification')
  }, [])

  const refreshUser = useCallback(async () => {
    const { data } = await api.get('/auth/me')

    setUser(data.data)
    setStatus('authenticated')

    return data.data
  }, [])

  const updatePassword = useCallback(async (payload) => {
    await api.put('/auth/password', payload)
  }, [])

  const listTokens = useCallback(async () => {
    const { data } = await api.get('/auth/tokens')

    return data.data
  }, [])

  const revokeToken = useCallback(async (tokenId) => {
    await api.delete(`/auth/tokens/${tokenId}`)
  }, [])

  const revokeOtherTokens = useCallback(async () => {
    await api.delete('/auth/tokens')
  }, [])

  const logoutAll = useCallback(async () => {
    try {
      await api.post('/auth/logout-all')
    } catch {
      // Clear the local session even if the request fails.
    }

    clearToken()
    disconnectEcho()
    setUser(null)
    setStatus('guest')
  }, [])

  const value = useMemo(
    () => ({
      user,
      status,
      isAuthenticated: status === 'authenticated',
      isVerified: user?.email_verified !== false,
      login,
      register,
      loginWithGoogle,
      logout,
      forgotPassword,
      resetPassword,
      resendVerificationEmail,
      refreshUser,
      updatePassword,
      listTokens,
      revokeToken,
      revokeOtherTokens,
      logoutAll,
    }),
    [
      user,
      status,
      login,
      register,
      loginWithGoogle,
      logout,
      forgotPassword,
      resetPassword,
      resendVerificationEmail,
      refreshUser,
      updatePassword,
      listTokens,
      revokeToken,
      revokeOtherTokens,
      logoutAll,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
