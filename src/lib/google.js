const SCRIPT_ID = 'google-identity-services'

let loaderPromise = null

/** Client ID público de Google (los client IDs no son secretos). */
export const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? ''

/**
 * Carga el script de Google Identity Services una sola vez y resuelve con el
 * objeto global `google`.
 */
export function loadGoogleIdentityServices() {
  if (window.google?.accounts?.id) {
    return Promise.resolve(window.google)
  }

  if (loaderPromise) {
    return loaderPromise
  }

  loaderPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById(SCRIPT_ID)
    const script = existing ?? document.createElement('script')

    script.id = SCRIPT_ID
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true

    script.addEventListener('load', () => {
      if (window.google?.accounts?.id) {
        resolve(window.google)
      } else {
        reject(new Error('Google Identity Services no se inicializó correctamente.'))
      }
    })

    script.addEventListener('error', () => {
      loaderPromise = null
      reject(new Error('No se pudo cargar Google Identity Services.'))
    })

    if (!existing) {
      document.head.appendChild(script)
    }
  })

  return loaderPromise
}
