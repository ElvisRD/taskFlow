import { useEffect, useState } from 'react'
import { Alert } from '../../components/ui/Alert.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog.jsx'
import { Field, inputClass } from '../../components/ui/Field.jsx'
import { Modal } from '../../components/ui/Modal.jsx'
import { api, apiErrorMessage, validationErrors } from '../../lib/api.js'
import { TASK_PRIORITIES } from '../../lib/constants.js'
import { AttachmentList } from './AttachmentList.jsx'
import { CommentThread } from './CommentThread.jsx'

export function TaskDialog({
  open,
  task,
  members = [],
  currentUserId,
  isAdmin,
  onClose,
  onUpdated,
  onDeleted,
  onCountsChanged,
}) {
  const [form, setForm] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [errors, setErrors] = useState({})
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (open && task) {
      setForm({
        title: task.title ?? '',
        description: task.description ?? '',
        priority: task.priority ?? 'medium',
        due_date: task.due_date ?? '',
        assigned_to: task.assignee?.id ?? '',
        completed: Boolean(task.is_completed),
      })
      setError('')
      setErrors({})
    }
  }, [open, task])

  if (!open || !task || !form) {
    return null
  }

  const canDelete = isAdmin || task.creator?.id === currentUserId

  const update = (field, value) => {
    setForm((previous) => ({ ...previous, [field]: value }))
  }

  const handleSubmit = async (event) => {
    event?.preventDefault()
    setSaving(true)
    setError('')
    setErrors({})

    try {
      const { data } = await api.patch(`/tasks/${task.id}`, {
        title: form.title.trim(),
        description: form.description.trim(),
        priority: form.priority,
        due_date: form.due_date || null,
        assigned_to: form.assigned_to === '' ? null : Number(form.assigned_to),
        completed: form.completed,
      })

      onUpdated(data.data)
    } catch (requestError) {
      setErrors(validationErrors(requestError))
      setError(apiErrorMessage(requestError))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)

    try {
      await api.delete(`/tasks/${task.id}`)
      onDeleted(task.id)
    } catch (requestError) {
      setError(apiErrorMessage(requestError))
      setDeleting(false)
      setDeleteOpen(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="xl"
      title="Detalle de la tarea"
      footer={
        <>
          {canDelete ? (
            <Button
              variant="ghost"
              className="mr-auto text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10"
              onClick={() => setDeleteOpen(true)}
              disabled={saving}
            >
              Eliminar tarea
            </Button>
          ) : null}
          <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>
            Cerrar
          </Button>
          <Button type="button" onClick={handleSubmit} loading={saving}>
            Guardar cambios
          </Button>
        </>
      }
    >
      {error && Object.keys(errors).length === 0 ? (
        <Alert className="mb-4">{error}</Alert>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Field label="Título" htmlFor="task-title" error={errors.title}>
            <input
              id="task-title"
              value={form.title}
              onChange={(event) => update('title', event.target.value)}
              className={inputClass}
            />
          </Field>

          <Field label="Descripción" htmlFor="task-description" error={errors.description}>
            <textarea
              id="task-description"
              rows={4}
              value={form.description}
              onChange={(event) => update('description', event.target.value)}
              className={inputClass}
              placeholder="Añade más contexto…"
            />
          </Field>

          <div className="rounded-xl bg-slate-50/70 p-4 ring-1 ring-slate-100 dark:bg-zinc-800/40 dark:ring-zinc-800">
            <h3 className="mb-3 text-sm font-semibold text-slate-700 dark:text-zinc-300">
              Comentarios
            </h3>
            <CommentThread
              taskId={task.id}
              currentUserId={currentUserId}
              isAdmin={isAdmin}
              onCountChange={onCountsChanged}
            />
          </div>
        </div>

        <div className="space-y-4">
          <Field label="Prioridad" htmlFor="task-priority" error={errors.priority}>
            <select
              id="task-priority"
              value={form.priority}
              onChange={(event) => update('priority', event.target.value)}
              className={inputClass}
            >
              {TASK_PRIORITIES.map((priority) => (
                <option key={priority.value} value={priority.value}>
                  {priority.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Fecha límite" htmlFor="task-due-date" error={errors.due_date}>
            <input
              id="task-due-date"
              type="date"
              value={form.due_date}
              onChange={(event) => update('due_date', event.target.value)}
              className={inputClass}
            />
          </Field>

          <Field label="Asignada a" htmlFor="task-assignee" error={errors.assigned_to}>
            <select
              id="task-assignee"
              value={form.assigned_to}
              onChange={(event) => update('assigned_to', event.target.value)}
              className={inputClass}
            >
              <option value="">Sin asignar</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
          </Field>

          <label className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700 ring-1 ring-slate-200 dark:bg-zinc-800/60 dark:text-zinc-300 dark:ring-zinc-700">
            <input
              type="checkbox"
              checked={form.completed}
              onChange={(event) => update('completed', event.target.checked)}
              className="checkbox"
            />
            Marcar como completada
          </label>

          <div>
            <h3 className="mb-2 text-sm font-semibold text-slate-700 dark:text-zinc-300">
              Adjuntos
            </h3>
            <AttachmentList
              taskId={task.id}
              currentUserId={currentUserId}
              isAdmin={isAdmin}
              onCountChange={onCountsChanged}
            />
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        title="Eliminar tarea"
        description={`¿Seguro que quieres eliminar "${task.title}"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        loading={deleting}
        onConfirm={handleDelete}
        onClose={() => setDeleteOpen(false)}
      />
    </Modal>
  )
}
