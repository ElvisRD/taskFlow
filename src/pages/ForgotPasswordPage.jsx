import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AuthShell } from '../components/AuthShell.jsx'
import { Alert } from '../components/ui/Alert.jsx'
import { Button } from '../components/ui/Button.jsx'
import { Field, inputClass } from '../components/ui/Field.jsx'
import { useAuth } from '../hooks/useAuth.js'
import { apiErrorMessage, validationErrors } from '../lib/api.js'

export function ForgotPasswordPage() {
  const { forgotPassword } = useAuth()

  const [email, setEmail] = useState('')
  const [errors, setErrors] = useState({})
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setErrors({})
    setMessage('')

    try {
      await forgotPassword(email.trim())
      setSent(true)
    } catch (error) {
      setErrors(validationErrors(error))
      setMessage(apiErrorMessage(error))
    } finally {
      setSubmitting(false)
    }
  }

  const alertMessage = !errors.email ? message : ''

  return (
    <AuthShell
      title="Recupera tu contraseña"
      subtitle="Te enviaremos un enlace para que puedas crear una nueva."
      footer={
        <>
          ¿Ya la recordaste?{' '}
          <Link to="/login" className="font-medium text-indigo-300 hover:text-indigo-200">
            Inicia sesión
          </Link>
        </>
      }
    >
      {sent ? (
        <>
          <Alert tone="success" className="mb-4">
            Si el correo está registrado, recibirás un enlace para restablecer tu contraseña.
          </Alert>
          <p className="text-sm text-slate-500 dark:text-zinc-400">
            Revisa tu bandeja de entrada y la carpeta de spam. El enlace caduca en 60 minutos.
          </p>
          <Button as={Link} to="/login" variant="secondary" size="lg" className="mt-6 w-full">
            Volver a iniciar sesión
          </Button>
        </>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {alertMessage ? <Alert className="mb-4">{alertMessage}</Alert> : null}

          <Field label="Correo electrónico" htmlFor="email" error={errors.email}>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className={inputClass}
              placeholder="tu@correo.com"
            />
          </Field>

          <Button type="submit" loading={submitting} className="w-full" size="lg">
            Enviar enlace
          </Button>
        </form>
      )}
    </AuthShell>
  )
}
