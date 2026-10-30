import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AuthShell } from '../components/AuthShell.jsx'
import { Alert } from '../components/ui/Alert.jsx'
import { Button } from '../components/ui/Button.jsx'
import { useAuth } from '../hooks/useAuth.js'
import { apiErrorMessage } from '../lib/api.js'

export function VerifyEmailPage() {
  const { user, isVerified, resendVerificationEmail, refreshUser, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const redirectTo = location.state?.from ?? '/workspaces'

  const [sending, setSending] = useState(false)
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const handleResend = async () => {
    setSending(true)
    setError('')
    setNotice('')

    try {
      await resendVerificationEmail()
      setNotice('Te enviamos un nuevo correo de verificación.')
    } catch (requestError) {
      setError(apiErrorMessage(requestError))
    } finally {
      setSending(false)
    }
  }

  const handleCheck = async () => {
    setChecking(true)
    setError('')
    setNotice('')

    try {
      const refreshedUser = await refreshUser()

      if (refreshedUser?.email_verified === false) {
        setError('Todavía no aparece como verificado. Revisa tu correo y vuelve a intentarlo.')
        return
      }

      navigate(redirectTo, { replace: true })
    } catch (requestError) {
      setError(apiErrorMessage(requestError))
    } finally {
      setChecking(false)
    }
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  if (isVerified) {
    return (
      <AuthShell title="Correo verificado" subtitle="Tu cuenta ya está activa.">
        <Alert tone="success" className="mb-4">
          Tu correo electrónico está verificado.
        </Alert>
        <Button as={Link} to={redirectTo} size="lg" className="w-full">
          Ir a mis workspaces
        </Button>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      title="Verifica tu correo"
      subtitle="Necesitamos confirmar tu correo antes de que empieces a trabajar."
      footer={
        <>
          ¿Cuenta equivocada?{' '}
          <button
            type="button"
            onClick={handleLogout}
            className="font-medium text-indigo-300 hover:text-indigo-200"
          >
            Cerrar sesión
          </button>
        </>
      }
    >
      {error ? <Alert className="mb-4">{error}</Alert> : null}
      {notice ? (
        <Alert tone="success" className="mb-4">
          {notice}
        </Alert>
      ) : null}

      <div className="rounded-lg bg-slate-50 px-3 py-2 ring-1 ring-inset ring-slate-200 dark:bg-zinc-800/60 dark:ring-zinc-700">
        <p className="text-xs text-slate-500 dark:text-zinc-400">Correo pendiente de verificar</p>
        <p className="mt-0.5 break-all text-sm font-medium text-slate-800 dark:text-zinc-100">
          {user?.email}
        </p>
      </div>

      <div className="mt-5 flex flex-col gap-2">
        <Button type="button" onClick={handleCheck} loading={checking} className="w-full" size="lg">
          Ya verifiqué mi correo
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={handleResend}
          loading={sending}
          className="w-full"
          size="lg"
        >
          Reenviar correo
        </Button>
      </div>

      <p className="mt-4 text-xs text-slate-500 dark:text-zinc-400">
        Si no lo encuentras, revisa la carpeta de spam o promociones. El enlace caduca en 60
        minutos.
      </p>
    </AuthShell>
  )
}
