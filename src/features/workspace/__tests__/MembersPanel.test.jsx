import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MembersPanel } from '../MembersPanel.jsx'
import { api } from '../../../lib/api.js'

vi.mock('../../../lib/api', async (importOriginal) => {
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

const MEMBERS = Array.from({ length: 20 }, (_, index) => ({
  id: index + 1,
  name: `Miembro ${index + 1}`,
  email: `miembro${index + 1}@taskflow.test`,
  avatar: null,
  role: 'member',
}))

describe('MembersPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('limits the list height and scrolls when there are many members', async () => {
    api.get.mockResolvedValue({ data: { data: MEMBERS } })

    render(<MembersPanel workspaceId={1} canManage={false} ownerId={1} />)

    const list = await screen.findByRole('list')

    expect(list).toHaveClass('max-h-96', 'overflow-y-auto', 'overscroll-contain')
    expect(within(list).getAllByRole('listitem')).toHaveLength(20)
    expect(screen.getByText('20 personas en este workspace.')).toBeInTheDocument()
  })

  it('shows each member name', async () => {
    api.get.mockResolvedValue({ data: { data: MEMBERS } })

    render(<MembersPanel workspaceId={1} canManage={false} ownerId={1} />)

    expect(await screen.findByText('Miembro 1')).toBeInTheDocument()
    expect(screen.getByText('Miembro 20')).toBeInTheDocument()
    expect(screen.getAllByText('Propietario')).toHaveLength(1)
  })

  it('removes a member and reassigns their tasks to another member', async () => {
    const user = userEvent.setup()

    api.get.mockResolvedValue({ data: { data: MEMBERS } })
    api.delete.mockResolvedValue({})

    render(<MembersPanel workspaceId={1} canManage ownerId={1} />)

    const row = (await screen.findByText('Miembro 2')).closest('li')
    await user.click(within(row).getByRole('button', { name: 'Quitar' }))

    const dialog = screen.getByRole('dialog')
    await user.selectOptions(screen.getByLabelText('Reasignar tareas a'), '3')
    await user.click(within(dialog).getByRole('button', { name: 'Quitar miembro' }))

    expect(api.delete).toHaveBeenCalledWith('/workspaces/1/members/2', {
      data: { reassign_to: 3 },
    })
    expect(
      await screen.findByText('Miembro 2 fue eliminado y sus tareas se reasignaron a Miembro 3.'),
    ).toBeInTheDocument()
    expect(screen.queryByText('Miembro 2')).not.toBeInTheDocument()
  })

  it('removes a member leaving their tasks unassigned by default', async () => {
    const user = userEvent.setup()

    api.get.mockResolvedValue({ data: { data: MEMBERS } })
    api.delete.mockResolvedValue({})

    render(<MembersPanel workspaceId={1} canManage ownerId={1} />)

    const row = (await screen.findByText('Miembro 2')).closest('li')
    await user.click(within(row).getByRole('button', { name: 'Quitar' }))

    const dialog = screen.getByRole('dialog')
    await user.click(within(dialog).getByRole('button', { name: 'Quitar miembro' }))

    expect(api.delete).toHaveBeenCalledWith('/workspaces/1/members/2', {
      data: { reassign_to: null },
    })
  })
})
