import { useState } from 'react'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Button } from '../../components/ui/Button.jsx'
import { inputClass } from '../../components/ui/Field.jsx'
import { IconDots, IconPlus } from '../../components/icons.jsx'
import { SortableTaskCard } from './TaskCard.jsx'
import { listDndId, taskDndId } from './dnd.js'

export function BoardColumn({
  list,
  canManage,
  onRename,
  onDelete,
  onAddTask,
  onOpenTask,
}) {
  const {
    attributes,
    listeners,
    setActivatorNodeRef,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
  } = useSortable({
    id: listDndId(list.id),
    data: { type: 'list', listId: list.id },
  })

  const [menuOpen, setMenuOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(list.name)
  const [title, setTitle] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const canDrag = canManage && !editing

  const submitRename = async () => {
    const trimmed = name.trim()

    if (!trimmed || trimmed === list.name) {
      setName(list.name)
      setEditing(false)
      return
    }

    const renamed = await onRename(list, trimmed)

    if (!renamed) {
      setName(list.name)
    }

    setEditing(false)
  }

  const submitAdd = async (event) => {
    event.preventDefault()
    const trimmed = title.trim()

    if (!trimmed) {
      return
    }

    setSubmitting(true)

    try {
      const added = await onAddTask(list, trimmed)

      if (added) {
        setTitle('')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex max-h-full w-72 shrink-0 flex-col rounded-2xl bg-slate-50 ring-1 ring-slate-200 transition-shadow dark:bg-zinc-900 dark:ring-zinc-800 ${
        isDragging ? 'opacity-40 shadow-xl' : ''
      }`}
    >
      <header className="flex items-stretch justify-between gap-2">
        <div
          ref={canDrag ? setActivatorNodeRef : undefined}
          {...(canDrag ? attributes : {})}
          {...(canDrag ? listeners : {})}
          aria-label={canDrag ? `Reordenar ${list.name}` : undefined}
          className={`flex min-w-0 flex-1 items-center gap-1 py-2.5 pl-3 ${
            canDrag ? 'cursor-grab touch-none select-none active:cursor-grabbing' : ''
          }`}
        >
          {editing ? (
            <input
              autoFocus
              value={name}
              onChange={(event) => setName(event.target.value)}
              onBlur={submitRename}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  submitRename()
                }

                if (event.key === 'Escape') {
                  setName(list.name)
                  setEditing(false)
                }
              }}
              className={`${inputClass} min-w-0 flex-1 py-1 text-sm`}
            />
          ) : (
            <h3
              title={list.name}
              className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-700 dark:text-zinc-300"
            >
              {list.name}
            </h3>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1 py-2.5 pr-3">
          <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-zinc-800 dark:text-zinc-300">
            {list.tasks.length}
          </span>

          {canManage && !editing ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((open) => !open)}
                className="rounded-md p-1 text-slate-400 transition hover:bg-slate-200 hover:text-slate-600 dark:hover:bg-zinc-700 dark:hover:text-zinc-200"
                aria-label={`Acciones de ${list.name}`}
              >
                <IconDots className="h-4 w-4" />
              </button>

              {menuOpen ? (
                <>
                  <button
                    type="button"
                    aria-hidden="true"
                    className="fixed inset-0 z-10 cursor-default"
                    onClick={() => setMenuOpen(false)}
                  />
                  <div className="absolute right-0 z-20 mt-1 w-32 overflow-hidden rounded-lg bg-white py-1 text-sm shadow-lg ring-1 ring-slate-200 dark:bg-zinc-800 dark:ring-zinc-700">
                    <button
                      type="button"
                      className="block w-full px-3 py-1.5 text-left text-slate-700 hover:bg-slate-50 dark:text-zinc-200 dark:hover:bg-zinc-700"
                      onClick={() => {
                        setMenuOpen(false)
                        setEditing(true)
                      }}
                    >
                      Renombrar
                    </button>
                    <button
                      type="button"
                      className="block w-full px-3 py-1.5 text-left text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10"
                      onClick={() => {
                        setMenuOpen(false)
                        onDelete(list)
                      }}
                    >
                      Eliminar
                    </button>
                  </div>
                </>
              ) : null}
            </div>
          ) : null}
        </div>
      </header>

      <div
        className={`scrollbar-thin flex-1 space-y-2 overflow-y-auto px-2.5 pb-2 pt-0.5 transition ${
          isOver ? 'bg-indigo-50/70 dark:bg-indigo-500/10' : ''
        }`}
      >
        <SortableContext
          items={list.tasks.map((task) => taskDndId(task.id))}
          strategy={verticalListSortingStrategy}
        >
          {list.tasks.map((task) => (
            <SortableTaskCard key={task.id} task={task} onOpen={() => onOpenTask(task)} />
          ))}
        </SortableContext>

        {list.tasks.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 px-3 py-6 text-center text-xs text-slate-500 dark:border-zinc-700 dark:text-zinc-400">
            Sin tareas. Arrastra una aquí.
          </p>
        ) : null}
      </div>

      <form
        onSubmit={submitAdd}
        className="flex items-center gap-2 border-t border-slate-200 p-2 dark:border-zinc-800"
      >
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Añadir tarea…"
          className={`${inputClass} py-1.5 text-sm`}
        />
        <Button
          type="submit"
          size="sm"
          loading={submitting}
          disabled={!title.trim()}
          aria-label="Añadir tarea"
          className="shrink-0 px-2"
        >
          {submitting ? null : <IconPlus className="h-4 w-4" />}
        </Button>
      </form>
    </div>
  )
}
