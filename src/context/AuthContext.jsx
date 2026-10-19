import { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import { api, UNAUTHORIZED_EVENT } from '../lib/api'
import { clearToken, getToken, setToken } from '../lib/token'

export const AuthContext = createContext(null)

/**
 * Provee el usuario autenticado y las acciones de sesión.
 *
 * El token se guarda en localStorage y viaja en la cabecera Authorization.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [status, setStatus] = useState('loading')

  // Recupera la sesión al montar la aplicación.
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

  // Cierra la sesión si el token deja de ser válido.
  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null)
      setStatus('guest')
    }

    window.addEventListener(UNAUTHORIZED_EVENT, handleUnauthorized)

    return () => window.removeEventListener(UNAUTHORIZED_EVENT, handleUnauthorized)
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
      // El token pudo haber expirado; cerramos la sesión local igualmente.
    }

    clearToken()
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

  const value = useMemo(
    () => ({
      user,
      status,
      isAuthenticated: status === 'authenticated',
      login,
      register,
      loginWithGoogle,
      logout,
    }),
    [user, status, login, register, loginWithGoogle, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
