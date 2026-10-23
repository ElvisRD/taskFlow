import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NotificationSettingsPage } from '../NotificationSettingsPage.jsx'
import { api } from '../../lib/api.js'

vi.mock('../../lib/api', async (importOriginal) => {
  const actual = await importOriginal()

  return {
    ...actual,
    api: {
      get: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
    },
  }
})

const PREFERENCES = [
  {
    type: 'task_assigned',
    label: 'Tarea asignada',
    in_app: true,
    email: true,
  },
  {
    type: 'comment_added',
    label: 'Nuevo comentario',
    in_app: true,
    email: false,
  },
  {
    type: 'task_overdue',
    label: 'Tarea vencida',
    in_app: false,
    email: false,
  },
]

const MUTES = [
  {
    id: 7,
    type: 'workspace',
    target_id: 1,
    name: 'Producto',
    created_at: '2026-10-20T10:00:00Z',
  },
  {
    id: 8,
    type: 'board',
    target_id: 5,
    workspace_id: 1,
    name: 'Sprint 1',
    created_at: '2026-10-20T10:00:00Z',
  },
]

function renderPage() {
  return render(
    <MemoryRouter>
      <NotificationSettingsPage />
    </MemoryRouter>,
  )
}

function mockPreferences(preferences = PREFERENCES, mutes = MUTES) {
  api.get.mockResolvedValue({ data: { data: preferences, mutes } })
}

describe('NotificationSettingsPage', () => {
  beforeEach(() => {
    api.get.mockReset()
    api.patch.mockReset()
    api.delete.mockReset()
  })

  it('shows every notification type with its channels and active mutes', async () => {
    mockPreferences()

    renderPage()

    expect(
      await screen.findByRole('heading', { name: 'Notificaciones' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Tarea asignada')).toBeInTheDocument()
    expect(screen.getByText('Nuevo comentario')).toBeInTheDocument()
    expect(screen.getByText('Tarea vencida')).toBeInTheDocument()

    const inApp = screen.getByRole('switch', { name: 'Tarea asignada en la app' })
    const email = screen.getByRole('switch', { name: 'Tarea asignada por email' })
    const disabled = screen.getByRole('switch', { name: 'Tarea vencida en la app' })

    expect(inApp).toHaveAttribute('aria-checked', 'true')
    expect(email).toHaveAttribute('aria-checked', 'true')
    expect(disabled).toHaveAttribute('aria-checked', 'false')
    expect(screen.getByText('Desactivada')).toBeInTheDocument()

    expect(screen.getByText('Producto')).toBeInTheDocument()
    expect(screen.getByText('Sprint 1')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Reactivar notificaciones de Producto' }),
    ).toBeInTheDocument()
  })

  it('updates an in-app preference and keeps the switch in sync', async () => {
    const user = userEvent.setup()

    mockPreferences()
    api.patch.mockResolvedValue({
      data: { data: { ...PREFERENCES[0], in_app: false } },
    })

    renderPage()

    const toggle = await screen.findByRole('switch', {
      name: 'Tarea asignada en la app',
    })

    await user.click(toggle)

    expect(api.patch).toHaveBeenCalledWith('/notifications/preferences/task_assigned', {
      in_app: false,
    })
    await waitFor(() => expect(toggle).toHaveAttribute('aria-checked', 'false'))
  })

  it('rolls back the switch and shows the API error when saving fails', async () => {
    const user = userEvent.setup()

    mockPreferences()
    api.patch.mockRejectedValue({
      response: { status: 500, data: { message: 'No se pudo guardar.' } },
    })

    renderPage()

    const toggle = await screen.findByRole('switch', {
      name: 'Tarea asignada por email',
    })

    await user.click(toggle)

    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo guardar.')
    await waitFor(() => expect(toggle).toHaveAttribute('aria-checked', 'true'))
  })

  it('removes a mute when the user reactivates notifications', async () => {
    const user = userEvent.setup()

    mockPreferences()
    api.delete.mockResolvedValue({})

    renderPage()

    await user.click(
      await screen.findByRole('button', {
        name: 'Reactivar notificaciones de Producto',
      }),
    )

    expect(api.delete).toHaveBeenCalledWith('/notifications/mutes/7')
    await waitFor(() => expect(screen.queryByText('Producto')).not.toBeInTheDocument())
  })

  it('updates an email preference independently', async () => {
    const user = userEvent.setup()

    mockPreferences()
    api.patch.mockResolvedValue({
      data: { data: { ...PREFERENCES[0], email: false } },
    })

    renderPage()

    const toggle = await screen.findByRole('switch', {
      name: 'Tarea asignada por email',
    })

    await user.click(toggle)

    expect(api.patch).toHaveBeenCalledWith('/notifications/preferences/task_assigned', {
      email: false,
    })
    await waitFor(() => expect(toggle).toHaveAttribute('aria-checked', 'false'))
  })

  it('rolls back a mute removal and shows the API error', async () => {
    const user = userEvent.setup()

    mockPreferences()
    api.delete.mockRejectedValue({
      response: { status: 500, data: { message: 'No se pudo reactivar.' } },
    })

    renderPage()

    await user.click(
      await screen.findByRole('button', {
        name: 'Reactivar notificaciones de Producto',
      }),
    )

    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo reactivar.')
    expect(await screen.findByText('Producto')).toBeInTheDocument()
  })

  it('shows the load error and lets the user retry', async () => {
    const user = userEvent.setup()

    api.get
      .mockRejectedValueOnce({
        response: { status: 500, data: { message: 'No se pudieron cargar.' } },
      })
      .mockResolvedValueOnce({ data: { data: PREFERENCES, mutes: [] } })

    renderPage()

    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudieron cargar.')

    await user.click(screen.getByRole('button', { name: 'Reintentar' }))

    expect(await screen.findByText('Tarea asignada')).toBeInTheDocument()
  })
})
