import axios from 'axios'
import { clearToken, getToken } from './token'

/**
 * Evento que se dispara cuando el token deja de ser válido y la sesión
 * debe cerrarse (por ejemplo, tras un 401).
 */
export const UNAUTHORIZED_EVENT = 'taskflow:unauthorized'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  headers: { Accept: 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = getToken()

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && getToken()) {
      clearToken()
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT))
    }

    return Promise.reject(error)
  },
)

/** Mensaje legible para cualquier error devuelto por la API. */
export function apiErrorMessage(error) {
  if (error?.response?.data?.message) {
    return error.response.data.message
  }

  if (error?.response?.status === 403) {
    return 'No tienes permisos para realizar esta acción.'
  }

  if (error?.response?.status === 404) {
    return 'El recurso solicitado no existe.'
  }

  return error?.message || 'Ocurrió un error inesperado.'
}

/**
 * Aplana los errores de validación (422) a un mapa `campo -> primer mensaje`.
 */
export function validationErrors(error) {
  const errors = error?.response?.data?.errors

  if (!errors) {
    return {}
  }

  return Object.fromEntries(
    Object.entries(errors).map(([field, messages]) => [
      field,
      Array.isArray(messages) ? messages[0] : String(messages),
    ]),
  )
}

export function isValidationError(error) {
  return error?.response?.status === 422
}

/** Descarga un archivo protegido usando el token de la sesión. */
export async function downloadFile(url, filename) {
  const response = await api.get(url, { responseType: 'blob' })
  const objectUrl = window.URL.createObjectURL(response.data)
  const link = document.createElement('a')

  link.href = objectUrl
  link.download = filename || 'descarga'
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(objectUrl)
}
