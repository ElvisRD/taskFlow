import { useCallback, useEffect, useState } from 'react'
import { Avatar } from '../../components/Avatar.jsx'
import { Badge } from '../../components/ui/Badge.jsx'
import { Alert } from '../../components/ui/Alert.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog.jsx'
import { Field, inputClass } from '../../components/ui/Field.jsx'
import { Modal } from '../../components/ui/Modal.jsx'
import { Spinner } from '../../components/ui/Spinner.jsx'
import { api, apiErrorMessage, validationErrors } from '../../lib/api.js'
import { WORKSPACE_ROLES, roleLabel } from '../../lib/constants.js'
import { formatDate } from '../../lib/format.js'

export function MembersPanel({ workspaceId, canManage, ownerId }) {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [memberToRemove, setMemberToRemove] = useState(null)
  const [removing, setRemoving] = useState(false)
  const [updatingId, setUpdatingId] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const { data } = await api.get(`/workspaces/${workspaceId}/members`)
      setMembers(data.data ?? [])
    } catch (requestError) {
      setError(apiErrorMessage(requestError))
    } finally {
      setLoading(false)
    }
  }, [workspaceId])

  useEffect(() => {
    load()
  }, [load])

  const handleRoleChange = async (member, role) => {
    setUpdatingId(member.id)
    setError('')

    try {
      const { data } = await api.patch(`/workspaces/${workspaceId}/members/${member.id}`, { role })
      setMembers((previous) =>
        previous.map((item) => (item.id === member.id ? data.data : item)),
      )
    } catch (requestError) {
      setError(apiErrorMessage(requestError))
    } finally {
      setUpdatingId(null)
    }
  }

  const handleRemove = async () => {
    if (!memberToRemove) {
      return
    }

    setRemoving(true)
    setError('')

    try {
      await api.delete(`/workspaces/${workspaceId}/members/${memberToRemove.id}`)
      setMembers((previous) => previous.filter((item) => item.id !== memberToRemove.id))
      setMemberToRemove(null)
    } catch (requestError) {
      setError(apiErrorMessage(requestError))
    } finally {
      setRemoving(false)
    }
  }

  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Miembros</h2>
          <p className="text-sm text-slate-500">{members.length} personas en este workspace.</p>
        </div>
        {canManage ? (
          <Button variant="secondary" size="sm" onClick={() => setAddOpen(true)}>
            Añadir miembro
          </Button>
        ) : null}
      </div>

      {error ? <Alert className="mb-4">{error}</Alert> : null}

      {loading ? (
        <div className="flex justify-center py-6">
          <Spinner className="h-6 w-6 text-indigo-600" />
        </div>
      ) : (
        <ul className="divide-y divide-slate-100">
          {members.map((member) => {
            const isOwner = member.id === ownerId

            return (
              <li key={member.id} className="flex items-center gap-3 py-3">
                <Avatar name={member.name} src={member.avatar} size="md" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900">
                    {member.name}
                    {isOwner ? (
                      <Badge className="ml-2 bg-amber-50 text-amber-700 ring-amber-200">
                        Propietario
                      </Badge>
                    ) : null}
                  </p>
                  <p className="truncate text-xs text-slate-500">{member.email}</p>
                </div>

                <div className="flex items-center gap-2">
                  {canManage && !isOwner ? (
                    <>
                      <select
                        value={member.role}
                        disabled={updatingId === member.id}
                        onChange={(event) => handleRoleChange(member, event.target.value)}
                        className={`${inputClass} w-36 py-1.5 text-xs`}
                      >
                        {WORKSPACE_ROLES.map((role) => (
                          <option key={role.value} value={role.value}>
                            {role.label}
                          </option>
                        ))}
                      </select>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-rose-600 hover:bg-rose-50"
                        onClick={() => setMemberToRemove(member)}
                      >
                        Quitar
                      </Button>
                    </>
                  ) : (
                    <Badge className="bg-slate-100 text-slate-600 ring-slate-200">
                      {roleLabel(member.role)}
                    </Badge>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <AddMemberDialog
        open={addOpen}
        workspaceId={workspaceId}
        onClose={() => setAddOpen(false)}
        onAdded={(member) => {
          setMembers((previous) => [...previous, member])
          setAddOpen(false)
        }}
      />

      <ConfirmDialog
        open={memberToRemove !== null}
        title="Quitar miembro"
        description={
          memberToRemove
            ? `¿Seguro que quieres quitar a ${memberToRemove.name} de este workspace?`
            : ''
        }
        confirmLabel="Quitar"
        loading={removing}
        onConfirm={handleRemove}
        onClose={() => setMemberToRemove(null)}
      />
    </section>
  )
}

function AddMemberDialog({ open, workspaceId, onClose, onAdded }) {
  const [form, setForm] = useState({ email: '', role: 'member' })
  const [errors, setErrors] = useState({})
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      setForm({ email: '', role: 'member' })
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
      const { data } = await api.post(`/workspaces/${workspaceId}/members`, form)
      onAdded(data.data)
    } catch (error) {
      setErrors(validationErrors(error))
      setMessage(apiErrorMessage(error))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Añadir miembro"
      description="El usuario debe estar registrado en TaskFlow."
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {message && !errors.email && !errors.role ? <Alert>{message}</Alert> : null}

        <Field label="Correo electrónico" htmlFor="member-email" error={errors.email}>
          <input
            id="member-email"
            type="email"
            autoFocus
            value={form.email}
            onChange={(event) => setForm((previous) => ({ ...previous, email: event.target.value }))}
            className={inputClass}
            placeholder="persona@correo.com"
          />
        </Field>

        <Field label="Rol" htmlFor="member-role" error={errors.role}>
          <select
            id="member-role"
            value={form.role}
            onChange={(event) => setForm((previous) => ({ ...previous, role: event.target.value }))}
            className={inputClass}
          >
            {WORKSPACE_ROLES.map((role) => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </select>
        </Field>

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button type="submit" loading={submitting}>
            Añadir
          </Button>
        </div>
      </form>
    </Modal>
  )
}
