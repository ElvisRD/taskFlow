import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { IconBell, IconCheck } from '../../components/icons.jsx'
import { Spinner } from '../../components/ui/Spinner.jsx'
import { useAuth } from '../../hooks/useAuth.js'
import { useNotifications } from '../../hooks/useNotifications.js'
import { formatRelativeTime } from '../../lib/format.js'
import { notificationContent, notificationTarget } from './notificationMeta.js'

function NotificationItem({ notification, onOpen }) {
  const { Icon, tone, title, body, detail } = notificationContent(notification.payload)

  return (
    <li>
      <button
        type="button"
        onClick={() => onOpen(notification)}
        className={`flex w-full gap-3 px-4 py-3 text-left transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-indigo-600 dark:hover:bg-zinc-800/70 ${
          notification.is_read ? '' : 'bg-indigo-50/60 dark:bg-indigo-500/5'
        }`}
      >
        <span
          className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${tone}`}
        >
          <Icon className="h-4 w-4" />
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex items-start justify-between gap-2">
            <span className="text-sm font-medium text-slate-800 dark:text-zinc-100">
              {title}
            </span>
            {notification.is_read ? null : (
              <span
                aria-label="Sin leer"
                className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-indigo-600 dark:bg-indigo-400"
              />
            )}
          </span>

          <span className="mt-0.5 block break-words text-sm text-slate-600 dark:text-zinc-300">
            {body}
          </span>

          {detail ? (
            <span className="mt-1 block truncate text-xs text-slate-500 dark:text-zinc-400">
              {detail}
            </span>
          ) : null}

          <span className="mt-1 block text-xs text-slate-400 dark:text-zinc-500">
            {formatRelativeTime(notification.created_at)}
          </span>
        </span>
      </button>
    </li>
  )
}

/**
 * Header bell with the latest notifications and read actions.
 */
export function NotificationBell() {
  const { user } = useAuth()
  const {
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
  } = useNotifications({ userId: user?.id })
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)

  useEffect(() => {
    if (!open) {
      return undefined
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    const handlePointerDown = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('pointerdown', handlePointerDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('pointerdown', handlePointerDown)
    }
  }, [open])

  const handleToggle = () => {
    const next = !open

    setOpen(next)

    if (next) {
      refresh()
    }
  }

  const handleOpenNotification = async (notification) => {
    const target = notificationTarget(notification.payload)

    await markAsRead(notification)

    if (target) {
      setOpen(false)
      navigate(target)
    }
  }

  const empty = !loading && notifications.length === 0

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={handleToggle}
        title="Notificaciones"
        aria-label={
          unreadCount > 0 ? `Notificaciones, ${unreadCount} sin leer` : 'Notificaciones'
        }
        aria-haspopup="dialog"
        aria-expanded={open}
        className="relative inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
      >
        <IconBell className="h-4.5 w-4.5" />

        {unreadCount > 0 ? (
          <span
            aria-hidden="true"
            className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-indigo-600 px-1 text-[10px] font-semibold leading-none text-white ring-2 ring-white dark:bg-indigo-500 dark:ring-zinc-900"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label="Notificaciones"
          className="absolute right-0 z-50 mt-1 w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-xl bg-white text-sm shadow-lg ring-1 ring-slate-200 dark:bg-zinc-900 dark:ring-zinc-700"
        >
          <header className="flex items-start justify-between gap-3 border-b border-slate-200 px-4 py-3 dark:border-zinc-800">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
                Notificaciones
              </h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                {unreadCount > 0 ? `${unreadCount} sin leer` : 'Todo al día'}
              </p>
            </div>

            <button
              type="button"
              onClick={markAllAsRead}
              disabled={unreadCount === 0}
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-indigo-600 transition hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-50 dark:text-indigo-300 dark:hover:bg-indigo-500/10"
            >
              <IconCheck className="h-3.5 w-3.5" />
              Marcar todas como leídas
            </button>
          </header>

          {error ? (
            <p role="alert" className="border-b border-rose-100 bg-rose-50 px-4 py-2 text-xs text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">
              {error}
            </p>
          ) : null}

          {loading && notifications.length === 0 ? (
            <p className="flex items-center justify-center gap-2 px-4 py-8 text-sm text-slate-500 dark:text-zinc-400">
              <Spinner className="h-4 w-4" />
              Cargando notificaciones…
            </p>
          ) : null}

          {empty ? (
            <p className="px-4 py-8 text-center text-sm text-slate-500 dark:text-zinc-400">
              No tienes notificaciones.
            </p>
          ) : null}

          {notifications.length > 0 ? (
            <ul className="max-h-96 divide-y divide-slate-100 overflow-y-auto dark:divide-zinc-800">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onOpen={handleOpenNotification}
                />
              ))}
            </ul>
          ) : null}

          {hasMore ? (
            <div className="border-t border-slate-200 p-2 dark:border-zinc-800">
              <button
                type="button"
                onClick={loadMore}
                disabled={loadingMore}
                className="flex w-full items-center justify-center gap-2 rounded-lg px-2 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                {loadingMore ? <Spinner className="h-3.5 w-3.5" /> : null}
                Cargar más
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
