import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NotificationBell } from '../NotificationBell.jsx'
import { AuthContext } from '../../../context/AuthContext.jsx'
import { api } from '../../../lib/api.js'

const realtime = vi.hoisted(() => ({ handlers: [] }))

vi.mock('../../../lib/realtime', () => ({
  getEcho: () => ({
    private: () => ({
      notification: (handler) => realtime.handlers.push(handler),
    }),
    leave: () => {},
  }),
}))

vi.mock('../../../lib/api', async (importOriginal) => {
  const actual = await importOriginal()

  return {
    ...actual,
    api: {
      get: vi.fn(),
      post: vi.fn(),
      patch: vi.fn(),
    },
  }
})

const ASSIGNED = {
  id: 'notification-1',
  type: 'TaskAssigned',
  payload: {
    type: 'task_assigned',
    task_id: 100,
    board_id: 5,
    workspace_id: 1,
    title: 'Preparar wireframes',
    actor: 'Beto Miembro',
  },
  read_at: null,
  is_read: false,
  created_at: new Date(Date.now() - 5 * 60_000).toISOString(),
}

const COMMENTED = {
  id: 'notification-2',
  type: 'TaskCommented',
  payload: {
    type: 'comment_added',
    task_id: 101,
    title: 'Diseñar la landing',
    actor: 'Ana Propietaria',
    excerpt: '¿Revisaste los últimos cambios?',
  },
  read_at: new Date().toISOString(),
  is_read: true,
  created_at: new Date(Date.now() - 60 * 60_000).toISOString(),
}

const ATTACHMENT = {
  id: 'notification-3',
  type: 'AttachmentAdded',
  payload: {
    type: 'attachment_added',
    task_id: 102,
    board_id: 5,
    workspace_id: 1,
    title: 'Diseñar la landing',
    actor: 'Ana Propietaria',
    attachment_name: 'mockup.png',
    mime_type: 'image/png',
  },
  read_at: new Date().toISOString(),
  is_read: true,
  created_at: new Date(Date.now() - 30 * 60_000).toISOString(),
}

function response(items = [ASSIGNED, COMMENTED], meta = null) {
  return {
    data: {
      data: items,
      unread_count: items.filter((notification) => !notification.is_read).length,
      meta: meta ?? {
        current_page: 1,
        last_page: 1,
        total: items.length,
      },
    },
  }
}

function BoardProbe() {
  const location = useLocation()

  return (
    <div>
      Tablero {location.pathname}
      {location.search}
    </div>
  )
}

function renderBell() {
  return render(
    <AuthContext.Provider
      value={{
        user: { id: 1, name: 'Ana Propietaria' },
        status: 'authenticated',
      }}
    >
      <MemoryRouter initialEntries={['/workspaces']}>
        <Routes>
          <Route path="/workspaces" element={<NotificationBell />} />
          <Route
            path="/workspaces/:workspaceId/boards/:boardId"
            element={<BoardProbe />}
          />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  )
}

async function openPanel(user) {
  await user.click(await screen.findByRole('button', { name: /^Notificaciones/ }))

  return screen.getByRole('dialog', { name: 'Notificaciones' })
}

