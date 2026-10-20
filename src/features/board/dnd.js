/**
 * dnd-kit requires all identifiers in the same DndContext to be unique.
 * Since lists and tasks live in different tables, their ids may collide,
 * so we prefix them.
 */
export function taskDndId(id) {
  return `task-${id}`
}

export function listDndId(id) {
  return `list-${id}`
}

export function parseDndId(value) {
  const separator = String(value).indexOf('-')

  return {
    type: String(value).slice(0, separator),
    id: Number(String(value).slice(separator + 1)),
  }
}

export function findListByTaskId(lists, taskId) {
  return lists.find((list) => list.tasks.some((task) => task.id === taskId)) ?? null
}

/**
 * Resolves the list targeted by a droppable id, whether it is a column
 * (`list-<id>`) or a task (`task-<id>`).
 */
export function resolveList(lists, dndId) {
  const { type, id } = parseDndId(dndId)

  if (type === 'list') {
    return lists.find((list) => list.id === id) ?? null
  }

  return findListByTaskId(lists, id)
}
