import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { SecurityPage } from '../SecurityPage.jsx'
import { AuthContext } from '../../context/AuthContext.jsx'
import { ThemeProvider } from '../../context/ThemeContext.jsx'

const TOKENS = [
  {
    id: 1,
    name: 'taskflow-web',
    is_current: true,
    created_at: '2026-10-20T10:00:00Z',
    last_used_at: null,
    expires_at: null,
  },
  {
    id: 2,
    name: 'chrome',
    is_current: false,
    created_at: '2026-10-19T10:00:00Z',
    last_used_at: '2026-10-20T09:00:00Z',
    expires_at: '2026-11-19T10:00:00Z',
  },
]

function renderPage(overrides = {}) {
  const auth = {
    user: {
      id: 1,
      name: 'Ana',
      email: 'ana@taskflow.test',
      has_password: true,
    },
    updatePassword: vi.fn().mockResolvedValue(),
    refreshUser: vi.fn().mockResolvedValue({ has_password: true }),
    listTokens: vi.fn().mockResolvedValue(TOKENS),
    revokeToken: vi.fn().mockResolvedValue(),
    revokeOtherTokens: vi.fn().mockResolvedValue(),
    logoutAll: vi.fn().mockResolvedValue(),
    logout: vi.fn().mockResolvedValue(),
    ...overrides,
  }

  render(
    <MemoryRouter initialEntries={['/settings/security']}>
      <ThemeProvider>
        <AuthContext.Provider value={auth}>
          <Routes>
            <Route path="/settings/security" element={<SecurityPage />} />
            <Route path="/workspaces" element={<div>Workspaces page</div>} />
            <Route path="/login" element={<div>Login page</div>} />
          </Routes>
        </AuthContext.Provider>
      </ThemeProvider>
    </MemoryRouter>,
  )

  return auth
}

async function fillPasswordForm(user) {
  await user.type(screen.getByLabelText('Contraseña actual'), 'password')
  await user.type(screen.getByLabelText('Nueva contraseña'), 'NewPassword123!')
  await user.type(screen.getByLabelText('Confirmar contraseña'), 'NewPassword123!')
}

describe('SecurityPage', () => {
  it('lists the active sessions and marks the current one', async () => {
    renderPage()

    expect(await screen.findByText('taskflow-web')).toBeInTheDocument()
    expect(screen.getByText('Actual')).toBeInTheDocument()
    expect(screen.getByText('chrome')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cerrar esta sesión' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Revocar' })).toBeInTheDocument()
  })

  it('updates the password using the current password', async () => {
    const user = userEvent.setup()
    const auth = renderPage()

    await fillPasswordForm(user)
    await user.click(screen.getByRole('button', { name: 'Actualizar contraseña' }))

    await waitFor(() =>
      expect(auth.updatePassword).toHaveBeenCalledWith({
        current_password: 'password',
        password: 'NewPassword123!',
        password_confirmation: 'NewPassword123!',
      }),
    )
    expect(await screen.findByText('Contraseña actualizada correctamente.')).toBeInTheDocument()
    expect(auth.refreshUser).toHaveBeenCalledTimes(1)
  })

  it('lets a Google-only account set a password without the current one', async () => {
    const user = userEvent.setup()
    const auth = renderPage({
      user: {
        id: 1,
        name: 'Ana',
        email: 'ana@taskflow.test',
        has_password: false,
      },
    })

    expect(screen.queryByLabelText('Contraseña actual')).not.toBeInTheDocument()

    await user.type(screen.getByLabelText('Nueva contraseña'), 'NewPassword123!')
    await user.type(screen.getByLabelText('Confirmar contraseña'), 'NewPassword123!')
    await user.click(screen.getByRole('button', { name: 'Establecer contraseña' }))

    await waitFor(() =>
      expect(auth.updatePassword).toHaveBeenCalledWith({
        password: 'NewPassword123!',
        password_confirmation: 'NewPassword123!',
      }),
    )
    expect(await screen.findByText('Contraseña establecida correctamente.')).toBeInTheDocument()
  })

  it('blocks password changes for demo accounts', async () => {
    renderPage({
      user: {
        id: 1,
        name: 'Ana',
        email: 'ana@taskflow.test',
        has_password: true,
        is_demo: true,
      },
    })

    expect(await screen.findByText('taskflow-web')).toBeInTheDocument()
    expect(screen.getByText('Cuenta demo')).toBeInTheDocument()
    expect(
      screen.getByText(/Las cuentas de prueba como Ana, Beto o Carla/),
    ).toBeInTheDocument()
    expect(screen.queryByLabelText('Contraseña actual')).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Actualizar contraseña' }),
    ).not.toBeInTheDocument()
  })

  it('revokes another session', async () => {
    const user = userEvent.setup()
    const auth = renderPage()

    expect(await screen.findByText('chrome')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Revocar' }))

    await waitFor(() => expect(auth.revokeToken).toHaveBeenCalledWith(2))
    await waitFor(() => expect(screen.queryByText('chrome')).not.toBeInTheDocument())
  })

  it('logs out after revoking the current session', async () => {
    const user = userEvent.setup()
    const auth = renderPage()

    expect(await screen.findByText('taskflow-web')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Cerrar esta sesión' }))

    await waitFor(() => expect(auth.revokeToken).toHaveBeenCalledWith(1))
    expect(auth.logout).toHaveBeenCalledTimes(1)
    expect(await screen.findByText('Login page')).toBeInTheDocument()
  })

  it('closes all other sessions after confirmation', async () => {
    const user = userEvent.setup()
    const auth = renderPage()

    expect(await screen.findByText('taskflow-web')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Cerrar otras' }))

    const dialog = await screen.findByRole('dialog')
    await user.click(within(dialog).getByRole('button', { name: 'Cerrar otras' }))

    await waitFor(() => expect(auth.revokeOtherTokens).toHaveBeenCalledTimes(1))
    await waitFor(() => expect(auth.listTokens).toHaveBeenCalledTimes(2))
  })

  it('closes every session after confirmation', async () => {
    const user = userEvent.setup()
    const auth = renderPage()

    expect(await screen.findByText('taskflow-web')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Cerrar todas' }))

    const dialog = await screen.findByRole('dialog')
    await user.click(within(dialog).getByRole('button', { name: 'Cerrar todas' }))

    await waitFor(() => expect(auth.logoutAll).toHaveBeenCalledTimes(1))
    expect(await screen.findByText('Login page')).toBeInTheDocument()
  })
})
