import { useCallback, useEffect, useState } from 'react'
import { Avatar } from '../../components/Avatar.jsx'
import { Alert } from '../../components/ui/Alert.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { inputClass } from '../../components/ui/Field.jsx'
import { Spinner } from '../../components/ui/Spinner.jsx'
import { api, apiErrorMessage } from '../../lib/api.js'
import { formatDateTime } from '../../lib/format.js'
import { TEXT_LIMITS, validateOptionalText } from '../../lib/validation.js'

const CARD_STYLES = {
  parent: 'bg-slate-50 ring-slate-100 dark:bg-zinc-800/60 dark:ring-zinc-800',
  reply: 'bg-white ring-slate-200 dark:bg-zinc-900/70 dark:ring-zinc-700',
}

const ACTION_CLASS = 'text-[11px] font-medium transition'

function CommentCard({
  comment,
  isReply = false,
  currentUserId,
  isAdmin,
  onDelete,
  onReply,
  children,
}) {
  const authorName = comment.author?.name ?? 'Usuario'
  const canDelete = comment.author?.id === currentUserId || isAdmin

  return (
    <div className="flex items-start gap-2.5">
      <Avatar
        name={comment.author?.name}
        src={comment.author?.avatar}
        size={isReply ? 'xs' : 'sm'}
      />
      <div className="min-w-0 flex-1">
        <div
          role="article"
          aria-label={`Comentario de ${authorName}`}
          className={`rounded-lg px-3 py-2 ring-1 ${
            isReply ? CARD_STYLES.reply : CARD_STYLES.parent
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-xs font-medium text-slate-700 dark:text-zinc-300">
              {authorName}
            </p>
            <span className="shrink-0 text-[11px] text-slate-500 dark:text-zinc-400">
              {formatDateTime(comment.created_at)}
            </span>
          </div>
          <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700 dark:text-zinc-300">
            {comment.body}
          </p>
          <div className="mt-1 flex items-center gap-3">
            {!isReply ? (
              <button
                type="button"
                onClick={onReply}
                className={`${ACTION_CLASS} text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300`}
              >
                Responder
              </button>
            ) : null}
            {canDelete ? (
              <button
                type="button"
                onClick={onDelete}
                className={`${ACTION_CLASS} text-rose-500 hover:text-rose-600 dark:text-rose-400 dark:hover:text-rose-300`}
              >
                Eliminar
              </button>
            ) : null}
          </div>
        </div>
        {children}
      </div>
    </div>
  )
}

export function CommentThread({ taskId, currentUserId, isAdmin, onCountChange }) {
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [body, setBody] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [replyingTo, setReplyingTo] = useState(null)
  const [replyBody, setReplyBody] = useState('')
  const [submittingReply, setSubmittingReply] = useState(false)
  const [expandedReplies, setExpandedReplies] = useState(() => new Set())
  const bodyError = validateOptionalText(body, 'El comentario', TEXT_LIMITS.commentBody)
  const replyError = validateOptionalText(
    replyBody,
    'La respuesta',
    TEXT_LIMITS.commentBody,
  )

  const load = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const { data } = await api.get(`/tasks/${taskId}/comments`)
      setComments(data.data ?? [])
    } catch (requestError) {
      setError(apiErrorMessage(requestError))
    } finally {
      setLoading(false)
    }
  }, [taskId])

  useEffect(() => {
    setReplyingTo(null)
    setReplyBody('')
    setExpandedReplies(new Set())
    load()
  }, [load])

  const handleSubmit = async (event) => {
    event.preventDefault()
    const trimmed = body.trim()

    if (!trimmed || bodyError) {
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const { data } = await api.post(`/tasks/${taskId}/comments`, { body: trimmed })
      setComments((previous) => [
        { ...data.data, replies: data.data.replies ?? [] },
        ...previous,
      ])
      setBody('')
      onCountChange?.()
    } catch (requestError) {
      setError(apiErrorMessage(requestError))
    } finally {
      setSubmitting(false)
    }
  }

  const handleReply = async (event, parentId) => {
    event.preventDefault()
    const trimmed = replyBody.trim()

    if (!trimmed || replyError) {
      return
    }

    setSubmittingReply(true)
    setError('')

    try {
      const { data } = await api.post(`/tasks/${taskId}/comments`, {
        body: trimmed,
        parent_id: parentId,
      })

      setComments((previous) =>
        previous.map((comment) =>
          comment.id === parentId
            ? { ...comment, replies: [...(comment.replies ?? []), data.data] }
            : comment,
        ),
      )
      setExpandedReplies((previous) => {
        const next = new Set(previous)
        next.add(parentId)
        return next
      })
      setReplyingTo(null)
      setReplyBody('')
      onCountChange?.()
    } catch (requestError) {
      setError(apiErrorMessage(requestError))
    } finally {
      setSubmittingReply(false)
    }
  }

  const handleDelete = async (comment, parentId = null) => {
    setError('')

    try {
      await api.delete(`/comments/${comment.id}`)
      setComments((previous) =>
        parentId === null
          ? previous.filter((item) => item.id !== comment.id)
          : previous.map((item) =>
              item.id === parentId
                ? {
                    ...item,
                    replies: (item.replies ?? []).filter((reply) => reply.id !== comment.id),
                  }
                : item,
            ),
      )
      if (replyingTo === comment.id) {
        setReplyingTo(null)
        setReplyBody('')
      }
      onCountChange?.()
    } catch (requestError) {
      setError(apiErrorMessage(requestError))
    }
  }

  const toggleReplies = (commentId) => {
    setExpandedReplies((previous) => {
      const next = new Set(previous)

      if (next.has(commentId)) {
        next.delete(commentId)
      } else {
        next.add(commentId)
      }

      return next
    })
  }

  const cancelReply = () => {
    setReplyingTo(null)
    setReplyBody('')
  }

  const startReply = (commentId) => {
    if (replyingTo !== commentId) {
      setReplyBody('')
    }

    setError('')
    setReplyingTo(commentId)
  }

  return (
    <div className="space-y-3">
      {error ? <Alert>{error}</Alert> : null}

      <form onSubmit={handleSubmit} className="space-y-1.5">
        <div className="flex items-start gap-2">
          <textarea
            rows={2}
            value={body}
            aria-invalid={bodyError ? 'true' : undefined}
            onChange={(event) => setBody(event.target.value)}
            placeholder="Escribe un comentario…"
            className={`${inputClass} resize-none`}
          />
          <Button
            type="submit"
            size="sm"
            loading={submitting}
            disabled={!body.trim() || Boolean(bodyError)}
          >
            Enviar
          </Button>
        </div>
        {bodyError ? (
          <p className="text-xs text-rose-600 dark:text-rose-400">{bodyError}</p>
        ) : null}
      </form>

      {loading ? (
        <div className="flex justify-center py-4">
          <Spinner className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
        </div>
      ) : comments.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-zinc-400">Todavía no hay comentarios.</p>
      ) : (
        <ul className="scrollbar-thin max-h-64 space-y-3 overflow-y-auto pr-1">
          {comments.map((comment) => {
            const replies = comment.replies ?? []
            const expanded = expandedReplies.has(comment.id)
            const replyFormOpen = replyingTo === comment.id

            return (
              <li key={comment.id}>
                <CommentCard
                  comment={comment}
                  currentUserId={currentUserId}
                  isAdmin={isAdmin}
                  onDelete={() => handleDelete(comment)}
                  onReply={() => startReply(comment.id)}
                >
                  {replyFormOpen ? (
                    <form
                      aria-label={`Responder a ${comment.author?.name ?? 'Usuario'}`}
                      onSubmit={(event) => handleReply(event, comment.id)}
                      className="mt-2 space-y-2"
                    >
                      <textarea
                        rows={2}
                        autoFocus
                        value={replyBody}
                        aria-invalid={replyError ? 'true' : undefined}
                        onChange={(event) => setReplyBody(event.target.value)}
                        placeholder="Escribe una respuesta…"
                        className={`${inputClass} resize-none`}
                      />
                      {replyError ? (
                        <p className="text-xs text-rose-600 dark:text-rose-400">
                          {replyError}
                        </p>
                      ) : null}
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={cancelReply}
                          disabled={submittingReply}
                        >
                          Cancelar
                        </Button>
                        <Button
                          type="submit"
                          size="sm"
                          loading={submittingReply}
                          disabled={!replyBody.trim() || Boolean(replyError)}
                        >
                          Enviar respuesta
                        </Button>
                      </div>
                    </form>
                  ) : null}

                  {replies.length > 0 ? (
                    <>
                      {replies.length === 1 || expanded ? (
                        <ul className="mt-2 space-y-2 border-l-2 border-slate-200 pl-2.5 dark:border-zinc-700">
                          {replies.map((reply) => (
                            <li key={reply.id}>
                              <CommentCard
                                comment={reply}
                                isReply
                                currentUserId={currentUserId}
                                isAdmin={isAdmin}
                                onDelete={() => handleDelete(reply, comment.id)}
                              />
                            </li>
                          ))}
                        </ul>
                      ) : null}

                      {replies.length > 1 ? (
                        <button
                          type="button"
                          aria-expanded={expanded}
                          onClick={() => toggleReplies(comment.id)}
                          className="mt-1 text-[11px] font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
                        >
                          {expanded ? 'Ocultar respuestas' : 'Ver respuestas'}
                        </button>
                      ) : null}
                    </>
                  ) : null}
                </CommentCard>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
