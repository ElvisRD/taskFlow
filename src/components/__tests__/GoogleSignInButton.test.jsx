import { act, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { GoogleSignInButton } from '../GoogleSignInButton.jsx'
import { STORAGE_KEY, ThemeProvider } from '../../context/ThemeContext.jsx'

const googleMock = vi.hoisted(() => ({
  clientId: 'client-id',
  load: vi.fn(),
}))

vi.mock('../../lib/google.js', () => ({
  get googleClientId() {
    return googleMock.clientId
  },
  loadGoogleIdentityServices: googleMock.load,
}))

function createGoogle() {
  return {
    accounts: {
      id: {
        initialize: vi.fn(),
        renderButton: vi.fn(),
      },
    },
  }
}

function renderButton(props = {}) {
  const onCredential = vi.fn()
  const onError = vi.fn()

  render(
    <ThemeProvider>
      <GoogleSignInButton onCredential={onCredential} onError={onError} {...props} />
    </ThemeProvider>,
  )

  return { onCredential, onError }
}

describe('GoogleSignInButton', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.className = ''
    googleMock.clientId = 'client-id'
    googleMock.load.mockReset()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    localStorage.clear()
    document.documentElement.className = ''
  })

  it('shows instructions when there is no client id', () => {
    googleMock.clientId = ''

    renderButton()

    expect(screen.getByText('VITE_GOOGLE_CLIENT_ID')).toBeInTheDocument()
    expect(googleMock.load).not.toHaveBeenCalled()
  })

  it('initializes Google and renders the button with the dark theme', async () => {
    localStorage.setItem(STORAGE_KEY, 'dark')
    const google = createGoogle()
    googleMock.load.mockResolvedValue(google)

    const { onCredential } = renderButton()

    await waitFor(() => expect(google.accounts.id.renderButton).toHaveBeenCalled())

    expect(google.accounts.id.initialize).toHaveBeenCalledWith(
      expect.objectContaining({
        client_id: 'client-id',
        auto_select: false,
        cancel_on_tap_outside: true,
        callback: expect.any(Function),
      }),
    )
    expect(google.accounts.id.renderButton).toHaveBeenCalledWith(
      expect.any(HTMLElement),
      expect.objectContaining({
        theme: 'filled_black',
        size: 'large',
        shape: 'rectangular',
        text: 'continue_with',
        width: 320,
      }),
    )

    act(() => {
      google.accounts.id.initialize.mock.calls[0][0].callback({ credential: 'cred-123' })
    })

    expect(onCredential).toHaveBeenCalledWith('cred-123')
  })

  it('uses the light theme for the Google button', async () => {
    localStorage.setItem(STORAGE_KEY, 'light')
    const google = createGoogle()
    googleMock.load.mockResolvedValue(google)

    renderButton({ text: 'signup_with' })

    await waitFor(() => expect(google.accounts.id.renderButton).toHaveBeenCalled())

    expect(google.accounts.id.renderButton).toHaveBeenCalledWith(
      expect.any(HTMLElement),
      expect.objectContaining({ theme: 'outline', text: 'signup_with' }),
    )
  })

  it('ignores empty credentials', async () => {
    const google = createGoogle()
    googleMock.load.mockResolvedValue(google)

    const { onCredential } = renderButton()

    await waitFor(() => expect(google.accounts.id.initialize).toHaveBeenCalled())

    act(() => {
      google.accounts.id.initialize.mock.calls[0][0].callback({})
    })

    expect(onCredential).not.toHaveBeenCalled()
  })

  it('shows and reports an error if the script fails to load', async () => {
    googleMock.load.mockRejectedValue(new Error('No se pudo cargar'))

    const { onError } = renderButton()

    expect(await screen.findByText('No se pudo cargar el botón de Google.')).toBeInTheDocument()
    expect(onError).toHaveBeenCalledWith('No se pudo cargar')
  })
})
