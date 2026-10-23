import {
  IconBell,
  IconCalendar,
  IconChat,
  IconUser,
} from '../../components/icons.jsx'
import { formatDate } from '../../lib/format.js'

const TYPES = {
  task_assigned: {
    Icon: IconUser,
    title: 'Te asignaron una tarea',
    tone: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300',
    body: ({ actor, title }) => `${actor ?? 'Alguien'} te asignó “${title ?? 'una tarea'}”.`,
  },
  comment_added: {
    Icon: IconChat,
    title: 'Nuevo comentario',
    tone: 'bg-sky-50 text-sky-600 dark:bg-sky-500/15 dark:text-sky-300',
    body: ({ actor, title }) => `${actor ?? 'Alguien'} comentó en “${title ?? 'una tarea'}”.`,
    detail: ({ excerpt }) => excerpt,
  },
  comment_reply: {
    Icon: IconChat,
    title: 'Respondieron tu comentario',
    tone: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300',
    body: ({ actor, title }) =>
      `${actor ?? 'Alguien'} respondió a tu comentario en “${title ?? 'una tarea'}”.`,
    detail: ({ excerpt }) => excerpt,
  },
  task_due_soon: {
    Icon: IconCalendar,
    title: 'Tarea por vencer',
    tone: 'bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300',
    body: ({ title, due_date: dueDate }) =>
      `“${title ?? 'Una tarea'}” vence el ${formatDate(dueDate) ?? 'pronto'}.`,
  },
  task_overdue: {
    Icon: IconCalendar,
    title: 'Tarea vencida',
    tone: 'bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300',
    body: ({ title, due_date: dueDate }) =>
      `“${title ?? 'Una tarea'}” venció el ${formatDate(dueDate) ?? 'recientemente'}.`,
  },
}

const FALLBACK = {
  Icon: IconBell,
  title: 'Notificación',
  tone: 'bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-300',
  body: () => 'Tienes una nueva notificación.',
}

const PREFERENCE_DESCRIPTIONS = {
  task_assigned: 'Cuando te asignan una tarea.',
  comment_added: 'Cuando alguien comenta en una tarea.',
  comment_reply: 'Cuando responden a uno de tus comentarios.',
  task_due_soon: 'Cuando una tarea se acerca a su fecha de vencimiento.',
  task_overdue: 'Cuando una tarea supera su fecha de vencimiento.',
}

/** Resolves the icon, tone and description used in notification settings. */
export function notificationPreferenceMeta(type) {
  const meta = TYPES[type] ?? FALLBACK

  return {
    Icon: meta.Icon,
    tone: meta.tone,
    description: PREFERENCE_DESCRIPTIONS[type] ?? '',
  }
}

/** Resolves the copy, icon and colors for a notification payload. */
export function notificationContent(payload = {}) {
  const meta = TYPES[payload.type] ?? FALLBACK

  return {
    Icon: meta.Icon,
    tone: meta.tone,
    title: meta.title,
    body: meta.body(payload),
    detail: meta.detail?.(payload) || '',
  }
}

/** Returns the web route that opens the task, or null when it cannot be resolved. */
export function notificationTarget(payload = {}) {
  const { workspace_id: workspaceId, board_id: boardId, task_id: taskId } = payload

  if (!workspaceId || !boardId || !taskId) {
    return null
  }

  return `/workspaces/${workspaceId}/boards/${boardId}?task=${taskId}`
}
