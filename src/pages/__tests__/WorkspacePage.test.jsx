import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { WorkspacePage } from '../WorkspacePage.jsx'
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

const USER = { id: 1, name: 'Ana Propietaria', email: 'ana@taskflow.test' }

const WORKSPACE = {
  id: 1,
  name: 'Producto',
  description: 'Equipo de producto',
  role: 'admin',
  owner: { id: 1, name: 'Ana Propietaria' },
  members_count: 1,
  boards_count: 1,
}

const BOARD = {
  id: 5,
  name: 'Sprint 1',
  description: 'Tablero principal',
  color: '#6366f1',
  lists_count: 2,
}

const MEMBERS = [
  {
    id: 1,
    name: 'Ana Propietaria',
    email: 'ana@taskflow.test',
    role: 'admin',
    avatar: null,
  },
]

function mockWorkspace(mutes = []) {
  api.get.mockImplementation((url) => {
    if (url === '/workspaces/1') {
      return Promise.resolve({ data: { data: WORKSPACE } })
    }

    if (url === '/workspaces/1/boards') {
      return Promise.resolve({ data: { data: [BOARD] } })
    }

    if (url === '/workspaces/1/members') {
      return Promise.resolve({ data: { data: MEMBERS } })
    }

    if (url === '/notifications/preferences') {
      return Promise.resolve({ data: { data: [], mutes } })
    }

    return Promise.reject(new Error(`URL no mockeada: ${url}`))
  })
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/workspaces/1']}>
      <AuthContext.Provider value={{ user: USER, status: 'authenticated' }}>
        <Routes>
          <Route path="/workspaces/:workspaceId" element={<WorkspacePage />} />
        </Routes>
      </AuthContext.Provider>
    </MemoryRouter>,
  )
}

describe('WorkspacePage notifications', () => {
  beforeEach(() => {
    api.get.mockReset()
    api.post.mockReset()
    api.patch.mockReset()
    api.delete.mockReset()
  })

  it('mutes the workspace from the header', async () => {
    const user = userEvent.setup()

    mockWorkspace()
    api.post.mockResolvedValue({
      data: {
        data: { id: 9, type: 'workspace', target_id: 1, name: 'Producto' },
      },
    })

    renderPage()

    expect(await screen.findByRole('heading', { name: 'Producto' })).toBeInTheDocument()

    const button = await screen.findByRole('button', { name: 'Silenciar workspace' })

    await waitFor(() => expect(button).not.toBeDisabled())
    await user.click(button)

    expect(api.post).toHaveBeenCalledWith('/notifications/mutes', {
      target_type: 'workspace',
      target_id: 1,
    })
    expect(
      await screen.findByRole('button', { name: 'Reactivar notificaciones' }),
    ).toBeInTheDocument()
  })

  it('reactivates a muted workspace', async () => {
    const user = userEvent.setup()

    mockWorkspace([
      { id: 9, type: 'workspace', target_id: 1, name: 'Producto' },
    ])
    api.delete.mockResolvedValue({})

    renderPage()

    const button = await screen.findByRole('button', {
      name: 'Reactivar notificaciones',
    })

    await waitFor(() => expect(button).not.toBeDisabled())
    await user.click(button)

    expect(api.delete).toHaveBeenCalledWith('/notifications/mutes/9')
    expect(
      await screen.findByRole('button', { name: 'Silenciar workspace' }),
    ).toBeInTheDocument()
  })

  it('shows an alert when the workspace mute cannot be saved', async () => {
    const user = userEvent.setup()

    mockWorkspace()
    api.post.mockRejectedValue({
      response: { status: 500, data: { message: 'No se pudo silenciar.' } },
    })

    renderPage()

    const button = await screen.findByRole('button', { name: 'Silenciar workspace' })

    await waitFor(() => expect(button).not.toBeDisabled())
    await user.click(button)

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No se pudieron actualizar las notificaciones.',
    )
  })
})
