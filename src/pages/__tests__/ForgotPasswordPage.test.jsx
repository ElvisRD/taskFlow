import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ForgotPasswordPage } from '../ForgotPasswordPage.jsx'
import { AuthContext } from '../../context/AuthContext.jsx'
import { ThemeProvider } from '../../context/ThemeContext.jsx'

function renderPage(forgotPassword = vi.fn()) {
  render(
    <MemoryRouter initialEntries={['/forgot-password']}>
      <ThemeProvider>
        <AuthContext.Provider value={{ forgotPassword }}>
          <Routes>
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/login" element={<div>Login page</div>} />
          </Routes>
        </AuthContext.Provider>
      </ThemeProvider>
    </MemoryRouter>,
  )

  return forgotPassword
}

describe('ForgotPasswordPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows the email form and a link back to login', () => {
    renderPage()

    expect(screen.getByLabelText('Correo electrónico')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Enviar enlace' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Inicia sesión' })).toHaveAttribute('href', '/login')
  })

  it('sends the trimmed email and shows the confirmation message', async () => {
    const user = userEvent.setup()
    const forgotPassword = renderPage(vi.fn().mockResolvedValue({}))

    await user.type(screen.getByLabelText('Correo electrónico'), '  ana@taskflow.test  ')
    await user.click(screen.getByRole('button', { name: 'Enviar enlace' }))

    await waitFor(() => expect(forgotPassword).toHaveBeenCalledWith('ana@taskflow.test'))
    expect(
      await screen.findByText(
        'Si el correo está registrado, recibirás un enlace para restablecer tu contraseña.',
      ),
    ).toBeInTheDocument()
  })

  it('shows the API validation error for the email field', async () => {
    const user = userEvent.setup()
    const forgotPassword = renderPage(
      vi.fn().mockRejectedValue({
        response: {
          status: 422,
          data: {
            message: 'Datos inválidos',
            errors: { email: ['El correo no es válido.'] },
          },
        },
      }),
    )

    await user.type(screen.getByLabelText('Correo electrónico'), 'ana@taskflow.test')
    await user.click(screen.getByRole('button', { name: 'Enviar enlace' }))

    expect(await screen.findByText('El correo no es válido.')).toBeInTheDocument()
    expect(forgotPassword).toHaveBeenCalledTimes(1)
  })

  it('shows a friendly message when the request is throttled', async () => {
    const user = userEvent.setup()
    renderPage(
      vi.fn().mockRejectedValue({
        response: { status: 429, data: { message: 'Too Many Attempts.' } },
      }),
    )

    await user.type(screen.getByLabelText('Correo electrónico'), 'ana@taskflow.test')
    await user.click(screen.getByRole('button', { name: 'Enviar enlace' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Demasiados intentos. Espera un momento antes de volver a intentarlo.',
    )
  })
})
