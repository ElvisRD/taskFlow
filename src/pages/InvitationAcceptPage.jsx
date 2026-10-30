import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { AuthShell } from '../components/AuthShell.jsx'
import { Alert } from '../components/ui/Alert.jsx'
import { Button } from '../components/ui/Button.jsx'
import { Spinner } from '../components/ui/Spinner.jsx'
import { useAuth } from '../hooks/useAuth.js'
import { api, apiErrorMessage } from '../lib/api.js'
import { roleLabel } from '../lib/constants.js'

export function InvitationAcceptPage() {
  const { token } = useParams()
  const { status, isVerified } = useAuth()
  const location = useLocation()

  const [phase, setPhase] = useState('accepting')
  const [member, setMember] = useState(null)
  const [message, setMessage] = useState('')
  const attempted = useRef(false)

  const acceptInvitation = useCallback(async () => {
    setPhase('accepting')
    setMessage('')

    try {
      const { data } = await api.post(
        `/workspace-invitations/${encodeURIComponent(token)}/accept`,
      )

      setMember(data.data ?? null)
      setPhase('success')
    } catch (error) {
      if (error.response?.status === 409) {
        setPhase('success')
        setMessage('La invitación ya había sido aceptada. Puedes ir a tus workspaces.')

        return
      }

      setMessage(apiErrorMessage(error))
      setPhase('error')
    }
  }, [token])

  useEffect(() => {
    if (status !== 'authenticated' || !isVerified || attempted.current) {
      return
    }

    attempted.current = true
    acceptInvitation()
  }, [acceptInvitation, isVerified, status])

  if (status === 'loading') {
    return (
      <AuthShell title="Comprobando tu sesión" subtitle="Un momento mientras validamos tu cuenta.">
        <div className="flex justify-center py-6">
          <Spinner className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
        </div>
      </AuthShell>
    )
  }

  if (status !== 'authenticated') {
    return (
      <AuthShell
        title="Invitación a un workspace"
        subtitle="Inicia sesión o crea una cuenta con el correo que recibió la invitación."
        footer={
          <>
            El enlace es personal. Si no esperabas esta invitación, puedes ignorar el correo.
          </>
        }
      >
        <Alert tone="info" className="mb-4">
          Para aceptar la invitación necesitas una cuenta con el mismo correo electrónico al que
          fue enviada.
        </Alert>

        <div className="flex flex-col gap-2">
          <Button
            as={Link}
            to="/login"
            state={{ from: location.pathname }}
            size="lg"
            className="w-full"
          >
            Iniciar sesión
          </Button>
          <Button
            as={Link}
            to="/register"
            state={{ from: location.pathname }}
            variant="secondary"
            size="lg"
            className="w-full"
          >
            Crear cuenta
          </Button>
        </div>
      </AuthShell>
    )
  }

  if (!isVerified) {
    return (
      <AuthShell
        title="Verifica tu correo"
        subtitle="Antes de aceptar la invitación necesitamos confirmar tu correo electrónico."
      >
        <Alert tone="warning" className="mb-4">
          Verifica tu correo y vuelve a abrir este enlace de invitación para unirte al workspace.
        </Alert>

        <Button
          as={Link}
          to="/verify-email"
          state={{ from: location.pathname }}
          size="lg"
          className="w-full"
        >
          Verificar mi correo
        </Button>
      </AuthShell>
    )
  }

  if (phase === 'success') {
    return (
      <AuthShell title="Invitación aceptada" subtitle="Ya formas parte del workspace.">
        <Alert tone="success" className="mb-4">
          {member
            ? `Te uniste correctamente como ${roleLabel(member.role)}.`
            : message || 'La invitación fue aceptada correctamente.'}
        </Alert>

        <Button as={Link} to="/workspaces" size="lg" className="w-full">
          Ir a mis workspaces
        </Button>
      </AuthShell>
    )
  }

  if (phase === 'error') {
    return (
      <AuthShell
        title="No pudimos aceptar la invitación"
        subtitle="El enlace no es válido, ya expiró o no corresponde a tu cuenta."
      >
        <Alert className="mb-4">{message}</Alert>

        <div className="flex flex-col gap-2">
          <Button
            type="button"
            size="lg"
            className="w-full"
            onClick={() => {
              attempted.current = true
              acceptInvitation()
            }}
          >
            Reintentar
          </Button>
          <Button
            as={Link}
            to="/workspaces"
            variant="secondary"
            size="lg"
            className="w-full"
          >
            Ir a mis workspaces
          </Button>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell title="Aceptando invitación" subtitle="Estamos añadiéndote al workspace.">
      <div className="flex justify-center py-6">
        <Spinner className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
      </div>
    </AuthShell>
  )
}
