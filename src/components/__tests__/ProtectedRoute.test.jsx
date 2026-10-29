import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { ProtectedRoute } from '../ProtectedRoute.jsx'
import { AuthContext } from '../../context/AuthContext.jsx'

function LoginProbe() {
  const location = useLocation()

  return <div>Login desde {location.state?.from ?? 'sin origen'}</div>
}

function renderProtectedRoute({ status, user = null, requireVerified = true }) {
  return render(
    <MemoryRouter initialEntries={['/privado']}>
      <AuthContext.Provider value={{ status, user }}>
        <Routes>
          <Route path="/login" element={<LoginProbe />} />
          <Route path="/verify-email" element={<div>Verificación pendiente</div>} />
          <Route element={<ProtectedRoute requireVerified={requireVerified} />}>
            <Route path="/privado" element={<div>Contenido privado</div>} />
          </Route>
        </Routes>
      </AuthContext.Provider>
    </MemoryRouter>,
  )
}

describe('ProtectedRoute', () => {
  it('shows the loader while restoring the session', () => {
    renderProtectedRoute({ status: 'loading' })

    expect(screen.getByText('Recuperando sesión…')).toBeInTheDocument()
  })

  it('redirects to login and stores the origin route if guest', () => {
    renderProtectedRoute({ status: 'guest' })

    expect(screen.getByText('Login desde /privado')).toBeInTheDocument()
    expect(screen.queryByText('Contenido privado')).not.toBeInTheDocument()
  })

  it('redirects to login if the status is not authenticated', () => {
    renderProtectedRoute({ status: 'error' })

    expect(screen.getByText('Login desde /privado')).toBeInTheDocument()
  })

  it('renders protected content when authenticated', () => {
    renderProtectedRoute({ status: 'authenticated', user: { email_verified: true } })

    expect(screen.getByText('Contenido privado')).toBeInTheDocument()
  })

  it('redirects unverified users to the verification page', () => {
    renderProtectedRoute({ status: 'authenticated', user: { email_verified: false } })

    expect(screen.getByText('Verificación pendiente')).toBeInTheDocument()
    expect(screen.queryByText('Contenido privado')).not.toBeInTheDocument()
  })

  it('allows unverified users when verification is not required', () => {
    renderProtectedRoute({
      status: 'authenticated',
      user: { email_verified: false },
      requireVerified: false,
    })

    expect(screen.getByText('Contenido privado')).toBeInTheDocument()
  })
})
