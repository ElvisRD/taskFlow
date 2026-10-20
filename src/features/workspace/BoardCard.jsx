import { Link } from 'react-router-dom'

export function BoardCard({ workspaceId, board }) {
  const color = board.color || '#6366f1'

  return (
    <Link
      to={`/workspaces/${workspaceId}/boards/${board.id}`}
      className="group flex min-w-0 flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-md hover:ring-indigo-200 dark:bg-zinc-900 dark:ring-zinc-800 dark:hover:ring-indigo-500/60"
    >
      <div className="h-1.5 w-full" style={{ backgroundColor: color }} />
      <div className="flex flex-1 flex-col p-5">
        <div className="flex min-w-0 items-start justify-between gap-3">
          <h3
            title={board.name}
            className="min-w-0 flex-1 truncate text-base font-semibold text-slate-900 group-hover:text-indigo-700 dark:text-zinc-100 dark:group-hover:text-indigo-300"
          >
            {board.name}
          </h3>
          <span
            className="mt-1 h-3 w-3 shrink-0 rounded-full"
            style={{ backgroundColor: color }}
            aria-hidden="true"
          />
        </div>

        <p
          title={board.description || 'Sin descripción.'}
          className="mt-2 line-clamp-2 flex-1 break-words text-sm text-slate-500 dark:text-zinc-400"
        >
          {board.description || 'Sin descripción.'}
        </p>

        <p className="mt-4 text-xs text-slate-500 dark:text-zinc-400">
          {board.lists_count ?? 0} {(board.lists_count ?? 0) === 1 ? 'lista' : 'listas'}
        </p>
      </div>
    </Link>
  )
}
