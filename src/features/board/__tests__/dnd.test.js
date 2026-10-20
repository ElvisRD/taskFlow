import { describe, expect, it } from 'vitest'
import {
  findListByTaskId,
  listDndId,
  parseDndId,
  resolveList,
  taskDndId,
} from '../dnd.js'

const lists = [
  {
    id: 10,
    name: 'Por hacer',
    tasks: [
      { id: 1, title: 'Primera' },
      { id: 2, title: 'Segunda' },
    ],
  },
  {
    id: 20,
    name: 'En curso',
    tasks: [{ id: 3, title: 'Tercera' }],
  },
  {
    id: 30,
    name: 'Hecho',
    tasks: [],
  },
]

describe('dnd-kit identifiers', () => {
  it('prefixes tasks and lists', () => {
    expect(taskDndId(7)).toBe('task-7')
    expect(listDndId(7)).toBe('list-7')
  })

  it('parses the type and numeric id', () => {
    expect(parseDndId('task-42')).toEqual({ type: 'task', id: 42 })
    expect(parseDndId('list-9')).toEqual({ type: 'list', id: 9 })
  })

  it('does not support composite ids with dashes', () => {
    expect(parseDndId('task-1-2')).toEqual({ type: 'task', id: NaN })
  })
})

describe('findListByTaskId', () => {
  it('finds the list that contains the task', () => {
    expect(findListByTaskId(lists, 1)).toBe(lists[0])
    expect(findListByTaskId(lists, 3)).toBe(lists[1])
  })

  it('returns null if the task does not exist', () => {
    expect(findListByTaskId(lists, 999)).toBeNull()
    expect(findListByTaskId([], 1)).toBeNull()
  })
})

describe('resolveList', () => {
  it('resolves a list id directly', () => {
    expect(resolveList(lists, 'list-20')).toBe(lists[1])
    expect(resolveList(lists, 'list-30')).toBe(lists[2])
  })

  it('resolves a list from a task id', () => {
    expect(resolveList(lists, 'task-2')).toBe(lists[0])
    expect(resolveList(lists, 'task-3')).toBe(lists[1])
  })

  it('returns null for unknown ids', () => {
    expect(resolveList(lists, 'list-999')).toBeNull()
    expect(resolveList(lists, 'task-999')).toBeNull()
  })
})
