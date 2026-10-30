import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { PageContainer } from '../components/PageContainer.jsx'
import { IconChevronLeft } from '../components/icons.jsx'
import { Alert } from '../components/ui/Alert.jsx'
import { Badge } from '../components/ui/Badge.jsx'
import { Button } from '../components/ui/Button.jsx'
import { ConfirmDialog } from '../components/ui/ConfirmDialog.jsx'
import { Field, inputClass } from '../components/ui/Field.jsx'
import { PageLoader } from '../components/ui/Spinner.jsx'
import { useAuth } from '../hooks/useAuth.js'
import { apiErrorMessage, validationErrors } from '../lib/api.js'
import { formatDateTime } from '../lib/format.js'

const EMPTY_PASSWORD_FORM = {
  current_password: '',
  password: '',
  password_confirmation: '',
}

function SessionRow({ token, revoking, onRevoke }) {
  const created = formatDateTime(token.created_at)
  const lastUsed = token.last_used_at ? formatDateTime(token.last_used_at) : null
  const expires = token.expires_at ? formatDateTime(token.expires_at) : null

  return (
    <li className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-sm font-medium text-slate-800 dark:text-zinc-100">
            {token.name || 'Sesión sin nombre'}
          </p>
          {token.is_current ? (
            <Badge className="bg-indigo-50 text-indigo-700 ring-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-300 dark:ring-indigo-500/30">
              Actual
            </Badge>
          ) : null}
        </div>
        <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
          Creada {created ?? '—'}
          {lastUsed ? ` · Último uso ${lastUsed}` : ' · Sin uso registrado'}
          {expires ? ` · Expira ${expires}` : ' · Sin expiración'}
        </p>
      </div>

      <Button
        type="button"
        variant={token.is_current ? 'danger' : 'secondary'}
        size="sm"
        loading={revoking}
        onClick={onRevoke}
        className="shrink-0"
      >
        {token.is_current ? 'Cerrar esta sesión' : 'Revocar'}
      </Button>
    </li>
  )
}

