import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { VerifyEmailPage } from '../VerifyEmailPage.jsx'
import { AuthContext } from '../../context/AuthContext.jsx'
import { ThemeProvider } from '../../context/ThemeContext.jsx'

function renderPage(overrides = {}) {
  const auth = {
    user: { email: 'ana@taskflow.test' },
    isVerified: false,
    resendVerificationEmail: vi.fn().mockResolvedValue(),
    refreshUser: vi.fn(),
    logout: vi.fn().mockResolvedValue(),
    ...overrides,
  }

  render(
    <MemoryRouter initialEntries={['/verify-email']}>
      <ThemeProvider>
        <AuthContext.Provider value={auth}>
          <Routes>
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            <Route path="/workspaces" element={<div>Workspaces page</div>} />
            <Route path="/login" element={<div>Login page</div>} />
          </Routes>
        </AuthContext.Provider>
      </ThemeProvider>
    </MemoryRouter>,
  )

  return auth
}

describe('VerifyEmailPage', () => {
  it('shows the pending email and the available actions', () => {
    renderPage()

    expect(screen.getByText('ana@taskflow.test')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ya verifiqué mi correo' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reenviar correo' })).toBeInTheDocument()
  })

  it('resends the verification email', async () => {
    const user = userEvent.setup()
    const auth = renderPage()

    await user.click(screen.getByRole('button', { name: 'Reenviar correo' }))

    await waitFor(() => expect(auth.resendVerificationEmail).toHaveBeenCalledTimes(1))
    expect(
      await screen.findByText('Te enviamos un nuevo correo de verificación.'),
    ).toBeInTheDocument()
  })

  it('navigates to the workspaces when the email is already verified', async () => {
    const user = userEvent.setup()
    const auth = renderPage({
      refreshUser: vi.fn().mockResolvedValue({ email_verified: true }),
    })

    await user.click(screen.getByRole('button', { name: 'Ya verifiqué mi correo' }))

    await waitFor(() => expect(screen.getByText('Workspaces page')).toBeInTheDocument())
    expect(auth.refreshUser).toHaveBeenCalledTimes(1)
  })

  it('shows a message when the email is still not verified', async () => {
    const user = userEvent.setup()
    renderPage({
      refreshUser: vi.fn().mockResolvedValue({ email_verified: false }),
    })

    await user.click(screen.getByRole('button', { name: 'Ya verifiqué mi correo' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Todavía no aparece como verificado. Revisa tu correo y vuelve a intentarlo.',
    )
  })

  it('shows the success state when the session is already verified', () => {
    renderPage({ isVerified: true })

    expect(screen.getByText('Tu correo electrónico está verificado.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ir a mis workspaces' })).toHaveAttribute(
      'href',
      '/workspaces',
    )
  })

  it('logs out and returns to login', async () => {
    const user = userEvent.setup()
    const auth = renderPage()

    await user.click(screen.getByRole('button', { name: 'Cerrar sesión' }))

    await waitFor(() => expect(auth.logout).toHaveBeenCalledTimes(1))
    expect(await screen.findByText('Login page')).toBeInTheDocument()
  })
})
