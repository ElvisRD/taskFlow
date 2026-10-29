import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { AuthShell } from '../components/AuthShell.jsx'
import { GoogleSignInButton } from '../components/GoogleSignInButton.jsx'
import { Alert } from '../components/ui/Alert.jsx'
import { Button } from '../components/ui/Button.jsx'
import { Field, inputClass } from '../components/ui/Field.jsx'
import { useAuth } from '../hooks/useAuth.js'
import { apiErrorMessage, validationErrors } from '../lib/api.js'

export function LoginPage() {
  const { login, loginWithGoogle, isAuthenticated, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const redirectTo = location.state?.from ?? '/workspaces'

  if (isAuthenticated) {
    return (
      <Navigate
        to={user?.email_verified === false ? '/verify-email' : redirectTo}
        replace
      />
    )
  }

  const handleChange = (event) => {
    setForm((previous) => ({ ...previous, [event.target.name]: event.target.value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setErrors({})
    setMessage('')

    try {
      const authenticatedUser = await login(form)
      navigate(
        authenticatedUser?.email_verified === false ? '/verify-email' : redirectTo,
        { replace: true },
      )
    } catch (error) {
      setErrors(validationErrors(error))
      setMessage(apiErrorMessage(error))
    } finally {
      setSubmitting(false)
    }
  }

  const handleGoogleCredential = async (credential) => {
    setSubmitting(true)
    setErrors({})
    setMessage('')

    try {
      const authenticatedUser = await loginWithGoogle(credential)
      navigate(
        authenticatedUser?.email_verified === false ? '/verify-email' : redirectTo,
        { replace: true },
      )
    } catch (error) {
      setErrors(validationErrors(error))
      setMessage(apiErrorMessage(error))
    } finally {
      setSubmitting(false)
    }
  }

  const alertMessage =
    errors.credential || (!errors.email && !errors.password ? message : '')

  return (
    <AuthShell
      title="Inicia sesión"
      subtitle="Entra para gestionar tus tableros y tareas."
      footer={
        <>
          ¿No tienes cuenta?{' '}
          <Link to="/register" className="font-medium text-indigo-300 hover:text-indigo-200">
            Regístrate
          </Link>
        </>
      }
    >
      {alertMessage ? (
        <Alert className="mb-4">{alertMessage}</Alert>
      ) : null}

      <GoogleSignInButton onCredential={handleGoogleCredential} onError={setMessage} />

      <div className="relative my-5">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <span className="w-full border-t border-slate-200 dark:border-zinc-800" />
        </div>
        <div className="relative flex justify-center text-xs font-medium uppercase">
          <span className="bg-white px-2 text-slate-500 dark:bg-zinc-900 dark:text-zinc-400">
            o con tu correo
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Field label="Correo electrónico" htmlFor="email" error={errors.email}>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={form.email}
            onChange={handleChange}
            className={inputClass}
            placeholder="tu@correo.com"
          />
        </Field>

        <Field label="Contraseña" htmlFor="password" error={errors.password}>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={form.password}
            onChange={handleChange}
            className={inputClass}
            placeholder="••••••••"
          />
        </Field>

        <div className="-mt-2 text-right">
          <Link
            to="/forgot-password"
            className="text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
          >
            ¿Olvidaste tu contraseña?
          </Link>
        </div>

        <Button type="submit" loading={submitting} className="w-full" size="lg">
          Entrar
        </Button>
      </form>

      <div className="mt-6 rounded-lg bg-slate-50 p-3 text-xs text-slate-500 ring-1 ring-inset ring-slate-200 dark:bg-zinc-800/60 dark:text-zinc-400 dark:ring-zinc-700">
        <p className="font-medium text-slate-600 dark:text-zinc-300">Cuentas de demostración</p>
        <p className="mt-1">ana@taskflow.test · password</p>
        <p>beto@taskflow.test · password</p>
      </div>
    </AuthShell>
  )
}