export function SecurityPage() {
  const {
    user,
    updatePassword,
    refreshUser,
    listTokens,
    revokeToken,
    revokeOtherTokens,
    logoutAll,
    logout,
  } = useAuth()
  const navigate = useNavigate()

  const hasPassword = user?.has_password !== false
  const isDemoAccount = user?.is_demo === true

  const [passwordForm, setPasswordForm] = useState(EMPTY_PASSWORD_FORM)
  const [passwordErrors, setPasswordErrors] = useState({})
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)

  const [tokens, setTokens] = useState([])
  const [tokensLoading, setTokensLoading] = useState(true)
  const [tokensError, setTokensError] = useState('')
  const [revokingId, setRevokingId] = useState(null)
  const [confirmAction, setConfirmAction] = useState(null)
  const [confirmLoading, setConfirmLoading] = useState(false)

  const loadTokens = useCallback(async () => {
    setTokensLoading(true)

    try {
      setTokens(await listTokens())
      setTokensError('')
    } catch (error) {
      setTokensError(apiErrorMessage(error))
    } finally {
      setTokensLoading(false)
    }
  }, [listTokens])

  useEffect(() => {
    loadTokens()
  }, [loadTokens])

  const handlePasswordChange = (event) => {
    setPasswordForm((previous) => ({ ...previous, [event.target.name]: event.target.value }))
  }

  const handlePasswordSubmit = async (event) => {
    event.preventDefault()
    setSavingPassword(true)
    setPasswordErrors({})
    setPasswordError('')
    setPasswordSuccess('')

    try {
      const payload = {
        password: passwordForm.password,
        password_confirmation: passwordForm.password_confirmation,
      }

      if (hasPassword) {
        payload.current_password = passwordForm.current_password
      }

      await updatePassword(payload)
      setPasswordForm(EMPTY_PASSWORD_FORM)
      setPasswordSuccess(
        hasPassword
          ? 'Contraseña actualizada correctamente.'
          : 'Contraseña establecida correctamente.',
      )

      await refreshUser().catch(() => {})
      await loadTokens()
    } catch (error) {
      const fieldErrors = validationErrors(error)

      setPasswordErrors(fieldErrors)

      if (Object.keys(fieldErrors).length === 0) {
        setPasswordError(apiErrorMessage(error))
      }
    } finally {
      setSavingPassword(false)
    }
  }

  const handleRevoke = async (token) => {
    setRevokingId(token.id)
    setTokensError('')

    try {
      await revokeToken(token.id)

      if (token.is_current) {
        await logout()
        navigate('/login', { replace: true })
        return
      }

      setTokens((current) => current.filter((item) => item.id !== token.id))
    } catch (error) {
      setTokensError(apiErrorMessage(error))
    } finally {
      setRevokingId(null)
    }
  }

  const handleConfirm = async () => {
    if (!confirmAction) {
      return
    }

    setConfirmLoading(true)
    setTokensError('')

    try {
      if (confirmAction === 'others') {
        await revokeOtherTokens()
        await loadTokens()
      }

      if (confirmAction === 'all') {
        await logoutAll()
        navigate('/login', { replace: true })
        return
      }
    } catch (error) {
      setTokensError(apiErrorMessage(error))
    } finally {
      setConfirmLoading(false)
      setConfirmAction(null)
    }
  }

  return (
    <PageContainer>
      <Link
        to="/workspaces"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-100"
      >
        <IconChevronLeft className="h-4 w-4" />
        Workspaces
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-zinc-100">Seguridad</h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-500 dark:text-zinc-400">
          Gestiona tu contraseña y las sesiones desde las que has iniciado sesión.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="lg:col-span-1">
          <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 dark:bg-zinc-900 dark:ring-zinc-800">
            <header className="border-b border-slate-200 px-4 py-4 dark:border-zinc-800">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-semibold text-slate-900 dark:text-zinc-100">
                  Contraseña
                </h2>
                {isDemoAccount ? (
                  <Badge className="bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/30">
                    Cuenta demo
                  </Badge>
                ) : null}
              </div>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-zinc-400">
                {isDemoAccount
                  ? 'Esta cuenta de demostración no permite cambiar la contraseña desde este panel.'
                  : hasPassword
                    ? 'Cambia tu contraseña periódicamente para mayor seguridad.'
                    : 'Tu cuenta se creó con Google. Puedes establecer una contraseña para acceder también con tu correo.'}
              </p>
            </header>

            {isDemoAccount ? (
              <div className="px-4 py-4">
                <Alert tone="info">
                  Las cuentas de prueba como Ana, Beto o Carla usan la contraseña compartida
                  <strong> password</strong>. Para evitar que la demo deje de funcionar, no se
                  puede cambiar desde aquí.
                </Alert>
              </div>
            ) : (
              <form onSubmit={handlePasswordSubmit} className="space-y-4 px-4 py-4" noValidate>
                {passwordError ? <Alert>{passwordError}</Alert> : null}
                {passwordSuccess ? <Alert tone="success">{passwordSuccess}</Alert> : null}

                {hasPassword ? (
                  <Field
                    label="Contraseña actual"
                    htmlFor="current_password"
                    error={passwordErrors.current_password}
                  >
                    <input
                      id="current_password"
                      name="current_password"
                      type="password"
                      autoComplete="current-password"
                      value={passwordForm.current_password}
                      onChange={handlePasswordChange}
                      className={inputClass}
                      placeholder="••••••••"
                    />
                  </Field>
                ) : null}

                <Field
                  label="Nueva contraseña"
                  htmlFor="password"
                  error={passwordErrors.password}
                  hint="Mínimo 8 caracteres."
                >
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={passwordForm.password}
                    onChange={handlePasswordChange}
                    className={inputClass}
                    placeholder="••••••••"
                  />
                </Field>

                <Field
                  label="Confirmar contraseña"
                  htmlFor="password_confirmation"
                  error={passwordErrors.password_confirmation}
                >
                  <input
                    id="password_confirmation"
                    name="password_confirmation"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={passwordForm.password_confirmation}
                    onChange={handlePasswordChange}
                    className={inputClass}
                    placeholder="••••••••"
                  />
                </Field>

                <Button type="submit" loading={savingPassword} className="w-full">
                  {hasPassword ? 'Actualizar contraseña' : 'Establecer contraseña'}
                </Button>
              </form>
            )}
          </div>
        </section>

        <section className="lg:col-span-2">
          <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 dark:bg-zinc-900 dark:ring-zinc-800">
            <header className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 px-4 py-4 dark:border-zinc-800">
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-zinc-100">
                  Sesiones activas
                </h2>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-zinc-400">
                  Revoca cualquier sesión que no reconozcas.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={tokensLoading || tokens.length < 2}
                  onClick={() => setConfirmAction('others')}
                >
                  Cerrar otras
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  disabled={tokensLoading || tokens.length === 0}
                  onClick={() => setConfirmAction('all')}
                >
                  Cerrar todas
                </Button>
              </div>
            </header>

            {tokensError ? (
              <div className="px-4 py-4">
                <div className="flex flex-wrap items-center gap-3">
                  <Alert className="flex-1">{tokensError}</Alert>
                  <Button variant="secondary" size="sm" onClick={() => loadTokens()}>
                    Reintentar
                  </Button>
                </div>
              </div>
            ) : null}

            {tokensLoading ? (
              <PageLoader label="Cargando sesiones…" />
            ) : tokens.length === 0 ? (
              <p className="px-4 py-6 text-sm text-slate-500 dark:text-zinc-400">
                No hay sesiones activas.
              </p>
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-zinc-800">
                {tokens.map((token) => (
                  <SessionRow
                    key={token.id}
                    token={token}
                    revoking={revokingId === token.id}
                    onRevoke={() => handleRevoke(token)}
                  />
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>

      <ConfirmDialog
        open={confirmAction !== null}
        title={confirmAction === 'all' ? 'Cerrar todas las sesiones' : 'Cerrar otras sesiones'}
        description={
          confirmAction === 'all'
            ? 'Se cerrará tu sesión actual y todas las demás. Tendrás que iniciar sesión de nuevo.'
            : 'Las demás sesiones se cerrarán, pero esta seguirá activa.'
        }
        confirmLabel={confirmAction === 'all' ? 'Cerrar todas' : 'Cerrar otras'}
        loading={confirmLoading}
        onConfirm={handleConfirm}
        onClose={() => {
          if (!confirmLoading) {
            setConfirmAction(null)
          }
        }}
      />
    </PageContainer>
  )
}
