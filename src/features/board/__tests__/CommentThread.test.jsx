import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CommentThread } from '../CommentThread.jsx'
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

const COMMENTS = [
  {
    id: 1,
    body: 'Comentario de Ana',
    author: { id: 1, name: 'Ana Propietaria' },
    created_at: '2026-10-19T10:00:00',
  },
  {
    id: 2,
    body: 'Comentario de Beto',
    author: { id: 2, name: 'Beto Miembro' },
    created_at: '2026-10-19T11:00:00',
  },
]

function renderThread(props = {}) {
  const onCountChange = vi.fn()

  render(
    <CommentThread
      taskId={100}
      currentUserId={1}
      isAdmin={false}
      onCountChange={onCountChange}
      {...props}
    />,
  )

  return { onCountChange }
}

describe('CommentThread', () => {
  beforeEach(() => {
    api.get.mockReset()
    api.post.mockReset()
    api.delete.mockReset()
  })

  it('loads and displays comments', async () => {
    api.get.mockResolvedValue({ data: { data: COMMENTS } })

    renderThread()

    expect(await screen.findByText('Comentario de Ana')).toBeInTheDocument()
    expect(screen.getByText('Comentario de Beto')).toBeInTheDocument()
    expect(screen.getByText('Ana Propietaria')).toBeInTheDocument()
    expect(api.get).toHaveBeenCalledWith('/tasks/100/comments')
  })

  it('shows the empty state', async () => {
    api.get.mockResolvedValue({ data: { data: [] } })

    renderThread()

    expect(await screen.findByText('Todavía no hay comentarios.')).toBeInTheDocument()
  })

  it('only allows the author or admin to delete', async () => {
    api.get.mockResolvedValue({ data: { data: COMMENTS } })

    renderThread({ currentUserId: 1, isAdmin: false })

    await screen.findByText('Comentario de Ana')

    expect(screen.getAllByRole('button', { name: 'Eliminar' })).toHaveLength(1)
  })

  it('the admin can delete all comments', async () => {
    api.get.mockResolvedValue({ data: { data: COMMENTS } })

    renderThread({ currentUserId: 99, isAdmin: true })

    await screen.findByText('Comentario de Ana')

    expect(screen.getAllByRole('button', { name: 'Eliminar' })).toHaveLength(2)
  })

  it('posts a comment trimming whitespace', async () => {
    const user = userEvent.setup()
    const created = {
      id: 3,
      body: 'Nuevo comentario',
      author: { id: 1, name: 'Ana Propietaria' },
      created_at: '2026-10-19T12:00:00',
    }

    api.get.mockResolvedValue({ data: { data: [] } })
    api.post.mockResolvedValue({ data: { data: created } })

    const { onCountChange } = renderThread()
    await screen.findByText('Todavía no hay comentarios.')

    await user.type(screen.getByPlaceholderText('Escribe un comentario…'), '  Nuevo comentario  ')
    await user.click(screen.getByRole('button', { name: 'Enviar' }))

    expect(await screen.findByText('Nuevo comentario')).toBeInTheDocument()
    expect(api.post).toHaveBeenCalledWith('/tasks/100/comments', {
      body: 'Nuevo comentario',
    })
    expect(screen.getByPlaceholderText('Escribe un comentario…')).toHaveValue('')
    expect(onCountChange).toHaveBeenCalledTimes(1)
  })

  it('does not submit empty comments', async () => {
    const user = userEvent.setup()
    api.get.mockResolvedValue({ data: { data: [] } })

    renderThread()
    await screen.findByText('Todavía no hay comentarios.')

    expect(screen.getByRole('button', { name: 'Enviar' })).toBeDisabled()

    await user.type(screen.getByPlaceholderText('Escribe un comentario…'), '   ')

    expect(screen.getByRole('button', { name: 'Enviar' })).toBeDisabled()
    expect(api.post).not.toHaveBeenCalled()
  })

  it('deletes your own comment', async () => {
    const user = userEvent.setup()
    api.get.mockResolvedValue({ data: { data: COMMENTS } })
    api.delete.mockResolvedValue({ data: {} })

    const { onCountChange } = renderThread()

    await screen.findByText('Comentario de Ana')
    await user.click(screen.getByRole('button', { name: 'Eliminar' }))

    await screen.findByText('Comentario de Beto')
    expect(screen.queryByText('Comentario de Ana')).not.toBeInTheDocument()
    expect(api.delete).toHaveBeenCalledWith('/comments/1')
    expect(onCountChange).toHaveBeenCalledTimes(1)
  })

  it('shows the loading error', async () => {
    api.get.mockRejectedValue({
      response: { status: 500, data: { message: 'No se pudieron cargar' } },
    })

    renderThread()

    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudieron cargar')
  })
})
