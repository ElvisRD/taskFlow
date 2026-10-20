import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { RegisterPage } from '../RegisterPage.jsx'
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
      Registrarse con Google
    </button>
  ),
}))

const USER = { id: 2, name: 'Beto', email: 'beto@taskflow.test' }

function renderRegister(initialEntries = ['/register']) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <ThemeProvider>
        <AuthProvider>
          <Routes>
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/login" element={<div>Login page</div>} />
            <Route path="/workspaces" element={<div>Workspaces page</div>} />
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </MemoryRouter>,
  )
}

async function fillForm(user) {
  await user.type(screen.getByLabelText('Nombre'), 'Beto Miembro')
  await user.type(screen.getByLabelText('Correo electrónico'), 'beto@taskflow.test')
  await user.type(screen.getByLabelText('Contraseña'), 'password123')
  await user.type(screen.getByLabelText('Confirmar contraseña'), 'password123')
}

describe('RegisterPage', () => {
  beforeEach(() => {
    localStorage.clear()
    api.get.mockReset()
    api.post.mockReset()
  })

  it('shows all form fields', () => {
    renderRegister()

    expect(screen.getByLabelText('Nombre')).toBeInTheDocument()
    expect(screen.getByLabelText('Correo electrónico')).toBeInTheDocument()
    expect(screen.getByLabelText('Contraseña')).toBeInTheDocument()
    expect(screen.getByLabelText('Confirmar contraseña')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Crear cuenta' })).toBeInTheDocument()
  })

  it('registers the user and navigates to /workspaces', async () => {
    const user = userEvent.setup()
    api.post.mockResolvedValue({ data: { token: 'token-registro', data: USER } })

    renderRegister()
    await fillForm(user)
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }))

    await waitFor(() => expect(screen.getByText('Workspaces page')).toBeInTheDocument())

    expect(api.post).toHaveBeenCalledWith('/auth/register', {
      device_name: 'taskflow-web',
      name: 'Beto Miembro',
      email: 'beto@taskflow.test',
      password: 'password123',
      password_confirmation: 'password123',
    })
    expect(getToken()).toBe('token-registro')
  })

  it('shows validation errors returned by the API', async () => {
    const user = userEvent.setup()
    api.post.mockRejectedValue({
      response: {
        status: 422,
        data: {
          message: 'Datos inválidos',
          errors: {
            name: ['El nombre es obligatorio.'],
            email: ['El correo ya está registrado.'],
            password_confirmation: ['Las contraseñas no coinciden.'],
          },
        },
      },
    })

    renderRegister()
    await fillForm(user)
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }))

    expect(await screen.findByText('El nombre es obligatorio.')).toBeInTheDocument()
    expect(screen.getByText('El correo ya está registrado.')).toBeInTheDocument()
    expect(screen.getByText('Las contraseñas no coinciden.')).toBeInTheDocument()
    expect(screen.queryByText('Datos inválidos')).not.toBeInTheDocument()
  })

  it('shows a general API error', async () => {
    const user = userEvent.setup()
    api.post.mockRejectedValue({
      response: { status: 500, data: { message: 'Error interno' } },
    })

    renderRegister()
    await fillForm(user)
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Error interno')
  })

  it('allows signing up with Google', async () => {
    const user = userEvent.setup()
    api.post.mockResolvedValue({ data: { token: 'token-google', data: USER } })

    renderRegister()
    await user.click(screen.getByRole('button', { name: 'Registrarse con Google' }))

    await waitFor(() => expect(screen.getByText('Workspaces page')).toBeInTheDocument())

    expect(api.post).toHaveBeenCalledWith('/auth/google', {
      credential: 'credential-google',
      device_name: 'taskflow-web',
    })
  })

  it('redirects if the user is already authenticated', async () => {
    setToken('token-existente')
    api.get.mockResolvedValue({ data: { data: USER } })

    renderRegister()

    await waitFor(() => expect(screen.getByText('Workspaces page')).toBeInTheDocument())
    expect(screen.queryByLabelText('Nombre')).not.toBeInTheDocument()
  })
})
