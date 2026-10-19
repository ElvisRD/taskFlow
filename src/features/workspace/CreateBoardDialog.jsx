import { useEffect, useState } from 'react'
import { Alert } from '../../components/ui/Alert.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { Field, inputClass } from '../../components/ui/Field.jsx'
import { Modal } from '../../components/ui/Modal.jsx'
import { api, apiErrorMessage, validationErrors } from '../../lib/api.js'
import { BOARD_COLORS } from '../../lib/constants.js'

export function CreateBoardDialog({ open, workspaceId, onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', description: '', color: BOARD_COLORS[0].value })
  const [errors, setErrors] = useState({})
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      setForm({ name: '', description: '', color: BOARD_COLORS[0].value })
      setErrors({})
      setMessage('')
    }
  }, [open])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setErrors({})
    setMessage('')

    try {
      const { data } = await api.post(`/workspaces/${workspaceId}/boards`, form)
      onCreated(data.data)
    } catch (error) {
      setErrors(validationErrors(error))
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
            onChange={(event) => setForm((previous) => ({ ...previous, name: event.target.value }))}
            className={inputClass}
            placeholder="Sprint 2"
          />
        </Field>

        <Field label="Descripción" htmlFor="board-description" error={errors.description}>
          <textarea
            id="board-description"
            rows={3}
            value={form.description}
            onChange={(event) =>
              setForm((previous) => ({ ...previous, description: event.target.value }))
            }
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
                onClick={() => setForm((previous) => ({ ...previous, color: color.value }))}
                className={`h-8 w-8 rounded-full ring-2 ring-offset-2 transition ${
                  form.color === color.value ? 'ring-slate-900' : 'ring-transparent'
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
