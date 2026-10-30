import { useCallback, useEffect, useState } from 'react'
import { Avatar } from '../../components/Avatar.jsx'
import { Badge } from '../../components/ui/Badge.jsx'
import { Alert } from '../../components/ui/Alert.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { Field } from '../../components/ui/Field.jsx'
import { Modal } from '../../components/ui/Modal.jsx'
import { Select } from '../../components/ui/Select.jsx'
import { Spinner } from '../../components/ui/Spinner.jsx'
import { api, apiErrorMessage, validationErrors } from '../../lib/api.js'
import { WORKSPACE_ROLES, roleLabel } from '../../lib/constants.js'

export function MembersPanel({ workspaceId, canManage, ownerId }) {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [memberToRemove, setMemberToRemove] = useState(null)
  const [reassignTo, setReassignTo] = useState('')
  const [removeError, setRemoveError] = useState('')
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
    setNotice('')

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

  const openRemoveDialog = (member) => {
    setMemberToRemove(member)
    setReassignTo('')
    setRemoveError('')
  }

  const closeRemoveDialog = () => {
    if (removing) {
      return
    }

    setMemberToRemove(null)
    setReassignTo('')
    setRemoveError('')
  }

  const handleRemove = async () => {
    if (!memberToRemove) {
      return
    }

    const replacement = reassignTo
      ? members.find((member) => String(member.id) === String(reassignTo))
      : null

    setRemoving(true)
    setError('')
    setNotice('')
    setRemoveError('')

    try {
      await api.delete(`/workspaces/${workspaceId}/members/${memberToRemove.id}`, {
        data: { reassign_to: replacement?.id ?? null },
      })

      setMembers((previous) => previous.filter((item) => item.id !== memberToRemove.id))
      setNotice(
        replacement
          ? `${memberToRemove.name} fue eliminado y sus tareas se reasignaron a ${replacement.name}.`
          : `${memberToRemove.name} fue eliminado. Sus tareas quedaron sin asignar.`,
      )
      setMemberToRemove(null)
      setReassignTo('')
      setRemoveError('')
    } catch (requestError) {
      setRemoveError(
        validationErrors(requestError).reassign_to ?? apiErrorMessage(requestError),
      )
    } finally {
      setRemoving(false)
    }
  }

  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 dark:bg-zinc-900 dark:ring-zinc-800">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-zinc-100">Miembros</h2>
          <p className="text-sm text-slate-500 dark:text-zinc-400">
            {members.length} personas en este workspace.
          </p>
        </div>
      </div>

      {error ? <Alert className="mb-4">{error}</Alert> : null}
      {notice ? (
        <Alert tone="success" className="mb-4">
          {notice}
        </Alert>
      ) : null}

      {loading ? (
        <div className="flex justify-center py-6">
          <Spinner className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
        </div>
      ) : (
        <ul className="max-h-96 divide-y divide-slate-100 overflow-y-auto overscroll-contain pr-1 dark:divide-zinc-800">
          {members.map((member) => {
            const isOwner = member.id === ownerId

            return (
              <li key={member.id} className="flex items-center gap-3 py-3">
                <Avatar name={member.name} src={member.avatar} size="md" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900 dark:text-zinc-100">
                    {member.name}
                  </p>
                  <p className="truncate text-xs text-slate-500 dark:text-zinc-400">
                    {member.email}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {canManage && !isOwner ? (
                    <>
                      <Select
                        value={member.role}
                        disabled={updatingId === member.id}
                        onChange={(event) => handleRoleChange(member, event.target.value)}
                        className="w-36 py-1.5 text-xs"
                      >
                        {WORKSPACE_ROLES.map((role) => (
                          <option key={role.value} value={role.value}>
                            {role.label}
                          </option>
                        ))}
                      </Select>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10"
                        onClick={() => openRemoveDialog(member)}
                      >
                        Quitar
                      </Button>
                    </>
                  ) : (
                    <div className="flex flex-col gap-1">
                      {isOwner ? (
                        <Badge className="flex justify-center bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/30">
                          Propietario
                        </Badge>
                      ) : null}
                      <Badge className="bg-slate-100 text-slate-600 ring-slate-200 dark:bg-zinc-800 dark:text-zinc-300 dark:ring-zinc-700">
                        {roleLabel(member.role)}
                      </Badge>
                    </div>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <RemoveMemberDialog
        open={memberToRemove !== null}
        member={memberToRemove}
        members={members}
        reassignTo={reassignTo}
        onReassignChange={setReassignTo}
        onClose={closeRemoveDialog}
        onConfirm={handleRemove}
        loading={removing}
        error={removeError}
      />
    </section>
  )
}

function RemoveMemberDialog({
  open,
  member,
  members,
  reassignTo,
  onReassignChange,
  onClose,
  onConfirm,
  loading,
  error,
}) {
  const replacementOptions = members.filter((item) => item.id !== member?.id)

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Quitar miembro"
      description={
        member
          ? `¿Seguro que quieres quitar a ${member.name} de este workspace?`
          : ''
      }
      size="sm"
    >
      <div className="space-y-4">
        <Alert tone="warning">
          Sus tareas asignadas en este workspace quedarán sin asignar o pasarán a la persona
          que elijas. También dejará de recibir notificaciones de este workspace.
        </Alert>

        {error ? <Alert>{error}</Alert> : null}

        <Field
          label="Reasignar tareas a"
          htmlFor="reassign-member"
          hint="Si no eliges a nadie, las tareas quedarán sin asignar."
        >
          <Select
            id="reassign-member"
            value={reassignTo}
            onChange={(event) => onReassignChange(event.target.value)}
            disabled={loading}
          >
            <option value="">Dejar las tareas sin asignar</option>
            {replacementOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name} ({roleLabel(option.role)})
              </option>
            ))}
          </Select>
        </Field>

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button type="button" variant="danger" onClick={onConfirm} loading={loading}>
            Quitar miembro
          </Button>
        </div>
      </div>
    </Modal>
  )
}
