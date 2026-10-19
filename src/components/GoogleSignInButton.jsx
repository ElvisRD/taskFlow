import { useEffect, useRef, useState } from 'react'
import { googleClientId, loadGoogleIdentityServices } from '../lib/google.js'
import { useTheme } from '../hooks/useTheme.js'
import { Spinner } from './ui/Spinner.jsx'

export function GoogleSignInButton({ onCredential, onError, text = 'continue_with' }) {
  const containerRef = useRef(null)
  const credentialRef = useRef(onCredential)
  const errorRef = useRef(onError)
  const { resolvedTheme } = useTheme()
  const [status, setStatus] = useState(googleClientId ? 'loading' : 'unconfigured')

  useEffect(() => {
    credentialRef.current = onCredential
  }, [onCredential])

  useEffect(() => {
    errorRef.current = onError
  }, [onError])

  useEffect(() => {
    if (!googleClientId) {
      return undefined
    }

    let cancelled = false

    loadGoogleIdentityServices()
      .then((google) => {
        if (cancelled || !containerRef.current) {
          return
        }

        google.accounts.id.initialize({
          client_id: googleClientId,
          auto_select: false,
          cancel_on_tap_outside: true,
          callback: (response) => {
            if (response?.credential) {
              credentialRef.current?.(response.credential)
            }
          },
        })

        containerRef.current.replaceChildren()

        google.accounts.id.renderButton(containerRef.current, {
          type: 'standard',
          theme: resolvedTheme === 'dark' ? 'filled_black' : 'outline',
          size: 'large',
          shape: 'rectangular',
          text,
          logo_alignment: 'center',
          width: 320,
        })

        setStatus('ready')
      })
      .catch((error) => {
        if (cancelled) {
          return
        }

        setStatus('error')
        errorRef.current?.(error.message)
      })

    return () => {
      cancelled = true
    }
  }, [text, resolvedTheme])

  if (status === 'unconfigured') {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-3 text-center text-xs text-slate-500 dark:border-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-400">
        Añade <code className="font-mono text-slate-700 dark:text-zinc-300">VITE_GOOGLE_CLIENT_ID</code> en el
        <code className="font-mono text-slate-700 dark:text-zinc-300"> .env</code> del frontend para habilitar el acceso
        con Google.
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        ref={containerRef}
        className="google-signin flex min-h-[44px] w-full justify-center"
        aria-busy={status === 'loading'}
      />
      {status === 'loading' ? <Spinner className="h-5 w-5 text-indigo-600 dark:text-indigo-400" /> : null}
      {status === 'error' ? (
        <p className="text-xs text-rose-600 dark:text-rose-400">No se pudo cargar el botón de Google.</p>
      ) : null}
    </div>
  )
}
