import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { ProtectedRoute } from '../ProtectedRoute.jsx'
import { AuthContext } from '../../context/AuthContext.jsx'

function LoginProbe() {
  const location = useLocation()

  return <div>Login desde {location.state?.from ?? 'sin origen'}</div>
}

function renderProtectedRoute(status) {
  return render(
    <MemoryRouter initialEntries={['/privado']}>
      <AuthContext.Provider value={{ status }}>
        <Routes>
          <Route path="/login" element={<LoginProbe />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/privado" element={<div>Contenido privado</div>} />
          </Route>
        </Routes>
      </AuthContext.Provider>
    </MemoryRouter>,
  )
}

describe('ProtectedRoute', () => {
  it('shows the loader while restoring the session', () => {
    renderProtectedRoute('loading')

    expect(screen.getByText('Recuperando sesión…')).toBeInTheDocument()
  })

  it('redirects to login and stores the origin route if guest', () => {
    renderProtectedRoute('guest')

    expect(screen.getByText('Login desde /privado')).toBeInTheDocument()
    expect(screen.queryByText('Contenido privado')).not.toBeInTheDocument()
  })

  it('redirects to login if the status is not authenticated', () => {
    renderProtectedRoute('error')

    expect(screen.getByText('Login desde /privado')).toBeInTheDocument()
  })

  it('renders protected content when authenticated', () => {
    renderProtectedRoute('authenticated')

    expect(screen.getByText('Contenido privado')).toBeInTheDocument()
  })
})
