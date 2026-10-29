import { useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AuthShell } from '../components/AuthShell.jsx'
import { Alert } from '../components/ui/Alert.jsx'
import { Button } from '../components/ui/Button.jsx'
import { useAuth } from '../hooks/useAuth.js'

export function EmailVerifiedPage() {
  const { status, isAuthenticated, isVerified, refreshUser } = useAuth()
  const [searchParams] = useSearchParams()
  const invalid = searchParams.get('status') === 'invalid'

  useEffect(() => {
    if (!invalid && status === 'authenticated' && !isVerified) {
      refreshUser().catch(() => {})
    }
  }, [invalid, status, isVerified, refreshUser])

  if (invalid) {
    return (
      <AuthShell
        title="No pudimos verificar tu correo"
        subtitle="El enlace no es válido o ha caducado."
      >
        <Alert tone="warning" className="mb-4">
          Solicita un nuevo correo de verificación desde tu cuenta para continuar.
        </Alert>

        <Button
          as={Link}
          to={isAuthenticated ? '/verify-email' : '/login'}
          size="lg"
          className="w-full"
        >
          {isAuthenticated ? 'Solicitar otro correo' : 'Iniciar sesión'}
        </Button>
      </AuthShell>
    )
  }

  return (
    <AuthShell title="Correo verificado" subtitle="Tu cuenta ya está activa.">
      <Alert tone="success" className="mb-4">
        Verificamos tu correo electrónico correctamente.
      </Alert>

      <p className="text-sm text-slate-500 dark:text-zinc-400">
        Ya puedes acceder a todas las funciones de TaskFlow.
      </p>

      <Button as={Link} to={isAuthenticated ? '/workspaces' : '/login'} size="lg" className="mt-6 w-full">
        {isAuthenticated ? 'Ir a mis workspaces' : 'Iniciar sesión'}
      </Button>
    </AuthShell>
  )
}
