import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { Avatar } from '../components/Avatar.jsx'
import { PageContainer } from '../components/PageContainer.jsx'
import { Alert } from '../components/ui/Alert.jsx'
import { Button } from '../components/ui/Button.jsx'
import { ConfirmDialog } from '../components/ui/ConfirmDialog.jsx'
import { inputClass } from '../components/ui/Field.jsx'
import { PageLoader } from '../components/ui/Spinner.jsx'
import { IconArrowLeft, IconPlus } from '../components/icons.jsx'
import { BoardColumn } from '../features/board/BoardColumn.jsx'
import { TaskCard } from '../features/board/TaskCard.jsx'
import { TaskDialog } from '../features/board/TaskDialog.jsx'
import { useAuth } from '../hooks/useAuth.js'
import { api, apiErrorMessage } from '../lib/api.js'
import { findListByTaskId, parseDndId, resolveList } from '../features/board/dnd.js'

function snapshot(lists) {
  const map = {}

  lists.forEach((list) => {
    list.tasks.forEach((task, index) => {
      map[task.id] = { board_list_id: list.id, position: index + 1 }
    })
  })

  return map
}

export function BoardPage() {
  const { workspaceId, boardId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [workspace, setWorkspace] = useState(null)
  const [board, setBoard] = useState(null)
  const [lists, setLists] = useState([])
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notFound, setNotFound] = useState(false)

  const [activeTask, setActiveTask] = useState(null)
  const [selectedTaskId, setSelectedTaskId] = useState(null)

  const [addingList, setAddingList] = useState(false)
  const [newListName, setNewListName] = useState('')
  const [creatingList, setCreatingList] = useState(false)
  const [listToDelete, setListToDelete] = useState(null)
  const [deletingList, setDeletingList] = useState(false)

  const [editingBoard, setEditingBoard] = useState(false)
  const [boardName, setBoardName] = useState('')
  const [deleteBoardOpen, setDeleteBoardOpen] = useState(false)
  const [deletingBoard, setDeletingBoard] = useState(false)

  const serverSnapshotRef = useRef({})

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const loadBoard = useCallback(
    async ({ silent = false } = {}) => {
      if (!silent) {
        setLoading(true)
      }

      setError('')

      try {
        const [workspaceResponse, boardResponse, membersResponse] = await Promise.all([
          api.get(`/workspaces/${workspaceId}`),
          api.get(`/workspaces/${workspaceId}/boards/${boardId}`),
          api.get(`/workspaces/${workspaceId}/members`),
        ])

        const boardData = boardResponse.data.data
        const loadedLists = boardData.lists ?? []

        setWorkspace(workspaceResponse.data.data)
        setBoard(boardData)
        setBoardName(boardData.name ?? '')
        setLists(loadedLists)
        setMembers(membersResponse.data.data ?? [])
        serverSnapshotRef.current = snapshot(loadedLists)
      } catch (requestError) {
        if (requestError.response?.status === 404) {
          setNotFound(true)
        } else {
          setError(apiErrorMessage(requestError))
        }
      } finally {
        if (!silent) {
          setLoading(false)
        }
      }
    },
    [boardId, workspaceId],
  )

  useEffect(() => {
    loadBoard()
  }, [loadBoard])

  const selectedTask = useMemo(() => {
    if (!selectedTaskId) {
      return null
    }

    for (const list of lists) {
      const found = list.tasks.find((task) => task.id === selectedTaskId)

      if (found) {
        return found
      }
    }

    return null
  }, [lists, selectedTaskId])

  const canManage = workspace?.owner?.id === user?.id || workspace?.role === 'admin'

  // El propietario puede no venir en el listado de miembros; lo añadimos para
  // poder asignarle tareas.
  const assignableMembers = useMemo(() => {
    const list = [...members]

    if (workspace?.owner && !list.some((member) => member.id === workspace.owner.id)) {
      list.unshift({ ...workspace.owner, role: 'admin' })
    }

    return list
  }, [members, workspace])

  const syncPositions = useCallback(
    async (nextLists) => {
      const previousSnapshot = serverSnapshotRef.current
      const updates = []

      nextLists.forEach((list) => {
        list.tasks.forEach((task, index) => {
          const position = index + 1
          const previous = previousSnapshot[task.id]

          if (!previous || previous.board_list_id !== list.id || previous.position !== position) {
            updates.push({ id: task.id, board_list_id: list.id, position })
          }
        })
      })

      serverSnapshotRef.current = snapshot(nextLists)

      if (updates.length === 0) {
        return
      }

      try {
        await Promise.all(
          updates.map((update) =>
            api.patch(`/tasks/${update.id}`, {
              board_list_id: update.board_list_id,
              position: update.position,
            }),
          ),
        )
      } catch (requestError) {
        setError(apiErrorMessage(requestError))
        loadBoard({ silent: true })
      }
    },
    [loadBoard],
  )

  const handleDragStart = (event) => {
    const { id } = parseDndId(event.active.id)
    const list = findListByTaskId(lists, id)
    setActiveTask(list?.tasks.find((task) => task.id === id) ?? null)
  }

  const handleDragOver = (event) => {
    const { active, over } = event

    if (!over || active.id === over.id) {
      return
    }

    const { id: activeTaskId } = parseDndId(active.id)
    const sourceList = findListByTaskId(lists, activeTaskId)
    const targetList = resolveList(lists, over.id)

    if (!sourceList || !targetList || sourceList.id === targetList.id) {
      return
    }

    setLists((previous) => {
      const source = previous.find((list) => list.id === sourceList.id)
      const destination = previous.find((list) => list.id === targetList.id)

      if (!source || !destination) {
        return previous
      }

      const task = source.tasks.find((item) => item.id === activeTaskId)

      if (!task) {
        return previous
      }

      const { id: overTaskId } = parseDndId(over.id)
      const overIndex = destination.tasks.findIndex((item) => item.id === overTaskId)
      const insertIndex = overIndex >= 0 ? overIndex : destination.tasks.length

      const destinationTasks = [...destination.tasks]
      destinationTasks.splice(insertIndex, 0, { ...task, board_list_id: destination.id })

      return previous.map((list) => {
        if (list.id === source.id) {
          return { ...list, tasks: list.tasks.filter((item) => item.id !== activeTaskId) }
        }

        if (list.id === destination.id) {
          return { ...list, tasks: destinationTasks }
        }

        return list
      })
    })
  }

  const handleDragEnd = (event) => {
    const { active, over } = event
    setActiveTask(null)

    if (!over) {
      return
    }

    const { id: activeTaskId } = parseDndId(active.id)
    const sourceList = findListByTaskId(lists, activeTaskId)
    const targetList = resolveList(lists, over.id)

    if (!sourceList || !targetList) {
      return
    }

    let next = lists

    if (sourceList.id === targetList.id && active.id !== over.id) {
      const oldIndex = sourceList.tasks.findIndex((task) => task.id === activeTaskId)
      const { id: overTaskId } = parseDndId(over.id)
      const newIndex = sourceList.tasks.findIndex((task) => task.id === overTaskId)

      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        next = lists.map((list) =>
          list.id === sourceList.id
            ? { ...list, tasks: arrayMove(list.tasks, oldIndex, newIndex) }
            : list,
        )
      }
    }

    const normalized = next.map((list) => ({
      ...list,
      tasks: list.tasks.map((task, index) => ({
        ...task,
        board_list_id: list.id,
        position: index + 1,
      })),
    }))

    setLists(normalized)
    syncPositions(normalized)
  }

  const handleAddTask = async (list, title) => {
    setError('')

    try {
      const { data } = await api.post(`/lists/${list.id}/tasks`, { title })
      setLists((previous) =>
        previous.map((item) =>
          item.id === list.id ? { ...item, tasks: [...item.tasks, data.data] } : item,
        ),
      )
      serverSnapshotRef.current = {
        ...serverSnapshotRef.current,
        [data.data.id]: { board_list_id: list.id, position: list.tasks.length + 1 },
      }
      return true
    } catch (requestError) {
      setError(apiErrorMessage(requestError))
      return false
    }
  }

  const handleTaskUpdated = (updated) => {
    setLists((previous) =>
      previous.map((list) => ({
        ...list,
        tasks: list.tasks.map((task) => (task.id === updated.id ? { ...task, ...updated } : task)),
      })),
    )
  }

  const handleTaskDeleted = (taskId) => {
    setLists((previous) =>
      previous.map((list) => ({
        ...list,
        tasks: list.tasks.filter((task) => task.id !== taskId),
      })),
    )
    setSelectedTaskId(null)
  }

  const handleRenameList = async (list, name) => {
    setError('')

    try {
      const { data } = await api.patch(`/boards/${boardId}/lists/${list.id}`, { name })
      setLists((previous) =>
        previous.map((item) => (item.id === list.id ? { ...item, ...data.data, tasks: item.tasks } : item)),
      )
      return true
    } catch (requestError) {
      setError(apiErrorMessage(requestError))
      return false
    }
  }

  const handleDeleteList = async () => {
    if (!listToDelete) {
      return
    }

    setDeletingList(true)
    setError('')

    try {
      await api.delete(`/boards/${boardId}/lists/${listToDelete.id}`)
      setLists((previous) => previous.filter((list) => list.id !== listToDelete.id))
      setListToDelete(null)
    } catch (requestError) {
      setError(apiErrorMessage(requestError))
    } finally {
      setDeletingList(false)
    }
  }

  const handleCreateList = async (event) => {
    event.preventDefault()
    const trimmed = newListName.trim()

    if (!trimmed) {
      return
    }

    setCreatingList(true)
    setError('')

    try {
      const { data } = await api.post(`/boards/${boardId}/lists`, { name: trimmed })
      setLists((previous) => [...previous, { ...data.data, tasks: data.data.tasks ?? [] }])
      setNewListName('')
      setAddingList(false)
    } catch (requestError) {
      setError(apiErrorMessage(requestError))
    } finally {
      setCreatingList(false)
    }
  }

  const handleRenameBoard = async () => {
    const trimmed = boardName.trim()

    if (!trimmed || trimmed === board?.name) {
      setBoardName(board?.name ?? '')
      setEditingBoard(false)
      return
    }

    setError('')

    try {
      const { data } = await api.patch(`/workspaces/${workspaceId}/boards/${boardId}`, {
        name: trimmed,
      })
      setBoard((previous) => ({ ...previous, ...data.data }))
      setEditingBoard(false)
    } catch (requestError) {
      setError(apiErrorMessage(requestError))
      setBoardName(board?.name ?? '')
      setEditingBoard(false)
    }
  }

  const handleDeleteBoard = async () => {
    setDeletingBoard(true)

    try {
      await api.delete(`/workspaces/${workspaceId}/boards/${boardId}`)
      navigate(`/workspaces/${workspaceId}`, { replace: true })
    } catch (requestError) {
      setError(apiErrorMessage(requestError))
      setDeletingBoard(false)
      setDeleteBoardOpen(false)
    }
  }

  if (loading) {
    return (
      <PageContainer wide>
        <PageLoader label="Cargando tablero…" />
      </PageContainer>
    )
  }

  if (notFound) {
    return (
      <PageContainer wide>
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
          <h1 className="text-lg font-semibold text-slate-900 dark:text-zinc-100">
            Tablero no encontrado
          </h1>
          <p className="max-w-sm text-sm text-slate-500 dark:text-zinc-400">
            Puede que no exista o que no tengas acceso a él.
          </p>
          <Button as={Link} to={`/workspaces/${workspaceId}`} variant="secondary">
            Volver al workspace
          </Button>
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer wide>
      <Link
        to={`/workspaces/${workspaceId}`}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-100"
      >
        <IconArrowLeft className="h-4 w-4" />
        {board?.name ? 'Volver al workspace' : 'Volver'}
      </Link>

      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <span
            className="mt-1.5 h-3.5 w-3.5 shrink-0 rounded-full"
            style={{ backgroundColor: board?.color || '#6366f1' }}
            aria-hidden="true"
          />
          <div>
            {editingBoard ? (
              <input
                autoFocus
                value={boardName}
                onChange={(event) => setBoardName(event.target.value)}
                onBlur={handleRenameBoard}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    handleRenameBoard()
                  }

                  if (event.key === 'Escape') {
                    setBoardName(board?.name ?? '')
                    setEditingBoard(false)
                  }
                }}
                className={`${inputClass} max-w-sm py-1 text-xl font-semibold`}
              />
            ) : (
              <h1
                className={`text-2xl font-semibold text-slate-900 dark:text-zinc-100 ${canManage ? 'cursor-text' : ''}`}
                onClick={() => {
                  if (canManage) {
                    setEditingBoard(true)
                  }
                }}
              >
                {board?.name}
              </h1>
            )}
            <p className="mt-1 max-w-2xl text-sm text-slate-500 dark:text-zinc-400">
              {board?.description || 'Sin descripción.'}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <div className="flex -space-x-2">
            {members.slice(0, 5).map((member) => (
              <Avatar
                key={member.id}
                name={member.name}
                src={member.avatar}
                size="sm"
                className="ring-2 ring-slate-100 dark:ring-zinc-900"
              />
            ))}
          </div>
          {canManage ? (
            <Button
              variant="ghost"
              size="sm"
              className="text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10"
              onClick={() => setDeleteBoardOpen(true)}
            >
              Eliminar tablero
            </Button>
          ) : null}
        </div>
      </div>

      {error ? <Alert className="mb-4">{error}</Alert> : null}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveTask(null)}
      >
        <div className="flex min-h-0 flex-1 items-start gap-4 overflow-x-auto pb-4">
          {lists.map((list) => (
            <BoardColumn
              key={list.id}
              list={list}
              canManage={canManage}
              onRename={handleRenameList}
              onDelete={setListToDelete}
              onAddTask={handleAddTask}
              onOpenTask={(task) => setSelectedTaskId(task.id)}
            />
          ))}

          {canManage ? (
            <div className="w-72 shrink-0">
              {addingList ? (
                <form
                  onSubmit={handleCreateList}
                  className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-200 dark:bg-zinc-900 dark:ring-zinc-800"
                >
                  <input
                    autoFocus
                    value={newListName}
                    onChange={(event) => setNewListName(event.target.value)}
                    placeholder="Nombre de la lista"
                    className={`${inputClass} text-sm`}
                  />
                  <div className="mt-2 flex items-center gap-2">
                    <Button type="submit" size="sm" loading={creatingList}>
                      Añadir lista
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setAddingList(false)
                        setNewListName('')
                      }}
                    >
                      Cancelar
                    </Button>
                  </div>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => setAddingList(true)}
                  className="flex w-full items-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-white/50 px-3 py-3 text-sm font-medium text-slate-500 transition hover:border-indigo-300 hover:text-indigo-600 dark:border-zinc-700 dark:bg-zinc-900/40 dark:text-zinc-400 dark:hover:border-indigo-500 dark:hover:text-indigo-300"
                >
                  <IconPlus className="h-4 w-4" />
                  Añadir lista
                </button>
              )}
            </div>
          ) : null}
        </div>

        <DragOverlay>
          {activeTask ? <TaskCard task={activeTask} dragging /> : null}
        </DragOverlay>
      </DndContext>

      <TaskDialog
        open={selectedTask !== null}
        task={selectedTask}
        members={assignableMembers}
        currentUserId={user?.id}
        isAdmin={canManage}
        onClose={() => setSelectedTaskId(null)}
        onUpdated={handleTaskUpdated}
        onDeleted={handleTaskDeleted}
        onCountsChanged={() => loadBoard({ silent: true })}
      />

      <ConfirmDialog
        open={listToDelete !== null}
        title="Eliminar lista"
        description={
          listToDelete
            ? `Se eliminarán la lista "${listToDelete.name}" y sus ${listToDelete.tasks.length} tareas.`
            : ''
        }
        confirmLabel="Eliminar lista"
        loading={deletingList}
        onConfirm={handleDeleteList}
        onClose={() => setListToDelete(null)}
      />

      <ConfirmDialog
        open={deleteBoardOpen}
        title="Eliminar tablero"
        description={`Se eliminarán "${board?.name}", sus listas y todas sus tareas. Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar tablero"
        loading={deletingBoard}
        onConfirm={handleDeleteBoard}
        onClose={() => setDeleteBoardOpen(false)}
      />
    </PageContainer>
  )
}
