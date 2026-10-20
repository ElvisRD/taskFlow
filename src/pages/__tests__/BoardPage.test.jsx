import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { BoardPage } from '../BoardPage.jsx'
import { AuthContext } from '../../context/AuthContext.jsx'
import { api } from '../../lib/api.js'

vi.mock('../../lib/api', async (importOriginal) => {
  const actual = await importOriginal()

  return {
    ...actual,
    api: {
      get: vi.fn(),
      post: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
    },
  }
})

const WORKSPACE = {
  id: 1,
  name: 'TaskFlow Demo',
  owner: { id: 1, name: 'Ana Propietaria' },
  role: 'admin',
}

const MEMBERS = [
  { id: 1, name: 'Ana Propietaria', avatar: null },
  { id: 2, name: 'Beto Miembro', avatar: null },
]

const TASK = {
  id: 100,
  title: 'Preparar wireframes',
  description: 'Borradores iniciales',
  priority: 'high',
  due_date: null,
  is_completed: false,
  creator: { id: 2 },
  assignee: { id: 2, name: 'Beto Miembro' },
  comments_count: 0,
  attachments_count: 0,
}

function buildBoard() {
  return {
    id: 5,
    name: 'Sprint 1',
    description: 'Tablero principal',
    color: '#6366f1',
    lists: [
      { id: 10, name: 'Por hacer', tasks: [{ ...TASK }] },
      { id: 11, name: 'Hecho', tasks: [] },
    ],
  }
}

function renderBoard() {
  return render(
    <MemoryRouter initialEntries={['/workspaces/1/boards/5']}>
      <AuthContext.Provider
        value={{ user: { id: 1, name: 'Ana Propietaria' }, status: 'authenticated' }}
      >
        <Routes>
          <Route
            path="/workspaces/:workspaceId/boards/:boardId"
            element={<BoardPage />}
          />
          <Route path="/workspaces/:workspaceId" element={<div>Workspace page</div>} />
        </Routes>
      </AuthContext.Provider>
    </MemoryRouter>,
  )
}

function mockBoardGet(board = buildBoard(), workspace = WORKSPACE) {
  api.get.mockImplementation((url) => {
    if (url === '/workspaces/1') {
      return Promise.resolve({ data: { data: workspace } })
    }

    if (url === '/workspaces/1/boards/5') {
      return Promise.resolve({ data: { data: board } })
    }

    if (url === '/workspaces/1/members') {
      return Promise.resolve({ data: { data: MEMBERS } })
    }

    if (url.endsWith('/comments') || url.endsWith('/attachments')) {
      return Promise.resolve({ data: { data: [] } })
    }

    return Promise.reject(new Error(`URL no mockeada: ${url}`))
  })
}

