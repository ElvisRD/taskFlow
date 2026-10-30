import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { InvitationsPanel } from '../InvitationsPanel.jsx'
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

const INVITATIONS = [
  {
    id: 10,
    workspace_id: 1,
    email: 'pendiente@taskflow.test',
    role: 'member',
    status: 'pending',
    expires_at: '2026-11-05T12:00:00.000Z',
    created_at: '2026-10-29T12:00:00.000Z',
  },
  {
    id: 11,
    workspace_id: 1,
    email: 'expirada@taskflow.test',
    role: 'admin',
    status: 'expired',
    expires_at: '2026-10-20T12:00:00.000Z',
    created_at: '2026-10-13T12:00:00.000Z',
  },
]

describe('InvitationsPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('lists pending and expired invitations', async () => {
    api.get.mockResolvedValue({ data: { data: INVITATIONS } })

    render(<InvitationsPanel workspaceId={1} />)

    expect(await screen.findByText('pendiente@taskflow.test')).toBeInTheDocument()
    expect(screen.getByText('expirada@taskflow.test')).toBeInTheDocument()
    expect(screen.getByText('Pendiente')).toBeInTheDocument()
    expect(screen.getByText('Expirada')).toBeInTheDocument()
    expect(screen.getByText('2 invitaciones pendientes o expiradas.')).toBeInTheDocument()
  })

  it('sends a new invitation', async () => {
    const user = userEvent.setup()
    const invitation = {
      ...INVITATIONS[0],
      id: 12,
      email: 'nueva@taskflow.test',
    }

    api.get.mockResolvedValue({ data: { data: [] } })
    api.post.mockResolvedValue({ data: { data: invitation } })

    render(<InvitationsPanel workspaceId={1} />)

    await user.click(await screen.findByRole('button', { name: 'Invitar' }))
    await user.type(screen.getByLabelText('Correo electrónico'), 'nueva@taskflow.test')
    await user.click(screen.getByRole('button', { name: 'Enviar invitación' }))

    expect(api.post).toHaveBeenCalledWith('/workspaces/1/invitations', {
      email: 'nueva@taskflow.test',
      role: 'member',
    })
    expect(await screen.findByText('Invitación enviada a nueva@taskflow.test.')).toBeInTheDocument()
    expect(screen.getByText('nueva@taskflow.test')).toBeInTheDocument()
  })

  it('resends an invitation and updates its expiration', async () => {
    const user = userEvent.setup()
    const updated = {
      ...INVITATIONS[0],
      expires_at: '2026-11-12T12:00:00.000Z',
      status: 'pending',
    }

    api.get.mockResolvedValue({ data: { data: INVITATIONS } })
    api.post.mockResolvedValue({ data: { data: updated } })

    render(<InvitationsPanel workspaceId={1} />)

    const row = (await screen.findByText('pendiente@taskflow.test')).closest('li')
    await user.click(within(row).getByRole('button', { name: 'Reenviar' }))

    expect(api.post).toHaveBeenCalledWith('/workspaces/1/invitations/10/resend')
    expect(
      await screen.findByText('Invitación reenviada a pendiente@taskflow.test.'),
    ).toBeInTheDocument()
  })

  it('revokes an invitation after confirmation', async () => {
    const user = userEvent.setup()

    api.get.mockResolvedValue({ data: { data: INVITATIONS } })
    api.delete.mockResolvedValue({})

    render(<InvitationsPanel workspaceId={1} />)

    const row = (await screen.findByText('pendiente@taskflow.test')).closest('li')
    await user.click(within(row).getByRole('button', { name: 'Revocar' }))

    const dialog = screen.getByRole('dialog')
    await user.click(within(dialog).getByRole('button', { name: 'Revocar' }))

    expect(api.delete).toHaveBeenCalledWith('/workspaces/1/invitations/10')
    expect(
      await screen.findByText('Invitación de pendiente@taskflow.test revocada.'),
    ).toBeInTheDocument()
    expect(screen.queryByText('pendiente@taskflow.test')).not.toBeInTheDocument()
  })
})
