import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NotificationMuteButton } from '../NotificationMuteButton.jsx'
import { api } from '../../../lib/api.js'

vi.mock('../../../lib/api', async (importOriginal) => {
  const actual = await importOriginal()

  return {
    ...actual,
    api: {
      get: vi.fn(),
      post: vi.fn(),
      delete: vi.fn(),
    },
  }
})

const MUTE = {
  id: 9,
  type: 'workspace',
  target_id: 1,
  name: 'Producto',
  created_at: '2026-10-20T10:00:00Z',
}

describe('NotificationMuteButton', () => {
  beforeEach(() => {
    api.get.mockReset()
    api.post.mockReset()
    api.delete.mockReset()
  })

  it('mutes a workspace and switches to the reactivate action', async () => {
    const user = userEvent.setup()

    api.get.mockResolvedValue({ data: { data: [], mutes: [] } })
    api.post.mockResolvedValue({ data: { data: MUTE } })

    render(<NotificationMuteButton targetType="workspace" targetId={1} />)

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

  it('reactivates a muted board', async () => {
    const user = userEvent.setup()
    const boardMute = { ...MUTE, id: 10, type: 'board', target_id: 5 }

    api.get.mockResolvedValue({ data: { data: [], mutes: [boardMute] } })
    api.delete.mockResolvedValue({})

    render(<NotificationMuteButton targetType="board" targetId={5} />)

    const button = await screen.findByRole('button', { name: 'Reactivar notificaciones' })

    await waitFor(() => expect(button).not.toBeDisabled())
    await user.click(button)

    expect(api.delete).toHaveBeenCalledWith('/notifications/mutes/10')
    expect(await screen.findByRole('button', { name: 'Silenciar tablero' })).toBeInTheDocument()
  })

  it('reports an error when the mute cannot be saved', async () => {
    const user = userEvent.setup()
    const onError = vi.fn()

    api.get.mockResolvedValue({ data: { data: [], mutes: [] } })
    api.post.mockRejectedValue({
      response: { status: 500, data: { message: 'No se pudo silenciar.' } },
    })

    render(<NotificationMuteButton targetType="workspace" targetId={1} onError={onError} />)

    const button = await screen.findByRole('button', { name: 'Silenciar workspace' })

    await waitFor(() => expect(button).not.toBeDisabled())
    await user.click(button)

    await waitFor(() =>
      expect(onError).toHaveBeenCalledWith('No se pudieron actualizar las notificaciones.'),
    )
  })
})
