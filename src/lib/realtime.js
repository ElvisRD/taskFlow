import Echo from 'laravel-echo'
import Pusher from 'pusher-js'
import { api } from './api.js'

let echo = null

/**
 * Authorizes private channels with the same Sanctum token used by the API.
 *
 * Reading the token through the Axios instance (instead of a static header)
 * keeps the connection working after a new login.
 */
function authorizeChannel(channel) {
  return {
    authorize: (socketId, callback) => {
      api
        .post('/broadcasting/auth', {
          socket_id: socketId,
          channel_name: channel.name,
        })
        .then(({ data }) => callback(null, data))
        .catch((error) => callback(error, null))
    },
  }
}

/**
 * Returns the shared Echo client, or null when Reverb is not configured.
 */
export function getEcho() {
  const key = import.meta.env.VITE_REVERB_APP_KEY

  if (!key || import.meta.env.MODE === 'test') {
    return null
  }

  if (echo) {
    return echo
  }

  window.Pusher = Pusher

  echo = new Echo({
    broadcaster: 'reverb',
    key,
    wsHost: import.meta.env.VITE_REVERB_HOST || window.location.hostname,
    wsPort: Number(import.meta.env.VITE_REVERB_PORT ?? 80),
    wssPort: Number(import.meta.env.VITE_REVERB_PORT ?? 443),
    forceTLS: (import.meta.env.VITE_REVERB_SCHEME ?? 'https') === 'https',
    enabledTransports: ['ws', 'wss'],
    authorizer: authorizeChannel,
  })

  return echo
}

/** Closes the shared connection, if it was opened. */
export function disconnectEcho() {
  echo?.disconnect()
  echo = null
}