describe('NotificationBell', () => {
  beforeEach(() => {
    api.get.mockReset()
    api.post.mockReset()
    api.patch.mockReset()
    realtime.handlers.length = 0
  })

  it('shows the unread badge and the latest notifications', async () => {
    const user = userEvent.setup()
    api.get.mockResolvedValue(response())

    renderBell()

    expect(
      await screen.findByRole('button', { name: 'Notificaciones, 1 sin leer' }),
    ).toBeInTheDocument()

    const panel = await openPanel(user)

    expect(within(panel).getByText('1 sin leer')).toBeInTheDocument()
    expect(within(panel).getByText('Te asignaron una tarea')).toBeInTheDocument()
    expect(
      within(panel).getByText('Beto Miembro te asignó “Preparar wireframes”.'),
    ).toBeInTheDocument()
    expect(within(panel).getByText('Nuevo comentario')).toBeInTheDocument()
    expect(within(panel).getByText('¿Revisaste los últimos cambios?')).toBeInTheDocument()
    expect(within(panel).getAllByLabelText('Sin leer')).toHaveLength(1)
  })

  it('renders attachment notifications', async () => {
    const user = userEvent.setup()
    api.get.mockResolvedValue(response([ATTACHMENT]))

    renderBell()
    const panel = await openPanel(user)

    expect(within(panel).getByText('Nuevo adjunto')).toBeInTheDocument()
    expect(
      within(panel).getByText(
        'Ana Propietaria adjuntó un archivo a “Diseñar la landing”.',
      ),
    ).toBeInTheDocument()
    expect(within(panel).getByText('mockup.png')).toBeInTheDocument()
  })

  it('marks a notification as read and opens its task', async () => {
    const user = userEvent.setup()
    api.get.mockResolvedValue(response())
    api.patch.mockResolvedValue({ data: { data: { ...ASSIGNED, is_read: true } } })

    renderBell()
    const panel = await openPanel(user)

    await user.click(
      within(panel).getByRole('button', {
        name: /Beto Miembro te asignó “Preparar wireframes”/,
      }),
    )

    expect(api.patch).toHaveBeenCalledWith('/notifications/notification-1/read')
    expect(
      await screen.findByText(/Tablero \/workspaces\/1\/boards\/5\?task=100/),
    ).toBeInTheDocument()
  })

  it('marks all notifications as read', async () => {
    const user = userEvent.setup()
    const unread = [ASSIGNED, { ...COMMENTED, is_read: false, read_at: null }]
    api.get.mockResolvedValue(response(unread))
    api.post.mockResolvedValue({ data: {} })

    renderBell()

    expect(
      await screen.findByRole('button', { name: 'Notificaciones, 2 sin leer' }),
    ).toBeInTheDocument()

    const panel = await openPanel(user)

    await user.click(
      within(panel).getByRole('button', { name: 'Marcar todas como leídas' }),
    )

    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith('/notifications/read-all'),
    )
    expect(
      screen.getByRole('button', { name: 'Notificaciones' }),
    ).toBeInTheDocument()
    expect(within(panel).getByText('Todo al día')).toBeInTheDocument()
    expect(within(panel).queryAllByLabelText('Sin leer')).toHaveLength(0)
  })

  it('adds notifications pushed by Reverb', async () => {
    const user = userEvent.setup()
    const incoming = {
      ...ASSIGNED,
      id: 'notification-realtime',
      created_at: new Date().toISOString(),
    }

    api.get
      .mockResolvedValueOnce(response([]))
      .mockResolvedValueOnce(response([incoming]))

    renderBell()
    await screen.findByRole('button', { name: 'Notificaciones' })

    act(() => {
      realtime.handlers.forEach((handler) => handler(incoming))
      realtime.handlers.forEach((handler) => handler(incoming))
    })

    expect(
      await screen.findByRole('button', { name: 'Notificaciones, 1 sin leer' }),
    ).toBeInTheDocument()

    const panel = await openPanel(user)

    expect(within(panel).getByText('Te asignaron una tarea')).toBeInTheDocument()
    expect(within(panel).getAllByLabelText('Sin leer')).toHaveLength(1)
  })

  it('loads more notifications', async () => {
    const user = userEvent.setup()
    const nextPage = { ...COMMENTED, id: 'notification-3' }

    api.get.mockImplementation((url, config) =>
      Promise.resolve(
        config.params.page === 2
          ? response([nextPage], { current_page: 2, last_page: 2, total: 2 })
          : response([ASSIGNED], { current_page: 1, last_page: 2, total: 2 }),
      ),
    )

    renderBell()
    const panel = await openPanel(user)

    await user.click(within(panel).getByRole('button', { name: 'Cargar más' }))

    expect(await within(panel).findByText('Nuevo comentario')).toBeInTheDocument()
    expect(api.get).toHaveBeenLastCalledWith('/notifications', {
      params: { page: 2, per_page: 10 },
    })
  })

  it('shows the empty and error states', async () => {
    const user = userEvent.setup()
    api.get.mockResolvedValue(response([]))

    const { unmount } = renderBell()
    const panel = await openPanel(user)

    expect(within(panel).getByText('No tienes notificaciones.')).toBeInTheDocument()

    unmount()
    api.get.mockRejectedValue({
      response: { status: 500, data: { message: 'No se pudieron cargar' } },
    })

    renderBell()
    const errorPanel = await openPanel(user)

    expect(await within(errorPanel).findByRole('alert')).toHaveTextContent(
      'No se pudieron cargar',
    )
  })

  it('closes with Escape', async () => {
    const user = userEvent.setup()
    api.get.mockResolvedValue(response())

    renderBell()
    await openPanel(user)

    await user.keyboard('{Escape}')

    expect(
      screen.queryByRole('dialog', { name: 'Notificaciones' }),
    ).not.toBeInTheDocument()
  })
})
