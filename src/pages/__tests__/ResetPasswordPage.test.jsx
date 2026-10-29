import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ResetPasswordPage } from '../ResetPasswordPage.jsx'
import { AuthContext } from '../../context/AuthContext.jsx'
import { ThemeProvider } from '../../context/ThemeContext.jsx'

function renderPage(
  resetPassword = vi.fn(),
  initialEntry = '/reset-password?token=token-reset&email=ana%40taskflow.test',
) {
  render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <ThemeProvider>
        <AuthContext.Provider value={{ resetPassword }}>
          <Routes>
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/forgot-password" element={<div>Forgot password page</div>} />
            <Route path="/login" element={<div>Login page</div>} />
          </Routes>
        </AuthContext.Provider>
      </ThemeProvider>
    </MemoryRouter>,
  )

  return resetPassword
}

async function fillPasswords(user) {
  await user.type(screen.getByLabelText('Nueva contraseña'), 'NewPassword123!')
  await user.type(screen.getByLabelText('Confirmar contraseña'), 'NewPassword123!')
}

describe('ResetPasswordPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows a warning when the link has no token or email', () => {
    renderPage(vi.fn(), '/reset-password')

    expect(screen.getByRole('alert')).toHaveTextContent(
      'El enlace no es válido o está incompleto. Solicita uno nuevo para continuar.',
    )
    expect(screen.getByRole('link', { name: 'Solicitar otro enlace' })).toHaveAttribute(
      'href',
      '/forgot-password',
    )
  })

  it('shows the linked email and the new password fields', () => {
    renderPage()

    expect(screen.getByText('ana@taskflow.test')).toBeInTheDocument()
    expect(screen.getByLabelText('Nueva contraseña')).toBeInTheDocument()
    expect(screen.getByLabelText('Confirmar contraseña')).toBeInTheDocument()
  })

  it('resets the password and shows the success state', async () => {
    const user = userEvent.setup()
    const resetPassword = renderPage(vi.fn().mockResolvedValue({}))

    await fillPasswords(user)
    await user.click(screen.getByRole('button', { name: 'Restablecer contraseña' }))

    await waitFor(() =>
      expect(resetPassword).toHaveBeenCalledWith({
        token: 'token-reset',
        email: 'ana@taskflow.test',
        password: 'NewPassword123!',
        password_confirmation: 'NewPassword123!',
      }),
    )

    expect(
      await screen.findByText('Tu contraseña se restableció correctamente.'),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Iniciar sesión' })).toHaveAttribute(
      'href',
      '/login',
    )
  })

  it('shows the invalid token message returned by the API', async () => {
    const user = userEvent.setup()
    renderPage(
      vi.fn().mockRejectedValue({
        response: {
          status: 422,
          data: {
            message: 'Datos inválidos',
            errors: {
              email: ['El enlace para restablecer la contraseña no es válido o ha expirado.'],
            },
          },
        },
      }),
    )

    await fillPasswords(user)
    await user.click(screen.getByRole('button', { name: 'Restablecer contraseña' }))

    expect(
      await screen.findByText(
        'El enlace para restablecer la contraseña no es válido o ha expirado.',
      ),
    ).toBeInTheDocument()
  })

  it('shows validation errors for the password fields', async () => {
    const user = userEvent.setup()
    renderPage(
      vi.fn().mockRejectedValue({
        response: {
          status: 422,
          data: {
            message: 'Datos inválidos',
            errors: { password: ['Las contraseñas no coinciden.'] },
          },
        },
      }),
    )

    await fillPasswords(user)
    await user.click(screen.getByRole('button', { name: 'Restablecer contraseña' }))

    expect(await screen.findByText('Las contraseñas no coinciden.')).toBeInTheDocument()
  })
})
