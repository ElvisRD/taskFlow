import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Avatar } from '../../components/Avatar.jsx'
import { PriorityBadge } from '../../components/PriorityBadge.jsx'
import { IconCalendar, IconChat, IconCheck, IconPaperclip } from '../../components/icons.jsx'
import { formatDate } from '../../lib/format.js'
import { taskDndId } from './dnd.js'

export function TaskCard({ task, onOpen, dragging = false, dragProps = {} }) {
  const dueDate = formatDate(task.due_date)
  const commentCount = task.comments_count ?? 0
  const attachmentCount = task.attachments_count ?? 0

  return (
    <article
      {...dragProps}
      onClick={onOpen}
      className={`group cursor-grab touch-none rounded-xl bg-white p-3 text-left shadow-sm ring-1 ring-slate-200 transition hover:ring-indigo-300 active:cursor-grabbing dark:bg-zinc-800 dark:ring-zinc-700 dark:hover:ring-indigo-500 ${
        dragging ? 'opacity-50' : ''
      }`}
    >
      <div className="flex items-start gap-2">
        {task.is_completed ? (
          <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
            <IconCheck className="h-3 w-3" />
          </span>
        ) : null}
        <p
          className={`flex-1 text-sm font-medium leading-snug ${
            task.is_completed ? 'text-slate-400 line-through dark:text-zinc-400' : 'text-slate-800 dark:text-zinc-100'
          }`}
        >
          {task.title}
        </p>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <PriorityBadge value={task.priority} />

        {dueDate ? (
          <span
            className={`inline-flex items-center gap-1 text-xs ${
              task.is_overdue
                ? 'font-medium text-rose-600 dark:text-rose-400'
                : 'text-slate-500 dark:text-zinc-400'
            }`}
          >
            <IconCalendar className="h-3.5 w-3.5" />
            {dueDate}
          </span>
        ) : null}

        {commentCount > 0 ? (
          <span className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-zinc-400">
            <IconChat className="h-3.5 w-3.5" />
            {commentCount}
          </span>
        ) : null}

        {attachmentCount > 0 ? (
          <span className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-zinc-400">
            <IconPaperclip className="h-3.5 w-3.5" />
            {attachmentCount}
          </span>
        ) : null}
      </div>

      {task.assignee ? (
        <div className="mt-3 flex items-center gap-2">
          <Avatar name={task.assignee.name} src={task.assignee.avatar} size="xs" />
          <span className="truncate text-xs text-slate-500 dark:text-zinc-400">
            {task.assignee.name}
          </span>
        </div>
      ) : null}
    </article>
  )
}

export function SortableTaskCard({ task, onOpen }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: taskDndId(task.id) })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={isDragging ? 'opacity-40' : ''}
    >
      <TaskCard
        task={task}
        onOpen={onOpen}
        dragProps={{ ...attributes, ...listeners }}
      />
    </div>
  )
}
