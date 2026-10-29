import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { AuthShell } from '../components/AuthShell.jsx'
import { GoogleSignInButton } from '../components/GoogleSignInButton.jsx'
import { Alert } from '../components/ui/Alert.jsx'
import { Button } from '../components/ui/Button.jsx'
import { Field, inputClass } from '../components/ui/Field.jsx'
import { useAuth } from '../hooks/useAuth.js'
import { apiErrorMessage, validationErrors } from '../lib/api.js'

const EMPTY_FORM = {
  name: '',
  email: '',
  password: '',
  password_confirmation: '',
}

export function RegisterPage() {
  const { register, loginWithGoogle, isAuthenticated, user } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (isAuthenticated) {
    return (
      <Navigate
        to={user?.email_verified === false ? '/verify-email' : '/workspaces'}
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
      const registeredUser = await register(form)
      navigate(
        registeredUser?.email_verified === false ? '/verify-email' : '/workspaces',
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
        authenticatedUser?.email_verified === false ? '/verify-email' : '/workspaces',
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
    errors.credential ||
    (!errors.name && !errors.email && !errors.password ? message : '')

  return (
    <AuthShell
      title="Crea tu cuenta"
      subtitle="Regístrate para empezar a organizar tu trabajo. Te enviaremos un correo para verificar tu cuenta."
      footer={
        <>
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="font-medium text-indigo-300 hover:text-indigo-200">
            Inicia sesión
          </Link>
        </>
      }
    >
      {alertMessage ? (
        <Alert className="mb-4">{alertMessage}</Alert>
      ) : null}

      <GoogleSignInButton
        text="signup_with"
        onCredential={handleGoogleCredential}
        onError={setMessage}
      />

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
        <Field label="Nombre" htmlFor="name" error={errors.name}>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            required
            value={form.name}
            onChange={handleChange}
            className={inputClass}
            placeholder="Ana Propietaria"
          />
        </Field>

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

        <Field
          label="Contraseña"
          htmlFor="password"
          error={errors.password}
          hint="Mínimo 8 caracteres."
        >
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            value={form.password}
            onChange={handleChange}
            className={inputClass}
            placeholder="••••••••"
          />
        </Field>

        <Field
          label="Confirmar contraseña"
          htmlFor="password_confirmation"
          error={errors.password_confirmation}
        >
          <input
            id="password_confirmation"
            name="password_confirmation"
            type="password"
            autoComplete="new-password"
            required
            value={form.password_confirmation}
            onChange={handleChange}
            className={inputClass}
            placeholder="••••••••"
          />
        </Field>

        <Button type="submit" loading={submitting} className="w-full" size="lg">
          Crear cuenta
        </Button>
      </form>
    </AuthShell>
  )
}
