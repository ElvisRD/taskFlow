import { render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MembersPanel } from '../MembersPanel.jsx'
import { api } from '../../../lib/api.js'

vi.mock('../../../lib/api', async (importOriginal) => {
  const actual = await importOriginal()

  return {
    ...actual,
    api: {
      get: vi.fn(),
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
})
