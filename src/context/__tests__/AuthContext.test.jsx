import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider } from '../AuthContext.jsx'
import { useAuth } from '../../hooks/useAuth.js'
import { api, UNAUTHORIZED_EVENT } from '../../lib/api.js'
import { getToken, setToken } from '../../lib/token.js'

vi.mock('../../lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
  UNAUTHORIZED_EVENT: 'taskflow:unauthorized',
}))

const USER = {
  id: 1,
  name: 'Ana Propietaria',
  email: 'ana@taskflow.test',
  avatar: null,
}

function AuthConsumer() {
  const { user, status, isAuthenticated, login, register, loginWithGoogle, logout } = useAuth()

  return (
    <div>
      <span data-testid="status">{status}</span>
      <span data-testid="user">{user?.email ?? ''}</span>
      <span data-testid="is-authenticated">{String(isAuthenticated)}</span>
      <button
        type="button"
        onClick={() => login({ email: 'ana@taskflow.test', password: 'password' })}
      >
        login
      </button>
      <button
        type="button"
        onClick={() =>
          register({
            name: 'Beto',
            email: 'beto@taskflow.test',
            password: 'password',
            password_confirmation: 'password',
          })
        }
      >
        register
      </button>
      <button type="button" onClick={() => loginWithGoogle('credential-google')}>
        google
      </button>
      <button type="button" onClick={() => logout()}>
        logout
      </button>
    </div>
  )
}

function renderAuthProvider() {
  return render(
    <AuthProvider>
      <AuthConsumer />
    </AuthProvider>,
  )
}

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear()
    api.get.mockReset()
    api.post.mockReset()
  })

  it('stays as guest when there is no token', async () => {
    renderAuthProvider()

    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('guest'))

    expect(screen.getByTestId('is-authenticated')).toHaveTextContent('false')
    expect(api.get).not.toHaveBeenCalled()
  })

  it('restores the session with the stored token', async () => {
    setToken('token-existente')
    api.get.mockResolvedValue({ data: { data: USER } })

    renderAuthProvider()

    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('authenticated'))

    expect(api.get).toHaveBeenCalledWith('/auth/me')
    expect(screen.getByTestId('user')).toHaveTextContent(USER.email)
    expect(screen.getByTestId('is-authenticated')).toHaveTextContent('true')
  })

  it('if /auth/me fails, clears the token and stays as guest', async () => {
    setToken('token-caducado')
    api.get.mockRejectedValue({ response: { status: 401 } })

    renderAuthProvider()

    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('guest'))

    expect(getToken()).toBeNull()
    expect(screen.getByTestId('user')).toHaveTextContent('')
  })

  it('login stores the token and user', async () => {
    const user = userEvent.setup()
    api.get.mockRejectedValue(new Error('no session'))
    api.post.mockResolvedValue({ data: { token: 'token-nuevo', data: USER } })

    renderAuthProvider()
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('guest'))

    await user.click(screen.getByRole('button', { name: 'login' }))

    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('authenticated'))

    expect(api.post).toHaveBeenCalledWith('/auth/login', {
      device_name: 'taskflow-web',
      email: 'ana@taskflow.test',
      password: 'password',
    })
    expect(getToken()).toBe('token-nuevo')
    expect(screen.getByTestId('user')).toHaveTextContent(USER.email)
  })

  it('register stores the token and user', async () => {
    const user = userEvent.setup()
    api.get.mockRejectedValue(new Error('no session'))
    api.post.mockResolvedValue({ data: { token: 'token-registro', data: USER } })

    renderAuthProvider()
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('guest'))

    await user.click(screen.getByRole('button', { name: 'register' }))

    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('authenticated'))

    expect(api.post).toHaveBeenCalledWith('/auth/register', {
      device_name: 'taskflow-web',
      name: 'Beto',
      email: 'beto@taskflow.test',
      password: 'password',
      password_confirmation: 'password',
    })
    expect(getToken()).toBe('token-registro')
  })

  it('loginWithGoogle sends the credential and stores the session', async () => {
    const user = userEvent.setup()
    api.get.mockRejectedValue(new Error('no session'))
    api.post.mockResolvedValue({ data: { token: 'token-google', data: USER } })

    renderAuthProvider()
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('guest'))

    await user.click(screen.getByRole('button', { name: 'google' }))

    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('authenticated'))

    expect(api.post).toHaveBeenCalledWith('/auth/google', {
      credential: 'credential-google',
      device_name: 'taskflow-web',
    })
    expect(getToken()).toBe('token-google')
  })

  it('logout calls the API, clears the token and user', async () => {
    const user = userEvent.setup()
    setToken('token-activo')
    api.get.mockResolvedValue({ data: { data: USER } })
    api.post.mockResolvedValue({ data: {} })

    renderAuthProvider()
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('authenticated'))

    await user.click(screen.getByRole('button', { name: 'logout' }))

    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('guest'))

    expect(api.post).toHaveBeenCalledWith('/auth/logout')
    expect(getToken()).toBeNull()
    expect(screen.getByTestId('user')).toHaveTextContent('')
  })

  it('logout clears the local session even if the API fails', async () => {
    const user = userEvent.setup()
    setToken('token-activo')
    api.get.mockResolvedValue({ data: { data: USER } })
    api.post.mockRejectedValue(new Error('token expirado'))

    renderAuthProvider()
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('authenticated'))

    await user.click(screen.getByRole('button', { name: 'logout' }))

    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('guest'))

    expect(getToken()).toBeNull()
  })

  it('logs out when receiving the unauthorized event', async () => {
    setToken('token-activo')
    api.get.mockResolvedValue({ data: { data: USER } })

    renderAuthProvider()
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('authenticated'))

    act(() => {
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT))
    })

    expect(screen.getByTestId('status')).toHaveTextContent('guest')
    expect(screen.getByTestId('user')).toHaveTextContent('')
  })

  it('useAuth throws outside the provider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => render(<AuthConsumer />)).toThrow(
      'useAuth debe usarse dentro de un AuthProvider.',
    )
  })
})
