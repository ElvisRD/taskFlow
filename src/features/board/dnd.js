/**
 * dnd-kit requiere que todos los identificadores de un mismo DndContext sean
 * únicos. Como las listas y las tareas viven en tablas distintas, sus ids
 * pueden coincidir, así que los prefijamos.
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
 * Resuelve la lista a la que apunta un id de droppable, ya sea una columna
 * (`list-<id>`) o una tarea (`task-<id>`).
 */
export function resolveList(lists, dndId) {
  const { type, id } = parseDndId(dndId)

  if (type === 'list') {
    return lists.find((list) => list.id === id) ?? null
  }

  return findListByTaskId(lists, id)
}
