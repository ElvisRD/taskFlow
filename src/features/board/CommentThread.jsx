import { useCallback, useEffect, useState } from 'react'
import { Avatar } from '../../components/Avatar.jsx'
import { Alert } from '../../components/ui/Alert.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { inputClass } from '../../components/ui/Field.jsx'
import { Spinner } from '../../components/ui/Spinner.jsx'
import { api, apiErrorMessage } from '../../lib/api.js'
import { formatDateTime } from '../../lib/format.js'

export function CommentThread({ taskId, currentUserId, isAdmin, onCountChange }) {
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [body, setBody] = useState('')
  const [submitting, setSubmitting] = useState(false)

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
    load()
  }, [load])

  const handleSubmit = async (event) => {
    event.preventDefault()
    const trimmed = body.trim()

    if (!trimmed) {
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const { data } = await api.post(`/tasks/${taskId}/comments`, { body: trimmed })
      setComments((previous) => [data.data, ...previous])
      setBody('')
      onCountChange?.()
    } catch (requestError) {
      setError(apiErrorMessage(requestError))
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (comment) => {
    setError('')

    try {
      await api.delete(`/comments/${comment.id}`)
      setComments((previous) => previous.filter((item) => item.id !== comment.id))
      onCountChange?.()
    } catch (requestError) {
      setError(apiErrorMessage(requestError))
    }
  }

  return (
    <div className="space-y-3">
      {error ? <Alert>{error}</Alert> : null}

      <form onSubmit={handleSubmit} className="flex items-start gap-2">
        <textarea
          rows={2}
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder="Escribe un comentario…"
          className={`${inputClass} resize-none`}
        />
        <Button type="submit" size="sm" loading={submitting} disabled={!body.trim()}>
          Enviar
        </Button>
      </form>

      {loading ? (
        <div className="flex justify-center py-4">
          <Spinner className="h-5 w-5 text-indigo-600" />
        </div>
      ) : comments.length === 0 ? (
        <p className="text-sm text-slate-400">Todavía no hay comentarios.</p>
      ) : (
        <ul className="scrollbar-thin max-h-64 space-y-3 overflow-y-auto pr-1">
          {comments.map((comment) => {
            const canDelete = comment.author?.id === currentUserId || isAdmin

            return (
              <li key={comment.id} className="flex items-start gap-2.5">
                <Avatar name={comment.author?.name} src={comment.author?.avatar} size="sm" />
                <div className="min-w-0 flex-1 rounded-lg bg-slate-50 px-3 py-2 ring-1 ring-slate-100">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-xs font-medium text-slate-700">
                      {comment.author?.name ?? 'Usuario'}
                    </p>
                    <span className="shrink-0 text-[11px] text-slate-400">
                      {formatDateTime(comment.created_at)}
                    </span>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{comment.body}</p>
                  {canDelete ? (
                    <button
                      type="button"
                      onClick={() => handleDelete(comment)}
                      className="mt-1 text-[11px] font-medium text-rose-500 hover:text-rose-600"
                    >
                      Eliminar
                    </button>
                  ) : null}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
