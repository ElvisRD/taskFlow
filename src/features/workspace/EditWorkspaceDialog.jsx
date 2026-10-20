import { useEffect, useState } from 'react'
import { Alert } from '../../components/ui/Alert.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { Field, inputClass } from '../../components/ui/Field.jsx'
import { Modal } from '../../components/ui/Modal.jsx'
import { api, apiErrorMessage, validationErrors } from '../../lib/api.js'
import { TEXT_LIMITS, validateWorkspaceForm } from '../../lib/validation.js'

export function EditWorkspaceDialog({ open, workspace, onClose, onUpdated }) {
  const [form, setForm] = useState({ name: '', description: '' })
  const [serverErrors, setServerErrors] = useState({})
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showValidation, setShowValidation] = useState(false)
  const [touched, setTouched] = useState({})

  useEffect(() => {
    if (open && workspace) {
      setForm({ name: workspace.name ?? '', description: workspace.description ?? '' })
      setServerErrors({})
      setMessage('')
      setShowValidation(false)
      setTouched({})
    }
  }, [open, workspace])

  const clientErrors = validateWorkspaceForm(form)
  const errors = {}

  if ((showValidation || touched.name) && clientErrors.name) {
    errors.name = clientErrors.name
  } else if (serverErrors.name) {
    errors.name = serverErrors.name
  }

  if ((showValidation || touched.description) && clientErrors.description) {
    errors.description = clientErrors.description
  } else if (serverErrors.description) {
    errors.description = serverErrors.description
  }

  const update = (field, value) => {
    setForm((previous) => ({ ...previous, [field]: value }))
    setTouched((previous) => ({ ...previous, [field]: true }))
    setServerErrors((previous) => {
      if (!previous[field]) {
        return previous
      }

      const next = { ...previous }
      delete next[field]
      return next
    })
    setMessage('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setShowValidation(true)
    setMessage('')
    setServerErrors({})

    if (Object.keys(clientErrors).length > 0) {
      return
    }

    setSubmitting(true)

    try {
      const { data } = await api.patch(`/workspaces/${workspace.id}`, {
        name: form.name.trim(),
        description: form.description.trim(),
      })
      onUpdated(data.data)
    } catch (error) {
      setServerErrors(validationErrors(error))
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
            maxLength={TEXT_LIMITS.workspaceName}
            aria-invalid={errors.name ? 'true' : undefined}
            onChange={(event) => update('name', event.target.value)}
            className={inputClass}
          />
        </Field>

        <Field label="Descripción" htmlFor="edit-workspace-description" error={errors.description}>
          <textarea
            id="edit-workspace-description"
            rows={3}
            value={form.description}
            maxLength={TEXT_LIMITS.workspaceDescription}
            aria-invalid={errors.description ? 'true' : undefined}
            onChange={(event) => update('description', event.target.value)}
            className={`${inputClass} resize-none`}
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