describe('BoardPage', () => {
  beforeEach(() => {
    api.get.mockReset()
    api.post.mockReset()
    api.patch.mockReset()
    api.delete.mockReset()
  })

  it('loads the board, its lists, tasks and members', async () => {
    mockBoardGet()

    renderBoard()

    expect(await screen.findByRole('heading', { name: 'Sprint 1' })).toBeInTheDocument()
    expect(screen.getByText('Tablero principal')).toBeInTheDocument()
    expect(screen.getByText('Por hacer')).toBeInTheDocument()
    expect(screen.getByText('Hecho')).toBeInTheDocument()
    expect(screen.getByText('Preparar wireframes')).toBeInTheDocument()

    expect(api.get).toHaveBeenCalledWith('/workspaces/1')
    expect(api.get).toHaveBeenCalledWith('/workspaces/1/boards/5')
    expect(api.get).toHaveBeenCalledWith('/workspaces/1/members')
  })

  it('shows "Tablero no encontrado" on a 404', async () => {
    api.get.mockRejectedValue({ response: { status: 404 } })

    renderBoard()

    expect(await screen.findByText('Tablero no encontrado')).toBeInTheDocument()
  })

  it('makes the list header draggable for admins', async () => {
    mockBoardGet()

    renderBoard()

    expect(
      await screen.findByRole('button', { name: 'Reordenar Por hacer' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reordenar Hecho' })).toBeInTheDocument()
  })

  it('does not make list headers draggable for members', async () => {
    mockBoardGet(buildBoard(), {
      ...WORKSPACE,
      role: 'member',
      owner: { id: 99, name: 'Otra Persona' },
    })

    renderBoard()

    expect(await screen.findByText('Preparar wireframes')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Reordenar Por hacer' })).not.toBeInTheDocument()
  })

  it('adds a task to a list', async () => {
    const user = userEvent.setup()
    mockBoardGet()
    api.post.mockResolvedValue({
      data: { data: { id: 101, title: 'Nueva tarea', priority: 'medium' } },
    })

    renderBoard()
    await screen.findByText('Preparar wireframes')

    const column = screen.getByText('Por hacer').closest('.max-h-full')
    await user.type(within(column).getByPlaceholderText('Añadir tarea…'), 'Nueva tarea')
    await user.click(within(column).getByRole('button', { name: 'Añadir tarea' }))

    expect(await within(column).findByText('Nueva tarea')).toBeInTheDocument()
    expect(api.post).toHaveBeenCalledWith('/lists/10/tasks', { title: 'Nueva tarea' })
  })

  it('creates a new list', async () => {
    const user = userEvent.setup()
    mockBoardGet()
    api.post.mockResolvedValue({
      data: { data: { id: 12, name: 'Nueva lista', tasks: [] } },
    })

    renderBoard()
    await screen.findByRole('heading', { name: 'Sprint 1' })

    await user.click(screen.getByRole('button', { name: 'Añadir lista' }))
    await user.type(screen.getByPlaceholderText('Nombre de la lista'), 'Nueva lista')
    await user.click(screen.getByRole('button', { name: 'Añadir lista' }))

    expect(await screen.findByText('Nueva lista')).toBeInTheDocument()
    expect(api.post).toHaveBeenCalledWith('/boards/5/lists', { name: 'Nueva lista' })
  })

  it('renames the board with Enter', async () => {
    const user = userEvent.setup()
    mockBoardGet()
    api.patch.mockResolvedValue({ data: { data: { ...buildBoard(), name: 'Sprint 2' } } })

    renderBoard()
    await screen.findByRole('heading', { name: 'Sprint 1' })

    await user.click(screen.getByRole('heading', { name: 'Sprint 1' }))
    const input = screen.getByDisplayValue('Sprint 1')
    await user.clear(input)
    await user.type(input, 'Sprint 2{Enter}')

    expect(await screen.findByRole('heading', { name: 'Sprint 2' })).toBeInTheDocument()
    expect(api.patch).toHaveBeenCalledWith('/workspaces/1/boards/5', { name: 'Sprint 2' })
  })

  it('deletes a list by confirming the dialog', async () => {
    const user = userEvent.setup()
    mockBoardGet()
    api.delete.mockResolvedValue({ data: {} })

    renderBoard()
    await screen.findByText('Preparar wireframes')

    await user.click(screen.getByRole('button', { name: 'Acciones de Por hacer' }))
    await user.click(screen.getByRole('button', { name: 'Eliminar' }))

    const dialog = screen.getByRole('dialog', { name: 'Eliminar lista' })
    expect(dialog).toHaveTextContent('Se eliminarán la lista "Por hacer" y sus 1 tareas.')

    await user.click(within(dialog).getByRole('button', { name: 'Eliminar lista' }))

    await waitFor(() => expect(screen.queryByText('Por hacer')).not.toBeInTheDocument())
    expect(api.delete).toHaveBeenCalledWith('/boards/5/lists/10')
  })

  it('opens a task, saves changes and updates the board', async () => {
    const user = userEvent.setup()
    mockBoardGet()
    api.patch.mockResolvedValue({
      data: { data: { ...TASK, title: 'Wireframes listos' } },
    })

    renderBoard()
    await user.click(await screen.findByText('Preparar wireframes'))

    expect(
      await screen.findByRole('dialog', { name: 'Detalle de la tarea' }),
    ).toBeInTheDocument()

    const title = screen.getByLabelText('Título')
    await user.clear(title)
    await user.type(title, 'Wireframes listos')
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    await waitFor(() => expect(screen.getByText('Wireframes listos')).toBeInTheDocument())
    expect(api.patch).toHaveBeenCalledWith('/tasks/100', {
      title: 'Wireframes listos',
      description: TASK.description,
      priority: TASK.priority,
      due_date: null,
      assigned_to: 2,
      completed: false,
    })
  })
})
