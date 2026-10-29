import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import { PageLoader } from './ui/Spinner.jsx'

export function ProtectedRoute({ requireVerified = true }) {
  const { status, user } = useAuth()
  const location = useLocation()

  if (status === 'loading') {
    return <PageLoader label="Recuperando sesión…" />
  }

  if (status !== 'authenticated') {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (requireVerified && user?.email_verified === false) {
    return <Navigate to="/verify-email" replace />
  }

  return <Outlet />
}
