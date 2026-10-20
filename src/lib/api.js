import axios from 'axios'
import { clearToken, getToken } from './token'

/**
 * Event fired when the token is no longer valid and the session
 * must be closed (for example, after a 401).
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

/** Human-readable message for any error returned by the API. */
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
 * Flattens validation errors (422) into a `field -> first message` map.
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

/** Downloads a protected file using the session token. */
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
