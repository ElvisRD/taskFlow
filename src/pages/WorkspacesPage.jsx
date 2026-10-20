import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageContainer } from '../components/PageContainer.jsx'
import { Badge } from '../components/ui/Badge.jsx'
import { Alert } from '../components/ui/Alert.jsx'
import { Button } from '../components/ui/Button.jsx'
import { Field, inputClass } from '../components/ui/Field.jsx'
import { Modal } from '../components/ui/Modal.jsx'
import { PageLoader } from '../components/ui/Spinner.jsx'
import { api, apiErrorMessage, validationErrors } from '../lib/api.js'
import { roleLabel } from '../lib/constants.js'

const PER_PAGE = 12
const WORKSPACE_NAME_MAX_LENGTH = 100
const WORKSPACE_DESCRIPTION_MAX_LENGTH = 200

function validateWorkspaceForm(form) {
  const errors = {}
  const name = form.name.trim()

  if (!name) {
    errors.name = 'El nombre no es válido.'
  } else if (name.length > WORKSPACE_NAME_MAX_LENGTH) {
    errors.name = `El nombre no puede superar los ${WORKSPACE_NAME_MAX_LENGTH} caracteres.`
  }

  if (form.description.length > WORKSPACE_DESCRIPTION_MAX_LENGTH) {
    errors.description = `La descripción no puede superar los ${WORKSPACE_DESCRIPTION_MAX_LENGTH} caracteres.`
  }

  return errors
}

export function WorkspacesPage() {
  const [workspaces, setWorkspaces] = useState([])
  const [meta, setMeta] = useState(null)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [createOpen, setCreateOpen] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300)

    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch])

  const load = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const { data } = await api.get('/workspaces', {
        params: {
          page,
          per_page: PER_PAGE,
          search: debouncedSearch || undefined,
        },
      })

      setWorkspaces(data.data ?? [])
      setMeta(data.meta ?? null)
    } catch (requestError) {
      setError(apiErrorMessage(requestError))
    } finally {
      setLoading(false)
    }
  }, [page, debouncedSearch])

  useEffect(() => {
    load()
  }, [load])

  const handleCreated = (workspace) => {
    setCreateOpen(false)
    setPage(1)
    setSearch('')
    setDebouncedSearch('')
    setWorkspaces((previous) => [workspace, ...previous.filter((item) => item.id !== workspace.id)])
  }

  return (
    <PageContainer>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-zinc-100">Workspaces</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">
            Tus espacios de trabajo y la gente con la que colaboras.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar…"
            className={`${inputClass} sm:w-64`}
          />
          <Button onClick={() => setCreateOpen(true)}>Nuevo workspace</Button>
        </div>
      </div>

      {error ? <Alert className="mb-4">{error}</Alert> : null}

      {loading ? (
        <PageLoader label="Cargando workspaces…" />
      ) : workspaces.length === 0 ? (
        <EmptyWorkspaces
          hasSearch={debouncedSearch !== ''}
          onCreate={() => setCreateOpen(true)}
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {workspaces.map((workspace) => (
              <WorkspaceCard key={workspace.id} workspace={workspace} />
            ))}
          </div>

          {meta && meta.last_page > 1 ? (
            <div className="mt-6 flex items-center justify-between">
              <p className="text-sm text-slate-500 dark:text-zinc-400">
                Página {meta.current_page} de {meta.last_page} · {meta.total} workspaces
              </p>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                >
                  Anterior
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page >= meta.last_page}
                  onClick={() => setPage((current) => current + 1)}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          ) : null}
        </>
      )}

      <CreateWorkspaceDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={handleCreated}
      />
    </PageContainer>
  )
}

