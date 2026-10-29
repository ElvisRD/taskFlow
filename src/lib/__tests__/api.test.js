import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  UNAUTHORIZED_EVENT,
  VERIFICATION_REQUIRED_EVENT,
  api,
  apiErrorMessage,
  downloadFile,
  isValidationError,
  validationErrors,
} from '../api.js'
import { getToken, setToken } from '../token.js'

const originalAdapter = api.defaults.adapter

function respondWith(handler) {
  api.defaults.adapter = async (config) => handler(config)
}

function rejectWith(error) {
  api.defaults.adapter = async (config) => {
    const requestError = new Error(error.message ?? 'Request failed')
    requestError.config = config
    requestError.response = { status: error.status, data: error.data ?? {}, config }
    throw requestError
  }
}

function successResponse(config, data = {}) {
  return { data, status: 200, statusText: 'OK', headers: {}, config }
}

describe('api', () => {
  beforeEach(() => {
    localStorage.clear()
    api.defaults.adapter = originalAdapter
  })

  afterEach(() => {
    api.defaults.adapter = originalAdapter
    localStorage.clear()
  })

  it('adds the token to the Authorization header when present', async () => {
    let capturedConfig
    respondWith((config) => {
      capturedConfig = config
      return successResponse(config)
    })

    setToken('token-abc')
    await api.get('/ping')

    expect(capturedConfig.headers.Authorization).toBe('Bearer token-abc')
  })

  it('does not add Authorization when there is no token', async () => {
    let capturedConfig
    respondWith((config) => {
      capturedConfig = config
      return successResponse(config)
    })

    await api.get('/ping')

    expect(capturedConfig.headers.Authorization).toBeUndefined()
  })

  it('on a 401, clears the token and emits the session-expired event', async () => {
    const handler = vi.fn()
    window.addEventListener(UNAUTHORIZED_EVENT, handler)
    rejectWith({ status: 401 })

    setToken('token-caducado')

    await expect(api.get('/private')).rejects.toThrow()

    expect(getToken()).toBeNull()
    expect(handler).toHaveBeenCalledTimes(1)

    window.removeEventListener(UNAUTHORIZED_EVENT, handler)
  })

  it('on a 401 without a token, does not emit the event', async () => {
    const handler = vi.fn()
    window.addEventListener(UNAUTHORIZED_EVENT, handler)
    rejectWith({ status: 401 })

    await expect(api.get('/private')).rejects.toThrow()

    expect(handler).not.toHaveBeenCalled()

    window.removeEventListener(UNAUTHORIZED_EVENT, handler)
  })

  it('on a 403 requiring email verification, emits the verification event', async () => {
    const handler = vi.fn()
    window.addEventListener(VERIFICATION_REQUIRED_EVENT, handler)
    rejectWith({
      status: 403,
      data: { message: 'Debes verificar tu correo electrónico antes de continuar.' },
    })

    await expect(api.get('/workspaces')).rejects.toThrow()

    expect(handler).toHaveBeenCalledTimes(1)

    window.removeEventListener(VERIFICATION_REQUIRED_EVENT, handler)
  })

  it('does not emit the verification event for other 403 responses', async () => {
    const handler = vi.fn()
    window.addEventListener(VERIFICATION_REQUIRED_EVENT, handler)
    rejectWith({
      status: 403,
      data: { message: 'No tienes permisos para realizar esta acción.' },
    })

    await expect(api.get('/workspaces')).rejects.toThrow()

    expect(handler).not.toHaveBeenCalled()

    window.removeEventListener(VERIFICATION_REQUIRED_EVENT, handler)
  })
})

describe('apiErrorMessage', () => {
  it('prioritizes the server message', () => {
    expect(
      apiErrorMessage({
        response: { status: 500, data: { message: 'Error del servidor' } },
        message: 'Network Error',
      }),
    ).toBe('Error del servidor')
  })

  it('translates 403 and 404 without a message', () => {
    expect(apiErrorMessage({ response: { status: 403, data: {} } })).toBe(
      'No tienes permisos para realizar esta acción.',
    )
    expect(apiErrorMessage({ response: { status: 404, data: {} } })).toBe(
      'El recurso solicitado no existe.',
    )
  })

  it('translates 429 regardless of the server message', () => {
    expect(
      apiErrorMessage({
        response: { status: 429, data: { message: 'Too Many Attempts.' } },
      }),
    ).toBe('Demasiados intentos. Espera un momento antes de volver a intentarlo.')
  })

  it('uses the error message as fallback', () => {
    expect(apiErrorMessage({ message: 'Network Error' })).toBe('Network Error')
  })

  it('returns a generic message when there is no information', () => {
    expect(apiErrorMessage()).toBe('Ocurrió un error inesperado.')
    expect(apiErrorMessage({})).toBe('Ocurrió un error inesperado.')
  })
})

describe('validationErrors', () => {
  it('flattens 422 errors to the first message per field', () => {
    const error = {
      response: {
        status: 422,
        data: {
          errors: {
            email: ['El correo ya está registrado.', 'Otro error.'],
            password: ['La contraseña es obligatoria.'],
          },
        },
      },
    }

    expect(validationErrors(error)).toEqual({
      email: 'El correo ya está registrado.',
      password: 'La contraseña es obligatoria.',
    })
  })

  it('converts non-array messages to string', () => {
    expect(
      validationErrors({
        response: { data: { errors: { title: 'Título inválido' } } },
      }),
    ).toEqual({ title: 'Título inválido' })
  })

  it('returns an empty object when there are no validation errors', () => {
    expect(validationErrors()).toEqual({})
    expect(validationErrors({ response: { data: {} } })).toEqual({})
  })
})

describe('isValidationError', () => {
  it('returns true only for a 422', () => {
    expect(isValidationError({ response: { status: 422 } })).toBe(true)
    expect(isValidationError({ response: { status: 400 } })).toBe(false)
    expect(isValidationError()).toBe(false)
  })
})

describe('downloadFile', () => {
  it('downloads the blob and cleans up the temporary link', async () => {
    vi.spyOn(api, 'get').mockResolvedValue({ data: new Blob(['contenido']) })

    const createObjectURL = vi.fn(() => 'blob:fake-url')
    const revokeObjectURL = vi.fn()
    Object.defineProperty(window.URL, 'createObjectURL', {
      configurable: true,
      writable: true,
      value: createObjectURL,
    })
    Object.defineProperty(window.URL, 'revokeObjectURL', {
      configurable: true,
      writable: true,
      value: revokeObjectURL,
    })

    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function onClick() {
      expect(this.download).toBe('informe.pdf')
    })

    await downloadFile('/attachments/5/download', 'informe.pdf')

    expect(api.get).toHaveBeenCalledWith('/attachments/5/download', { responseType: 'blob' })
    expect(createObjectURL).toHaveBeenCalledTimes(1)
    expect(click).toHaveBeenCalledTimes(1)
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:fake-url')
    expect(document.querySelector('a[download]')).toBeNull()
  })

  it('uses "descarga" as the default filename', async () => {
    vi.spyOn(api, 'get').mockResolvedValue({ data: new Blob(['x']) })
    Object.defineProperty(window.URL, 'createObjectURL', {
      configurable: true,
      writable: true,
      value: vi.fn(() => 'blob:x'),
    })
    Object.defineProperty(window.URL, 'revokeObjectURL', {
      configurable: true,
      writable: true,
      value: vi.fn(),
    })

    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function onClick() {
      expect(this.download).toBe('descarga')
    })

    await downloadFile('/attachments/5/download')

    expect(click).toHaveBeenCalled()
  })
})

