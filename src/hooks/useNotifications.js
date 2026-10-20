import { useCallback, useEffect, useRef, useState } from 'react'
import { api, apiErrorMessage } from '../lib/api.js'
import { getEcho } from '../lib/realtime.js'

const POLL_INTERVAL = 60_000
const PER_PAGE = 10

function mergeNotifications(current, incoming) {
  const ids = new Set()

  return [...current, ...incoming].filter((notification) => {
    if (ids.has(notification.id)) {
      return false
    }

    ids.add(notification.id)

    return true
  })
}

function refreshNotifications(current, incoming) {
  const ids = new Set(incoming.map((notification) => notification.id))

  return [...incoming, ...current.filter((notification) => !ids.has(notification.id))]
}

function markLocallyRead(notification) {
  return notification.is_read
    ? notification
    : { ...notification, is_read: true, read_at: new Date().toISOString() }
}

/**
 * Loads the authenticated user's notifications and keeps them in sync.
 *
 * Reverb delivers new notifications instantly on the user's private channel.
 * A low-frequency poll remains as a fallback for missed socket events.
 */
export function useNotifications({ enabled = true, userId = null } = {}) {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 })
  const [loading, setLoading] = useState(enabled)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState('')
  const inFlight = useRef(false)
  const seenIds = useRef(new Set())
  const pendingRealtime = useRef(new Set())

  const load = useCallback(
    async ({ page = 1, append = false, silent = false } = {}) => {
      if (!enabled || (silent && inFlight.current)) {
        return
      }

      inFlight.current = true

      const pendingAtStart = new Set(pendingRealtime.current)

      if (!silent) {
        setLoading(!append)
      }

      if (append) {
        setLoadingMore(true)
      }

      try {
        const { data } = await api.get('/notifications', {
          params: { page, per_page: PER_PAGE },
        })
        const items = data?.data ?? []

        seenIds.current = new Set([
          ...seenIds.current,
          ...items.map((item) => item.id),
        ])

        const fetchedIds = new Set(items.map((item) => item.id))

        pendingRealtime.current.forEach((id) => {
          if (fetchedIds.has(id)) {
            pendingRealtime.current.delete(id)
          }
        })

        const arrivedDuringRequest = [...pendingRealtime.current].filter(
          (id) => !pendingAtStart.has(id),
        )

        pendingRealtime.current = new Set(arrivedDuringRequest)

        setNotifications((previous) =>
          append ? mergeNotifications(previous, items) : refreshNotifications(previous, items),
        )
        setUnreadCount((data?.unread_count ?? 0) + arrivedDuringRequest.length)
        setMeta(
          data?.meta ?? { current_page: page, last_page: page, total: items.length },
        )
        setError('')
      } catch (requestError) {
        if (!silent) {
          setError(apiErrorMessage(requestError))
        }
      } finally {
        inFlight.current = false
        setLoading(false)
        setLoadingMore(false)
      }
    },
    [enabled],
  )

  useEffect(() => {
    if (!enabled) {
      return undefined
    }

    load()

    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        load({ silent: true })
      }
    }, POLL_INTERVAL)

    return () => window.clearInterval(interval)
  }, [enabled, load])

  useEffect(() => {
    if (!enabled || !userId) {
      return undefined
    }

    const echo = getEcho()

    if (!echo) {
      return undefined
    }

    const channelName = `App.Models.User.${userId}`
    const channel = echo.private(channelName)

    channel.notification((notification) => {
      if (!notification?.id || seenIds.current.has(notification.id)) {
        return
      }

      seenIds.current.add(notification.id)
      pendingRealtime.current.add(notification.id)
      setNotifications((previous) => [notification, ...previous])
      setUnreadCount((count) => count + 1)
      setMeta((current) => ({ ...current, total: current.total + 1 }))
    })

    return () => echo.leave(channelName)
  }, [enabled, userId])

  const markAsRead = useCallback(async (notification) => {
    if (!notification?.id || notification.is_read) {
      return true
    }

    const wasPending = pendingRealtime.current.delete(notification.id)

    setNotifications((previous) =>
      previous.map((item) => (item.id === notification.id ? markLocallyRead(item) : item)),
    )
    setUnreadCount((count) => Math.max(0, count - 1))
    setError('')

    try {
      await api.patch(`/notifications/${notification.id}/read`)

      return true
    } catch (requestError) {
      if (wasPending) {
        pendingRealtime.current.add(notification.id)
      }

      setNotifications((previous) =>
        previous.map((item) =>
          item.id === notification.id
            ? { ...item, is_read: false, read_at: null }
            : item,
        ),
      )
      setUnreadCount((count) => count + 1)
      setError(apiErrorMessage(requestError))

      return false
    }
  }, [])

  const markAllAsRead = useCallback(async () => {
    if (unreadCount === 0) {
      return true
    }

    const previous = notifications
    const previousUnread = unreadCount
    const previousPending = new Set(pendingRealtime.current)

    pendingRealtime.current.clear()
    setNotifications((current) => current.map(markLocallyRead))
    setUnreadCount(0)
    setError('')

    try {
      await api.post('/notifications/read-all')

      return true
    } catch (requestError) {
      pendingRealtime.current = previousPending
      setNotifications(previous)
      setUnreadCount(previousUnread)
      setError(apiErrorMessage(requestError))

      return false
    }
  }, [notifications, unreadCount])

  const hasMore = meta.current_page < meta.last_page

  const loadMore = useCallback(() => {
    if (!hasMore || loadingMore) {
      return
    }

    load({ page: meta.current_page + 1, append: true })
  }, [hasMore, load, loadingMore, meta.current_page])

  const refresh = useCallback(() => load({ silent: true }), [load])

  return {
    notifications,
    unreadCount,
    hasMore,
    loading,
    loadingMore,
    error,
    refresh,
    loadMore,
    markAsRead,
    markAllAsRead,
  }
}