function WorkspaceCard({ workspace }) {
  return (
    <Link
      to={`/workspaces/${workspace.id}`}
      className="group flex min-w-0 flex-col rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-md hover:ring-indigo-200 dark:bg-zinc-900 dark:ring-zinc-800 dark:hover:ring-indigo-500/60"
    >
      <div className="flex min-w-0 items-start justify-between gap-3">
        <h2
          title={workspace.name}
          className="min-w-0 flex-1 truncate text-base font-semibold text-slate-900 group-hover:text-indigo-700 dark:text-zinc-100 dark:group-hover:text-indigo-300"
        >
          {workspace.name}
        </h2>
        {workspace.role ? (
          <Badge className="shrink-0 bg-indigo-50 text-indigo-700 ring-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-300 dark:ring-indigo-500/30">
            {roleLabel(workspace.role)}
          </Badge>
        ) : null}
      </div>

      <p
        title={workspace.description || 'Sin descripción.'}
        className="mt-2 line-clamp-2 flex-1 break-words text-sm text-slate-500 dark:text-zinc-400"
      >
        {workspace.description || 'Sin descripción.'}
      </p>

      <div className="mt-4 flex items-center gap-4 text-xs text-slate-500 dark:text-zinc-400">
        <span className="inline-flex items-center gap-1.5">
          <svg className="h-4 w-4 text-slate-400 dark:text-zinc-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path d="M10 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm-6.5 8a6.5 6.5 0 1 1 13 0 .75.75 0 0 1-.75.75h-11.5A.75.75 0 0 1 3.5 16Z" />
          </svg>
          {workspace.members_count ?? 0} miembros
        </span>
        <span className="inline-flex items-center gap-1.5">
          <svg className="h-4 w-4 text-slate-400 dark:text-zinc-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path d="M3 4.5A1.5 1.5 0 0 1 4.5 3h4A1.5 1.5 0 0 1 10 4.5v11A1.5 1.5 0 0 1 8.5 17h-4A1.5 1.5 0 0 1 3 15.5v-11Zm9 0A1.5 1.5 0 0 1 13.5 3h2A1.5 1.5 0 0 1 17 4.5v6A1.5 1.5 0 0 1 15.5 12h-2A1.5 1.5 0 0 1 12 10.5v-6Z" />
          </svg>
          {workspace.boards_count ?? 0} tableros
        </span>
      </div>
    </Link>
  )
}

function EmptyWorkspaces({ hasSearch, onCreate }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-white/60 py-16 text-center dark:border-zinc-700 dark:bg-zinc-900/40">
      <p className="text-sm font-medium text-slate-700 dark:text-zinc-300">
        {hasSearch ? 'No se encontraron workspaces' : 'Todavía no tienes workspaces'}
      </p>
      <p className="max-w-sm text-sm text-slate-500 dark:text-zinc-400">
        {hasSearch
          ? 'Prueba con otro término de búsqueda.'
          : 'Crea tu primer workspace para empezar a organizar tableros y tareas.'}
      </p>
      {hasSearch ? null : (
        <Button onClick={onCreate} className="mt-2">
          Crear workspace
        </Button>
      )}
    </div>
  )
}

function CreateWorkspaceDialog({ open, onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', description: '' })
  const [serverErrors, setServerErrors] = useState({})
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showValidation, setShowValidation] = useState(false)
  const [touched, setTouched] = useState({})

  useEffect(() => {
    if (open) {
      setForm({ name: '', description: '' })
      setServerErrors({})
      setMessage('')
      setShowValidation(false)
      setTouched({})
    }
  }, [open])

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
      const { data } = await api.post('/workspaces', {
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
    <Modal open={open} onClose={onClose} title="Nuevo workspace">
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {message && !errors.name && !errors.description ? <Alert>{message}</Alert> : null}

        <Field label="Nombre" htmlFor="workspace-name" error={errors.name}>
          <input
            id="workspace-name"
            autoFocus
            value={form.name}
            aria-invalid={errors.name ? 'true' : undefined}
            onChange={(event) => update('name', event.target.value)}
            className={inputClass}
            placeholder="Equipo de producto"
          />
        </Field>

        <Field label="Descripción" htmlFor="workspace-description" error={errors.description}>
          <textarea
            id="workspace-description"
            rows={3}
            value={form.description}
            aria-invalid={errors.description ? 'true' : undefined}
            onChange={(event) => update('description', event.target.value)}
            className={`${inputClass} resize-none`}
            placeholder="¿Para qué usaréis este espacio?"
          />
        </Field>

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button type="submit" loading={submitting}>
            Crear workspace
          </Button>
        </div>
      </form>
    </Modal>
  )
}
