import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { InvitationAcceptPage } from '../InvitationAcceptPage.jsx'
import { AuthContext } from '../../context/AuthContext.jsx'
import { ThemeProvider } from '../../context/ThemeContext.jsx'
import { api } from '../../lib/api.js'

vi.mock('../../lib/api', async (importOriginal) => {
  const actual = await importOriginal()

  return {
    ...actual,
    api: {
      post: vi.fn(),
    },
  }
})

const USER = {
  id: 5,
  name: 'Invitado',
  email: 'invitado@taskflow.test',
  email_verified: true,
}

function renderPage({ status = 'authenticated', isVerified = true } = {}) {
  return render(
    <ThemeProvider>
      <MemoryRouter initialEntries={['/invitations/token-123']}>
        <AuthContext.Provider
          value={{ status, isVerified, user: status === 'authenticated' ? USER : null }}
        >
          <Routes>
            <Route path="/invitations/:token" element={<InvitationAcceptPage />} />
          </Routes>
        </AuthContext.Provider>
      </MemoryRouter>
    </ThemeProvider>,
  )
}

describe('InvitationAcceptPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('invites guests to sign in or register', () => {
    renderPage({ status: 'guest' })

    expect(screen.getByRole('heading', { name: 'Invitación a un workspace' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Iniciar sesión' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Crear cuenta' })).toBeInTheDocument()
    expect(api.post).not.toHaveBeenCalled()
  })

  it('asks unverified users to verify their email first', () => {
    renderPage({ isVerified: false })

    expect(screen.getByRole('heading', { name: 'Verifica tu correo' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Verificar mi correo' })).toBeInTheDocument()
    expect(api.post).not.toHaveBeenCalled()
  })

  it('accepts the invitation automatically for an authenticated user', async () => {
    api.post.mockResolvedValue({
      data: {
        data: {
          id: USER.id,
          name: USER.name,
          email: USER.email,
          role: 'member',
        },
      },
    })

    renderPage()

    expect(
      await screen.findByRole('heading', { name: 'Invitación aceptada' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Te uniste correctamente como Miembro.')).toBeInTheDocument()
    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith('/workspace-invitations/token-123/accept'),
    )
  })

  it('treats an already accepted invitation as success', async () => {
    api.post.mockRejectedValue({
      response: {
        status: 409,
        data: { message: 'La invitación ya fue aceptada.' },
      },
    })

    renderPage()

    expect(
      await screen.findByRole('heading', { name: 'Invitación aceptada' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText('La invitación ya había sido aceptada. Puedes ir a tus workspaces.'),
    ).toBeInTheDocument()
  })

  it('shows the API error when the invitation does not belong to the user', async () => {
    api.post.mockRejectedValue({
      response: {
        status: 403,
        data: { message: 'Esta invitación no corresponde a tu correo electrónico.' },
      },
    })

    renderPage()

    expect(
      await screen.findByRole('heading', { name: 'No pudimos aceptar la invitación' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Esta invitación no corresponde a tu correo electrónico.'),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument()
  })
})
