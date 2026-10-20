import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { PageContainer } from '../components/PageContainer.jsx'
import { IconChevronLeft } from '../components/icons.jsx'
import { Alert } from '../components/ui/Alert.jsx'
import { Badge } from '../components/ui/Badge.jsx'
import { Button } from '../components/ui/Button.jsx'
import { ConfirmDialog } from '../components/ui/ConfirmDialog.jsx'
import { PageLoader } from '../components/ui/Spinner.jsx'
import { BoardCard } from '../features/workspace/BoardCard.jsx'
import { CreateBoardDialog } from '../features/workspace/CreateBoardDialog.jsx'
import { EditWorkspaceDialog } from '../features/workspace/EditWorkspaceDialog.jsx'
import { MembersPanel } from '../features/workspace/MembersPanel.jsx'
import { useAuth } from '../hooks/useAuth.js'
import { api, apiErrorMessage } from '../lib/api.js'
import { roleLabel } from '../lib/constants.js'

export function WorkspacePage() {
  const { workspaceId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [workspace, setWorkspace] = useState(null)
  const [boards, setBoards] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notFound, setNotFound] = useState(false)
  const [createBoardOpen, setCreateBoardOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    setNotFound(false)

    try {
      const [workspaceResponse, boardsResponse] = await Promise.all([
        api.get(`/workspaces/${workspaceId}`),
        api.get(`/workspaces/${workspaceId}/boards`, { params: { per_page: 100 } }),
      ])

      setWorkspace(workspaceResponse.data.data)
      setBoards(boardsResponse.data.data ?? [])
    } catch (requestError) {
      if (requestError.response?.status === 404) {
        setNotFound(true)
      } else {
        setError(apiErrorMessage(requestError))
      }
    } finally {
      setLoading(false)
    }
  }, [workspaceId])

  useEffect(() => {
    load()
  }, [load])

  const handleDelete = async () => {
    setDeleting(true)

    try {
      await api.delete(`/workspaces/${workspaceId}`)
      navigate('/workspaces', { replace: true })
    } catch (requestError) {
      setError(apiErrorMessage(requestError))
      setDeleting(false)
      setDeleteOpen(false)
    }
  }

  if (loading) {
    return (
      <PageContainer>
        <PageLoader label="Cargando workspace…" />
      </PageContainer>
    )
  }

  if (notFound) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
          <h1 className="text-lg font-semibold text-slate-900 dark:text-zinc-100">
            Workspace no encontrado
          </h1>
          <p className="max-w-sm text-sm text-slate-500 dark:text-zinc-400">
            Puede que no exista o que no tengas acceso a él.
          </p>
          <Button as={Link} to="/workspaces" variant="secondary">
            Volver a los workspaces
          </Button>
        </div>
      </PageContainer>
    )
  }

  const isOwner = workspace?.owner?.id === user?.id
  const canManage = isOwner || workspace?.role === 'admin'

  return (
    <PageContainer>
      <Link
        to="/workspaces"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-100"
      >
        <IconChevronLeft className="h-4 w-4" />
        Workspaces
      </Link>

      {error ? <Alert className="mb-4">{error}</Alert> : null}

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="min-w-0 break-words text-2xl font-semibold text-slate-900 dark:text-zinc-100">
              {workspace.name}
            </h1>
            {workspace.role ? (
              <Badge className="bg-indigo-50 text-indigo-700 ring-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-300 dark:ring-indigo-500/30">
                {roleLabel(workspace.role)}
              </Badge>
            ) : null}
          </div>
          <p className="mt-1 max-w-2xl break-words text-sm text-slate-500 dark:text-zinc-400">
            {workspace.description || 'Sin descripción.'}
          </p>
          <p className="mt-2 text-xs text-slate-500 dark:text-zinc-400">
            {workspace.members_count ?? 0} miembros · {workspace.boards_count ?? 0} tableros
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {canManage ? (
            <Button variant="secondary" size="sm" onClick={() => setEditOpen(true)}>
              Editar
            </Button>
          ) : null}
          {isOwner ? (
            <Button
              variant="ghost"
              size="sm"
              className="text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10"
              onClick={() => setDeleteOpen(true)}
            >
              Eliminar
            </Button>
          ) : null}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-slate-900 dark:text-zinc-100">Tableros</h2>
            {canManage ? (
              <Button size="sm" onClick={() => setCreateBoardOpen(true)}>
                Nuevo tablero
              </Button>
            ) : null}
          </div>

          {boards.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-white/60 py-14 text-center dark:border-zinc-700 dark:bg-zinc-900/40">
              <p className="text-sm font-medium text-slate-700 dark:text-zinc-300">
                Todavía no hay tableros
              </p>
              <p className="max-w-xs text-sm text-slate-500 dark:text-zinc-400">
                Crea un tablero para empezar a organizar listas y tareas.
              </p>
              {canManage ? (
                <Button onClick={() => setCreateBoardOpen(true)} className="mt-1">
                  Crear tablero
                </Button>
              ) : null}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {boards.map((board) => (
                <BoardCard key={board.id} workspaceId={workspace.id} board={board} />
              ))}
            </div>
          )}
        </div>

        <MembersPanel
          workspaceId={workspace.id}
          canManage={canManage}
          ownerId={workspace.owner?.id}
        />
      </div>

      <CreateBoardDialog
        open={createBoardOpen}
        workspaceId={workspace.id}
        onClose={() => setCreateBoardOpen(false)}
        onCreated={(board) => {
          setBoards((previous) => [...previous, board])
          setCreateBoardOpen(false)
        }}
      />

      <EditWorkspaceDialog
        open={editOpen}
        workspace={workspace}
        onClose={() => setEditOpen(false)}
        onUpdated={(updated) => {
          setWorkspace((previous) => ({ ...previous, ...updated }))
          setEditOpen(false)
        }}
      />

      <ConfirmDialog
        open={deleteOpen}
        title="Eliminar workspace"
        description={`Se eliminarán ${workspace?.name}, sus tableros y todas sus tareas. Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar workspace"
        loading={deleting}
        onConfirm={handleDelete}
        onClose={() => setDeleteOpen(false)}
      />
    </PageContainer>
  )
}
