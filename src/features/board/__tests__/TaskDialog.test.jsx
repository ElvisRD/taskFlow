import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TaskDialog } from '../TaskDialog.jsx'
import { api } from '../../../lib/api.js'

vi.mock('../../../lib/api', async (importOriginal) => {
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

vi.mock('../CommentThread.jsx', () => ({
  CommentThread: () => <div>Hilo de comentarios</div>,
}))

vi.mock('../AttachmentList.jsx', () => ({
  AttachmentList: () => <div>Lista de adjuntos</div>,
}))

const TASK = {
  id: 101,
  title: 'Diseñar la landing',
  description: 'Una descripción inicial',
  priority: 'high',
  due_date: '2026-10-30',
  is_completed: false,
  creator: { id: 1 },
  assignee: { id: 2, name: 'Beto Miembro' },
}

const MEMBERS = [
  { id: 1, name: 'Ana Propietaria' },
  { id: 2, name: 'Beto Miembro' },
]

function renderDialog(overrides = {}) {
  const props = {
    open: true,
    task: TASK,
    members: MEMBERS,
    currentUserId: 1,
    isAdmin: false,
    onClose: vi.fn(),
    onUpdated: vi.fn(),
    onDeleted: vi.fn(),
    onCountsChanged: vi.fn(),
    ...overrides,
  }

  return { ...render(<TaskDialog {...props} />), props }
}

describe('TaskDialog', () => {
  beforeEach(() => {
    api.patch.mockReset()
    api.delete.mockReset()
  })

  it('renders nothing when closed or there is no task', () => {
    const { rerender } = render(
      <TaskDialog open={false} task={TASK} onClose={vi.fn()} onUpdated={vi.fn()} />,
    )

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    rerender(<TaskDialog open task={null} onClose={vi.fn()} onUpdated={vi.fn()} />)

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('initializes the form with the task data', () => {
    renderDialog()

    expect(screen.getByRole('dialog', { name: 'Detalle de la tarea' })).toBeInTheDocument()
    expect(screen.getByLabelText('Título')).toHaveValue(TASK.title)
    expect(screen.getByLabelText('Descripción')).toHaveValue(TASK.description)
    expect(screen.getByLabelText('Prioridad')).toHaveValue('high')
    expect(screen.getByLabelText('Fecha límite')).toHaveValue(TASK.due_date)
    expect(screen.getByLabelText('Asignada a')).toHaveValue('2')
    expect(screen.getByLabelText('Marcar como completada')).not.toBeChecked()
  })

  it('saves changes normalizing empty fields', async () => {
    const user = userEvent.setup()
    const updatedTask = { ...TASK, title: 'Nuevo título' }
    api.patch.mockResolvedValue({ data: { data: updatedTask } })

    const { props } = renderDialog()

    const title = screen.getByLabelText('Título')
    await user.clear(title)
    await user.type(title, '  Nuevo título  ')

    const description = screen.getByLabelText('Descripción')
    await user.clear(description)
    await user.type(description, '  Nueva descripción  ')

    await user.selectOptions(screen.getByLabelText('Prioridad'), 'urgent')
    await user.clear(screen.getByLabelText('Fecha límite'))
    await user.selectOptions(screen.getByLabelText('Asignada a'), '')
    await user.click(screen.getByLabelText('Marcar como completada'))
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    expect(api.patch).toHaveBeenCalledWith('/tasks/101', {
      title: 'Nuevo título',
      description: 'Nueva descripción',
      priority: 'urgent',
      due_date: null,
      assigned_to: null,
      completed: true,
    })
    expect(props.onUpdated).toHaveBeenCalledWith(updatedTask)
  })

  it('shows validation errors per field', async () => {
    const user = userEvent.setup()
    api.patch.mockRejectedValue({
      response: {
        status: 422,
        data: {
          message: 'Datos inválidos',
          errors: { title: ['El título es obligatorio.'] },
        },
      },
    })

    renderDialog()
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    expect(await screen.findByText('El título es obligatorio.')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('shows a general error when saving', async () => {
    const user = userEvent.setup()
    api.patch.mockRejectedValue({
      response: { status: 500, data: { message: 'No se pudo guardar' } },
    })

    renderDialog()
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo guardar')
  })

  it('does not save an empty title', async () => {
    const user = userEvent.setup()
    renderDialog()

    await user.clear(screen.getByLabelText('Título'))
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    expect(await screen.findByText('El título no es válido.')).toBeInTheDocument()
    expect(api.patch).not.toHaveBeenCalled()
  })

  it('validates title and description length limits', async () => {
    const user = userEvent.setup()
    renderDialog()

    fireEvent.change(screen.getByLabelText('Título'), {
      target: { value: 'a'.repeat(81) },
    })
    fireEvent.change(screen.getByLabelText('Descripción'), {
      target: { value: 'b'.repeat(1001) },
    })

    expect(
      screen.getByText('El título no puede superar los 80 caracteres.'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('La descripción no puede superar los 1000 caracteres.'),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    expect(api.patch).not.toHaveBeenCalled()
  })

  it('allows the creator to delete the task', async () => {
    const user = userEvent.setup()
    api.delete.mockResolvedValue({ data: {} })

    const { props } = renderDialog({ task: { ...TASK, creator: { id: 1 } } })

    await user.click(screen.getByRole('button', { name: 'Eliminar tarea' }))

    const confirmDialog = screen.getByRole('dialog', { name: 'Eliminar tarea' })
    await user.click(within(confirmDialog).getByRole('button', { name: 'Eliminar' }))

    expect(api.delete).toHaveBeenCalledWith('/tasks/101')
    expect(props.onDeleted).toHaveBeenCalledWith(101)
  })

  it('allows the admin to delete a task created by another user', async () => {
    const user = userEvent.setup()
    api.delete.mockResolvedValue({ data: {} })

    renderDialog({ task: { ...TASK, creator: { id: 2 } }, isAdmin: true })

    expect(screen.getByRole('button', { name: 'Eliminar tarea' })).toBeInTheDocument()
  })

  it('does not show delete to a member who did not create the task', () => {
    renderDialog({
      task: { ...TASK, creator: { id: 2 } },
      currentUserId: 1,
      isAdmin: false,
    })

    expect(screen.queryByRole('button', { name: 'Eliminar tarea' })).not.toBeInTheDocument()
  })

  it('shows the error if deletion fails', async () => {
    const user = userEvent.setup()
    api.delete.mockRejectedValue({
      response: { status: 403, data: {} },
    })

    const { props } = renderDialog()

    await user.click(screen.getByRole('button', { name: 'Eliminar tarea' }))
    const confirmDialog = screen.getByRole('dialog', { name: 'Eliminar tarea' })
    await user.click(within(confirmDialog).getByRole('button', { name: 'Eliminar' }))

    expect(
      await screen.findByText('No tienes permisos para realizar esta acción.'),
    ).toBeInTheDocument()
    expect(props.onDeleted).not.toHaveBeenCalled()
  })
})
