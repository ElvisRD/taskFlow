import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { LoginPage } from '../LoginPage.jsx'
import { AuthProvider } from '../../context/AuthContext.jsx'
import { ThemeProvider } from '../../context/ThemeContext.jsx'
import { api } from '../../lib/api.js'
import { getToken, setToken } from '../../lib/token.js'

vi.mock('../../lib/api', async (importOriginal) => {
  const actual = await importOriginal()

  return {
    ...actual,
    api: {
      get: vi.fn(),
      post: vi.fn(),
    },
  }
})

vi.mock('../../components/GoogleSignInButton.jsx', () => ({
  GoogleSignInButton: ({ onCredential }) => (
    <button type="button" onClick={() => onCredential('credential-google')}>
      Entrar con Google
    </button>
  ),
}))

const USER = {
  id: 1,
  name: 'Ana',
  email: 'ana@taskflow.test',
  email_verified: true,
}

function renderLogin(initialEntries = ['/login']) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <ThemeProvider>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/forgot-password" element={<div>Forgot password page</div>} />
            <Route path="/verify-email" element={<div>Verify email page</div>} />
            <Route path="/workspaces" element={<div>Workspaces page</div>} />
            <Route path="/workspaces/:id" element={<div>Board destino</div>} />
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </MemoryRouter>,
  )
}

async function fillCredentials(user) {
  await user.type(screen.getByLabelText('Correo electrónico'), 'ana@taskflow.test')
  await user.type(screen.getByLabelText('Contraseña'), 'password')
}

describe('LoginPage', () => {
  beforeEach(() => {
    localStorage.clear()
    api.get.mockReset()
    api.post.mockReset()
  })

  it('shows the form and demo accounts', () => {
    renderLogin()

    expect(screen.getByLabelText('Correo electrónico')).toBeInTheDocument()
    expect(screen.getByLabelText('Contraseña')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '¿Olvidaste tu contraseña?' })).toHaveAttribute(
      'href',
      '/forgot-password',
    )
    expect(screen.getByText('ana@taskflow.test · password')).toBeInTheDocument()
    expect(screen.getByText('beto@taskflow.test · password')).toBeInTheDocument()
  })

  it('logs in and navigates to /workspaces', async () => {
    const user = userEvent.setup()
    api.post.mockResolvedValue({ data: { token: 'token-login', data: USER } })

    renderLogin()
    await fillCredentials(user)
    await user.click(screen.getByRole('button', { name: 'Entrar' }))

    await waitFor(() => expect(screen.getByText('Workspaces page')).toBeInTheDocument())

    expect(api.post).toHaveBeenCalledWith('/auth/login', {
      device_name: 'taskflow-web',
      email: 'ana@taskflow.test',
      password: 'password',
    })
    expect(getToken()).toBe('token-login')
  })

  it('sends unverified users to the verification page after login', async () => {
    const user = userEvent.setup()
    api.post.mockResolvedValue({
      data: { token: 'token-login', data: { ...USER, email_verified: false } },
    })

    renderLogin()
    await fillCredentials(user)
    await user.click(screen.getByRole('button', { name: 'Entrar' }))

    await waitFor(() => expect(screen.getByText('Verify email page')).toBeInTheDocument())
  })

  it('redirects unverified authenticated users to the verification page', async () => {
    setToken('token-existente')
    api.get.mockResolvedValue({ data: { data: { ...USER, email_verified: false } } })

    renderLogin()

    await waitFor(() => expect(screen.getByText('Verify email page')).toBeInTheDocument())
    expect(screen.queryByLabelText('Correo electrónico')).not.toBeInTheDocument()
  })

  it('returns to the origin route after login', async () => {
    const user = userEvent.setup()
    api.post.mockResolvedValue({ data: { token: 'token-login', data: USER } })

    renderLogin([{ pathname: '/login', state: { from: '/workspaces/7' } }])
    await fillCredentials(user)
    await user.click(screen.getByRole('button', { name: 'Entrar' }))

    await waitFor(() => expect(screen.getByText('Board destino')).toBeInTheDocument())
  })

  it('shows validation errors per field', async () => {
    const user = userEvent.setup()
    api.post.mockRejectedValue({
      response: {
        status: 422,
        data: {
          message: 'Datos inválidos',
          errors: {
            email: ['El correo ya está registrado.'],
            password: ['La contraseña es obligatoria.'],
          },
        },
      },
    })

    renderLogin()
    await fillCredentials(user)
    await user.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(await screen.findByText('El correo ya está registrado.')).toBeInTheDocument()
    expect(screen.getByText('La contraseña es obligatoria.')).toBeInTheDocument()
    expect(screen.queryByText('Datos inválidos')).not.toBeInTheDocument()
  })

  it('shows the server message on a general error', async () => {
    const user = userEvent.setup()
    api.post.mockRejectedValue({
      response: { status: 500, data: { message: 'Servicio no disponible' } },
    })

    renderLogin()
    await fillCredentials(user)
    await user.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Servicio no disponible')
  })

  it('authenticates with Google and navigates to /workspaces', async () => {
    const user = userEvent.setup()
    api.post.mockResolvedValue({ data: { token: 'token-google', data: USER } })

    renderLogin()
    await user.click(screen.getByRole('button', { name: 'Entrar con Google' }))

    await waitFor(() => expect(screen.getByText('Workspaces page')).toBeInTheDocument())

    expect(api.post).toHaveBeenCalledWith('/auth/google', {
      credential: 'credential-google',
      device_name: 'taskflow-web',
    })
    expect(getToken()).toBe('token-google')
  })

  it('redirects if the user is already authenticated', async () => {
    setToken('token-existente')
    api.get.mockResolvedValue({ data: { data: USER } })

    renderLogin()

    await waitFor(() => expect(screen.getByText('Workspaces page')).toBeInTheDocument())
    expect(screen.queryByLabelText('Correo electrónico')).not.toBeInTheDocument()
  })
})
