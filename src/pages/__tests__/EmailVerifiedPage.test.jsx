import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { EmailVerifiedPage } from '../EmailVerifiedPage.jsx'
import { AuthContext } from '../../context/AuthContext.jsx'
import { ThemeProvider } from '../../context/ThemeContext.jsx'

function renderPage(overrides = {}, initialEntry = '/email/verified') {
  const auth = {
    status: 'guest',
    isAuthenticated: false,
    isVerified: false,
    refreshUser: vi.fn(),
    ...overrides,
  }

  render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <ThemeProvider>
        <AuthContext.Provider value={auth}>
          <Routes>
            <Route path="/email/verified" element={<EmailVerifiedPage />} />
            <Route path="/workspaces" element={<div>Workspaces page</div>} />
            <Route path="/login" element={<div>Login page</div>} />
          </Routes>
        </AuthContext.Provider>
      </ThemeProvider>
    </MemoryRouter>,
  )

  return auth
}

describe('EmailVerifiedPage', () => {
  it('shows the success message and a login link for guests', () => {
    renderPage()

    expect(screen.getByText('Verificamos tu correo electrónico correctamente.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Iniciar sesión' })).toHaveAttribute(
      'href',
      '/login',
    )
  })

  it('offers the workspaces link for authenticated users', () => {
    renderPage({ status: 'authenticated', isAuthenticated: true, isVerified: true })

    expect(screen.getByRole('link', { name: 'Ir a mis workspaces' })).toHaveAttribute(
      'href',
      '/workspaces',
    )
  })

  it('shows an invalid-link message and a way to request another email', () => {
    renderPage(
      { status: 'authenticated', isAuthenticated: true, isVerified: false },
      '/email/verified?status=invalid',
    )

    expect(screen.getByText('No pudimos verificar tu correo')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Solicitar otro correo' })).toHaveAttribute(
      'href',
      '/verify-email',
    )
  })

  it('refreshes the session when it is still marked as unverified', async () => {
    const refreshUser = vi.fn().mockResolvedValue({ email_verified: true })

    renderPage({
      status: 'authenticated',
      isAuthenticated: true,
      isVerified: false,
      refreshUser,
    })

    await waitFor(() => expect(refreshUser).toHaveBeenCalledTimes(1))
  })
})
