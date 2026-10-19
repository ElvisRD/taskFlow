import { useCallback, useEffect, useRef, useState } from 'react'
import { Alert } from '../../components/ui/Alert.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { Spinner } from '../../components/ui/Spinner.jsx'
import { IconDownload, IconPaperclip, IconTrash } from '../../components/icons.jsx'
import { api, apiErrorMessage, downloadFile } from '../../lib/api.js'
import { formatBytes, formatDateTime } from '../../lib/format.js'

export function AttachmentList({ taskId, currentUserId, isAdmin, onCountChange }) {
  const [attachments, setAttachments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [downloadingId, setDownloadingId] = useState(null)
  const inputRef = useRef(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const { data } = await api.get(`/tasks/${taskId}/attachments`)
      setAttachments(data.data ?? [])
    } catch (requestError) {
      setError(apiErrorMessage(requestError))
    } finally {
      setLoading(false)
    }
  }, [taskId])

  useEffect(() => {
    load()
  }, [load])

  const handleUpload = async (event) => {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    setUploading(true)
    setError('')

    const formData = new FormData()
    formData.append('file', file)

    try {
      const { data } = await api.post(`/tasks/${taskId}/attachments`, formData)
      setAttachments((previous) => [data.data, ...previous])
      onCountChange?.()
    } catch (requestError) {
      setError(apiErrorMessage(requestError))
    } finally {
      setUploading(false)

      if (inputRef.current) {
        inputRef.current.value = ''
      }
    }
  }

  const handleDownload = async (attachment) => {
    setDownloadingId(attachment.id)
    setError('')

    try {
      await downloadFile(`/attachments/${attachment.id}/download`, attachment.name)
    } catch (requestError) {
      setError(apiErrorMessage(requestError))
    } finally {
      setDownloadingId(null)
    }
  }

  const handleDelete = async (attachment) => {
    setError('')

    try {
      await api.delete(`/attachments/${attachment.id}`)
      setAttachments((previous) => previous.filter((item) => item.id !== attachment.id))
      onCountChange?.()
    } catch (requestError) {
      setError(apiErrorMessage(requestError))
    }
  }

  return (
    <div className="space-y-3">
      {error ? <Alert>{error}</Alert> : null}

      <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 px-3 py-3 text-sm text-slate-500 transition hover:border-indigo-300 hover:text-indigo-600">
        <IconPaperclip className="h-4 w-4" />
        {uploading ? 'Subiendo…' : 'Adjuntar archivo (máx. 10 MB)'}
        <input
          ref={inputRef}
          type="file"
          className="sr-only"
          onChange={handleUpload}
          disabled={uploading}
        />
      </label>

      {loading ? (
        <div className="flex justify-center py-4">
          <Spinner className="h-5 w-5 text-indigo-600" />
        </div>
      ) : attachments.length === 0 ? (
        <p className="text-sm text-slate-400">Sin archivos adjuntos.</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {attachments.map((attachment) => {
            const canDelete = attachment.uploader?.id === currentUserId || isAdmin

            return (
              <li key={attachment.id} className="flex items-center gap-3 py-2">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                  <IconPaperclip className="h-4 w-4" />
                </span>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-800">{attachment.name}</p>
                  <p className="text-xs text-slate-400">
                    {formatBytes(attachment.size)} · {formatDateTime(attachment.created_at)}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleDownload(attachment)}
                  disabled={downloadingId === attachment.id}
                  className="rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-indigo-600 disabled:opacity-50"
                  aria-label={`Descargar ${attachment.name}`}
                >
                  {downloadingId === attachment.id ? (
                    <Spinner className="h-4 w-4" />
                  ) : (
                    <IconDownload className="h-4 w-4" />
                  )}
                </button>

                {canDelete ? (
                  <button
                    type="button"
                    onClick={() => handleDelete(attachment)}
                    className="rounded-md p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                    aria-label={`Eliminar ${attachment.name}`}
                  >
                    <IconTrash className="h-4 w-4" />
                  </button>
                ) : null}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
