import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider } from '../AuthContext.jsx'
import { useAuth } from '../../hooks/useAuth.js'
import { api, UNAUTHORIZED_EVENT, VERIFICATION_REQUIRED_EVENT } from '../../lib/api.js'
import { getToken, setToken } from '../../lib/token.js'

vi.mock('../../lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
  UNAUTHORIZED_EVENT: 'taskflow:unauthorized',
  VERIFICATION_REQUIRED_EVENT: 'taskflow:verification-required',
}))

const USER = {
  id: 1,
  name: 'Ana Propietaria',
  email: 'ana@taskflow.test',
  avatar: null,
  email_verified: true,
  has_password: true,
}

function AuthConsumer() {
  const {
    user,
    status,
    isAuthenticated,
    isVerified,
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
  } = useAuth()

  return (
    <div>
      <span data-testid="status">{status}</span>
      <span data-testid="user">{user?.email ?? ''}</span>
      <span data-testid="is-authenticated">{String(isAuthenticated)}</span>
      <span data-testid="is-verified">{String(isVerified)}</span>
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
      <button type="button" onClick={() => forgotPassword('ana@taskflow.test')}>
        forgot
      </button>
      <button
        type="button"
        onClick={() =>
          resetPassword({
            token: 'token-reset',
            email: 'ana@taskflow.test',
            password: 'new-password',
            password_confirmation: 'new-password',
          })
        }
      >
        reset
      </button>
      <button type="button" onClick={() => resendVerificationEmail()}>
        resend
      </button>
      <button type="button" onClick={() => refreshUser()}>
        refresh
      </button>
      <button
        type="button"
        onClick={() =>
          updatePassword({
            current_password: 'password',
            password: 'new-password',
            password_confirmation: 'new-password',
          })
        }
      >
        update-password
      </button>
      <button type="button" onClick={() => listTokens()}>
        tokens
      </button>
      <button type="button" onClick={() => revokeToken(9)}>
        revoke-token
      </button>
      <button type="button" onClick={() => revokeOtherTokens()}>
        revoke-others
      </button>
      <button type="button" onClick={() => logoutAll()}>
        logout-all
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
    api.put.mockReset()
    api.delete.mockReset()
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

  it('requests a password reset link and resets the password', async () => {
    const user = userEvent.setup()
    api.post.mockResolvedValue({ data: { message: 'ok' } })

    renderAuthProvider()
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('guest'))

    await user.click(screen.getByRole('button', { name: 'forgot' }))

    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith('/auth/forgot-password', {
        email: 'ana@taskflow.test',
      }),
    )

    await user.click(screen.getByRole('button', { name: 'reset' }))

    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith('/auth/reset-password', {
        token: 'token-reset',
        email: 'ana@taskflow.test',
        password: 'new-password',
        password_confirmation: 'new-password',
      }),
    )
  })

  it('resends the verification email and refreshes the user', async () => {
    const user = userEvent.setup()
    setToken('token-activo')
    api.get.mockResolvedValue({ data: { data: USER } })
    api.post.mockResolvedValue({ data: {} })

    renderAuthProvider()
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('authenticated'))

    await user.click(screen.getByRole('button', { name: 'resend' }))

    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith('/auth/email/verification-notification'),
    )

    api.get.mockResolvedValueOnce({
      data: { data: { ...USER, email: 'nueva@taskflow.test' } },
    })

    await user.click(screen.getByRole('button', { name: 'refresh' }))

    await waitFor(() =>
      expect(screen.getByTestId('user')).toHaveTextContent('nueva@taskflow.test'),
    )
  })

  it('updates the password and manages tokens', async () => {
    const user = userEvent.setup()
    setToken('token-activo')
    api.get.mockImplementation((url) =>
      Promise.resolve({
        data: url === '/auth/tokens' ? { data: [{ id: 1 }] } : { data: USER },
      }),
    )
    api.put.mockResolvedValue({ data: {} })
    api.delete.mockResolvedValue({ data: {} })

    renderAuthProvider()
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('authenticated'))

    await user.click(screen.getByRole('button', { name: 'update-password' }))

    await waitFor(() =>
      expect(api.put).toHaveBeenCalledWith('/auth/password', {
        current_password: 'password',
        password: 'new-password',
        password_confirmation: 'new-password',
      }),
    )

    await user.click(screen.getByRole('button', { name: 'tokens' }))

    await waitFor(() => expect(api.get).toHaveBeenCalledWith('/auth/tokens'))

    await user.click(screen.getByRole('button', { name: 'revoke-token' }))

    await waitFor(() => expect(api.delete).toHaveBeenCalledWith('/auth/tokens/9'))

    await user.click(screen.getByRole('button', { name: 'revoke-others' }))

    await waitFor(() => expect(api.delete).toHaveBeenCalledWith('/auth/tokens'))
  })

  it('logoutAll revokes every session and clears the local session', async () => {
    const user = userEvent.setup()
    setToken('token-activo')
    api.get.mockResolvedValue({ data: { data: USER } })
    api.post.mockResolvedValue({ data: {} })

    renderAuthProvider()
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('authenticated'))

    await user.click(screen.getByRole('button', { name: 'logout-all' }))

    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('guest'))

    expect(api.post).toHaveBeenCalledWith('/auth/logout-all')
    expect(getToken()).toBeNull()
  })

  it('marks the session as unverified when the API requires verification', async () => {
    setToken('token-activo')
    api.get.mockResolvedValue({ data: { data: USER } })

    renderAuthProvider()
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('authenticated'))

    expect(screen.getByTestId('is-verified')).toHaveTextContent('true')

    act(() => {
      window.dispatchEvent(new Event(VERIFICATION_REQUIRED_EVENT))
    })

    expect(screen.getByTestId('is-verified')).toHaveTextContent('false')
  })

  it('useAuth throws outside the provider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => render(<AuthConsumer />)).toThrow(
      'useAuth debe usarse dentro de un AuthProvider.',
    )
  })
})
