import { useEffect, useState } from 'react'
import { Alert } from '../../components/ui/Alert.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { Field, inputClass } from '../../components/ui/Field.jsx'
import { Modal } from '../../components/ui/Modal.jsx'
import { api, apiErrorMessage, validationErrors } from '../../lib/api.js'

export function EditWorkspaceDialog({ open, workspace, onClose, onUpdated }) {
  const [form, setForm] = useState({ name: '', description: '' })
  const [errors, setErrors] = useState({})
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open && workspace) {
      setForm({ name: workspace.name ?? '', description: workspace.description ?? '' })
      setErrors({})
      setMessage('')
    }
  }, [open, workspace])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setErrors({})
    setMessage('')

    try {
      const { data } = await api.patch(`/workspaces/${workspace.id}`, form)
      onUpdated(data.data)
    } catch (error) {
      setErrors(validationErrors(error))
      setMessage(apiErrorMessage(error))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Editar workspace">
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {message && !errors.name && !errors.description ? <Alert>{message}</Alert> : null}

        <Field label="Nombre" htmlFor="edit-workspace-name" error={errors.name}>
          <input
            id="edit-workspace-name"
            autoFocus
            value={form.name}
            onChange={(event) => setForm((previous) => ({ ...previous, name: event.target.value }))}
            className={inputClass}
          />
        </Field>

        <Field label="Descripción" htmlFor="edit-workspace-description" error={errors.description}>
          <textarea
            id="edit-workspace-description"
            rows={3}
            value={form.description}
            onChange={(event) =>
              setForm((previous) => ({ ...previous, description: event.target.value }))
            }
            className={inputClass}
          />
        </Field>

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button type="submit" loading={submitting}>
            Guardar cambios
          </Button>
        </div>
      </form>
    </Modal>
  )
}
