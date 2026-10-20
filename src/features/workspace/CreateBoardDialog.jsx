import { useEffect, useState } from 'react'
import { Alert } from '../../components/ui/Alert.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { Field, inputClass } from '../../components/ui/Field.jsx'
import { Modal } from '../../components/ui/Modal.jsx'
import { api, apiErrorMessage, validationErrors } from '../../lib/api.js'
import { BOARD_COLORS } from '../../lib/constants.js'
import {
  TEXT_LIMITS,
  validateOptionalText,
  validateRequiredText,
} from '../../lib/validation.js'

function validateBoardForm(form) {
  const errors = {}
  const nameError = validateRequiredText(form.name, 'El nombre', TEXT_LIMITS.boardName)
  const descriptionError = validateOptionalText(
    form.description,
    'La descripción',
    TEXT_LIMITS.boardDescription,
  )

  if (nameError) {
    errors.name = nameError
  }

  if (descriptionError) {
    errors.description = descriptionError
  }

  return errors
}

export function CreateBoardDialog({ open, workspaceId, onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', description: '', color: BOARD_COLORS[0].value })
  const [serverErrors, setServerErrors] = useState({})
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showValidation, setShowValidation] = useState(false)
  const [touched, setTouched] = useState({})

  useEffect(() => {
    if (open) {
      setForm({ name: '', description: '', color: BOARD_COLORS[0].value })
      setServerErrors({})
      setMessage('')
      setShowValidation(false)
      setTouched({})
    }
  }, [open])

  const clientErrors = validateBoardForm(form)
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

  if (serverErrors.color) {
    errors.color = serverErrors.color
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
      const { data } = await api.post(`/workspaces/${workspaceId}/boards`, {
        ...form,
        name: form.name.trim(),
        description: form.description.trim(),
      })
      onCreated(data.data)
    } catch (error) {
      setServerErrors(validationErrors(error))
      setMessage(apiErrorMessage(error))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Nuevo tablero">
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {message && !errors.name && !errors.description && !errors.color ? (
          <Alert>{message}</Alert>
        ) : null}

        <Field label="Nombre" htmlFor="board-name" error={errors.name}>
          <input
            id="board-name"
            autoFocus
            value={form.name}
            maxLength={TEXT_LIMITS.boardName}
            aria-invalid={errors.name ? 'true' : undefined}
            onChange={(event) => update('name', event.target.value)}
            className={inputClass}
            placeholder="Sprint 2"
          />
        </Field>

        <Field label="Descripción" htmlFor="board-description" error={errors.description}>
          <textarea
            id="board-description"
            rows={3}
            value={form.description}
            maxLength={TEXT_LIMITS.boardDescription}
            aria-invalid={errors.description ? 'true' : undefined}
            onChange={(event) => update('description', event.target.value)}
            className={inputClass}
            placeholder="Objetivo del tablero"
          />
        </Field>

        <Field label="Color" error={errors.color}>
          <div className="flex flex-wrap gap-2">
            {BOARD_COLORS.map((color) => (
              <button
                key={color.value}
                type="button"
                title={color.label}
                onClick={() => update('color', color.value)}
                className={`h-8 w-8 rounded-full ring-2 ring-offset-2 transition dark:ring-offset-zinc-900 ${
                  form.color === color.value ? 'ring-slate-900 dark:ring-zinc-100' : 'ring-transparent'
                }`}
                style={{ backgroundColor: color.value }}
              />
            ))}
          </div>
        </Field>

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button type="submit" loading={submitting}>
            Crear tablero
          </Button>
        </div>
      </form>
    </Modal>
  )
}
