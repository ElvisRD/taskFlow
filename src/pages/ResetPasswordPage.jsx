import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AuthShell } from '../components/AuthShell.jsx'
import { Alert } from '../components/ui/Alert.jsx'
import { Button } from '../components/ui/Button.jsx'
import { Field, inputClass } from '../components/ui/Field.jsx'
import { useAuth } from '../hooks/useAuth.js'
import { apiErrorMessage, validationErrors } from '../lib/api.js'

const EMPTY_FORM = {
  password: '',
  password_confirmation: '',
}

export function ResetPasswordPage() {
  const { resetPassword } = useAuth()
  const [searchParams] = useSearchParams()

  const token = searchParams.get('token') ?? ''
  const email = searchParams.get('email') ?? ''
  const hasLink = Boolean(token && email)

  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [message, setMessage] = useState('')
  const [done, setDone] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const handleChange = (event) => {
    setForm((previous) => ({ ...previous, [event.target.name]: event.target.value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setErrors({})
    setMessage('')

    try {
      await resetPassword({
        token,
        email,
        password: form.password,
        password_confirmation: form.password_confirmation,
      })
      setDone(true)
    } catch (error) {
      setErrors(validationErrors(error))
      setMessage(apiErrorMessage(error))
    } finally {
      setSubmitting(false)
    }
  }

  const alertMessage =
    errors.email ||
    errors.token ||
    (!errors.password && !errors.password_confirmation ? message : '')

  return (
    <AuthShell
      title="Crea una nueva contraseña"
      subtitle="Elige una contraseña segura para volver a entrar."
      footer={
        <>
          ¿No solicitaste el cambio?{' '}
          <Link to="/login" className="font-medium text-indigo-300 hover:text-indigo-200">
            Inicia sesión
          </Link>
        </>
      }
    >
      {!hasLink ? (
        <>
          <Alert tone="warning" className="mb-4">
            El enlace no es válido o está incompleto. Solicita uno nuevo para continuar.
          </Alert>
          <Button as={Link} to="/forgot-password" size="lg" className="w-full">
            Solicitar otro enlace
          </Button>
        </>
      ) : done ? (
        <>
          <Alert tone="success" className="mb-4">
            Tu contraseña se restableció correctamente.
          </Alert>
          <p className="text-sm text-slate-500 dark:text-zinc-400">
            Ya puedes iniciar sesión con tu nueva contraseña.
          </p>
          <Button as={Link} to="/login" size="lg" className="mt-6 w-full">
            Iniciar sesión
          </Button>
        </>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {alertMessage ? <Alert className="mb-4">{alertMessage}</Alert> : null}

          <div className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500 ring-1 ring-inset ring-slate-200 dark:bg-zinc-800/60 dark:text-zinc-400 dark:ring-zinc-700">
            Restableciendo la contraseña de{' '}
            <span className="font-medium text-slate-700 dark:text-zinc-200">{email}</span>
          </div>

          <Field
            label="Nueva contraseña"
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
            Restablecer contraseña
          </Button>
        </form>
      )}
    </AuthShell>
  )
}
