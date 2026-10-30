import { useCallback, useEffect, useState } from 'react'
import { Alert } from '../../components/ui/Alert.jsx'
import { Badge } from '../../components/ui/Badge.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog.jsx'
import { Field, inputClass } from '../../components/ui/Field.jsx'
import { Modal } from '../../components/ui/Modal.jsx'
import { Select } from '../../components/ui/Select.jsx'
import { Spinner } from '../../components/ui/Spinner.jsx'
import { api, apiErrorMessage, validationErrors } from '../../lib/api.js'
import { WORKSPACE_ROLES, roleLabel } from '../../lib/constants.js'
import { formatDateTime } from '../../lib/format.js'

const VISIBLE_STATUSES = ['pending', 'expired']

const STATUS_BADGES = {
  pending:
    'bg-sky-50 text-sky-700 ring-sky-200 dark:bg-sky-500/10 dark:text-sky-300 dark:ring-sky-500/30',
  expired:
    'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/30',
}

export function InvitationsPanel({ workspaceId }) {
  const [invitations, setInvitations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [inviteOpen, setInviteOpen] = useState(false)
  const [resendingId, setResendingId] = useState(null)
  const [invitationToRevoke, setInvitationToRevoke] = useState(null)
  const [revoking, setRevoking] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const { data } = await api.get(`/workspaces/${workspaceId}/invitations`)
      setInvitations(data.data ?? [])
    } catch (requestError) {
      setError(apiErrorMessage(requestError))
    } finally {
      setLoading(false)
    }
  }, [workspaceId])

  useEffect(() => {
    load()
  }, [load])

  const handleResend = async (invitation) => {
    setResendingId(invitation.id)
    setError('')
    setNotice('')

    try {
      const { data } = await api.post(
        `/workspaces/${workspaceId}/invitations/${invitation.id}/resend`,
      )

      setInvitations((previous) =>
        previous.map((item) => (item.id === invitation.id ? data.data : item)),
      )
      setNotice(`Invitación reenviada a ${invitation.email}.`)
    } catch (requestError) {
      setError(apiErrorMessage(requestError))
    } finally {
      setResendingId(null)
    }
  }

  const handleRevoke = async () => {
    if (!invitationToRevoke) {
      return
    }

    setRevoking(true)
    setError('')
    setNotice('')

    try {
      await api.delete(`/workspaces/${workspaceId}/invitations/${invitationToRevoke.id}`)

      setInvitations((previous) =>
        previous.filter((item) => item.id !== invitationToRevoke.id),
      )
      setNotice(`Invitación de ${invitationToRevoke.email} revocada.`)
      setInvitationToRevoke(null)
    } catch (requestError) {
      setError(apiErrorMessage(requestError))
    } finally {
      setRevoking(false)
    }
  }

  const visibleInvitations = invitations.filter((invitation) =>
    VISIBLE_STATUSES.includes(invitation.status),
  )

  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 dark:bg-zinc-900 dark:ring-zinc-800">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-zinc-100">
            Invitaciones
          </h2>
          <p className="text-sm text-slate-500 dark:text-zinc-400">
            {visibleInvitations.length} invitaciones pendientes o expiradas.
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => setInviteOpen(true)}>
          Invitar
        </Button>
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
      ) : visibleInvitations.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 px-4 py-8 text-center dark:border-zinc-700">
          <p className="text-sm font-medium text-slate-700 dark:text-zinc-300">
            No hay invitaciones pendientes
          </p>
          <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">
            Invita a alguien por correo para que se una a este workspace.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-slate-100 dark:divide-zinc-800">
          {visibleInvitations.map((invitation) => (
            <li key={invitation.id} className="flex flex-col gap-3 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-900 dark:text-zinc-100">
                  {invitation.email}
                </p>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-zinc-400">
                  {invitation.status === 'expired'
                    ? 'Expiró el '
                    : 'Vence el '}
                  {formatDateTime(invitation.expires_at)}
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap gap-1.5">
                  <Badge className="bg-slate-100 text-slate-600 ring-slate-200 dark:bg-zinc-800 dark:text-zinc-300 dark:ring-zinc-700">
                    {roleLabel(invitation.role)}
                  </Badge>
                  <Badge className={STATUS_BADGES[invitation.status]}>
                    {invitation.status === 'expired' ? 'Expirada' : 'Pendiente'}
                  </Badge>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    loading={resendingId === invitation.id}
                    disabled={resendingId !== null && resendingId !== invitation.id}
                    onClick={() => handleResend(invitation)}
                  >
                    Reenviar
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10"
                    disabled={resendingId !== null}
                    onClick={() => setInvitationToRevoke(invitation)}
                  >
                    Revocar
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <InviteDialog
        open={inviteOpen}
        workspaceId={workspaceId}
        onClose={() => setInviteOpen(false)}
        onInvited={(invitation) => {
          setInvitations((previous) => [invitation, ...previous])
          setNotice(`Invitación enviada a ${invitation.email}.`)
          setInviteOpen(false)
        }}
      />

      <ConfirmDialog
        open={invitationToRevoke !== null}
        title="Revocar invitación"
        description={
          invitationToRevoke
            ? `El enlace enviado a ${invitationToRevoke.email} dejará de funcionar y la invitación quedará revocada.`
            : ''
        }
        confirmLabel="Revocar"
        loading={revoking}
        onConfirm={handleRevoke}
        onClose={() => setInvitationToRevoke(null)}
      />
    </section>
  )
}

function InviteDialog({ open, workspaceId, onClose, onInvited }) {
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
      const { data } = await api.post(`/workspaces/${workspaceId}/invitations`, form)
      onInvited(data.data)
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
      title="Invitar al workspace"
      description="Enviaremos un correo con un enlace de invitación personal."
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {message && !errors.email && !errors.role ? <Alert>{message}</Alert> : null}

        <Field label="Correo electrónico" htmlFor="invitation-email" error={errors.email}>
          <input
            id="invitation-email"
            type="email"
            autoFocus
            value={form.email}
            onChange={(event) => setForm((previous) => ({ ...previous, email: event.target.value }))}
            className={inputClass}
            placeholder="persona@correo.com"
          />
        </Field>

        <Field
          label="Rol"
          htmlFor="invitation-role"
          error={errors.role}
          hint="La persona podrá aceptar la invitación únicamente con este correo."
        >
          <Select
            id="invitation-role"
            value={form.role}
            onChange={(event) => setForm((previous) => ({ ...previous, role: event.target.value }))}
          >
            {WORKSPACE_ROLES.map((role) => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </Select>
        </Field>

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button type="submit" loading={submitting}>
            Enviar invitación
          </Button>
        </div>
      </form>
    </Modal>
  )
}
