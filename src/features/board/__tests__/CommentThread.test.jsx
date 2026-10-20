import { render, screen, within } from '@testing-library/react'
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

const SINGLE_REPLY = {
  id: 11,
  parent_id: 1,
  body: 'Respuesta única',
  author: { id: 2, name: 'Beto Miembro' },
  created_at: '2026-10-19T10:30:00',
}

const COMMENT_WITH_ONE_REPLY = {
  ...COMMENTS[0],
  replies: [SINGLE_REPLY],
}

const COMMENT_WITH_TWO_REPLIES = {
  ...COMMENTS[0],
  replies: [
    SINGLE_REPLY,
    {
      id: 12,
      parent_id: 1,
      body: 'Segunda respuesta',
      author: { id: 3, name: 'Carla Invitada' },
      created_at: '2026-10-19T10:45:00',
    },
  ],
}

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

  it('shows a single reply without a toggle', async () => {
    api.get.mockResolvedValue({ data: { data: [COMMENT_WITH_ONE_REPLY] } })

    renderThread()

    expect(await screen.findByText('Respuesta única')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Ver respuestas' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Ocultar respuestas' })).not.toBeInTheDocument()
  })

  it('hides multiple replies until the user expands them', async () => {
    const user = userEvent.setup()
    api.get.mockResolvedValue({ data: { data: [COMMENT_WITH_TWO_REPLIES] } })

    renderThread()

    await screen.findByText('Comentario de Ana')
    expect(screen.queryByText('Respuesta única')).not.toBeInTheDocument()
    expect(screen.queryByText('Segunda respuesta')).not.toBeInTheDocument()

    const showReplies = screen.getByRole('button', { name: 'Ver respuestas' })
    expect(showReplies).toHaveAttribute('aria-expanded', 'false')

    await user.click(showReplies)

    expect(screen.getByText('Respuesta única')).toBeInTheDocument()
    expect(screen.getByText('Segunda respuesta')).toBeInTheDocument()

    const hideReplies = screen.getByRole('button', { name: 'Ocultar respuestas' })
    expect(hideReplies).toHaveAttribute('aria-expanded', 'true')

    await user.click(hideReplies)

    expect(screen.queryByText('Respuesta única')).not.toBeInTheDocument()
    expect(screen.queryByText('Segunda respuesta')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ver respuestas' })).toBeInTheDocument()
  })

  it('does not offer replies to replies', async () => {
    api.get.mockResolvedValue({ data: { data: [COMMENT_WITH_ONE_REPLY] } })

    renderThread()

    await screen.findByText('Respuesta única')

    expect(screen.getAllByRole('button', { name: 'Responder' })).toHaveLength(1)
  })

  it('posts a reply and expands the thread', async () => {
    const user = userEvent.setup()
    const created = {
      id: 13,
      parent_id: 1,
      body: 'Respuesta nueva',
      author: { id: 1, name: 'Ana Propietaria' },
      created_at: '2026-10-19T12:00:00',
    }

    api.get.mockResolvedValue({ data: { data: [COMMENT_WITH_ONE_REPLY] } })
    api.post.mockResolvedValue({ data: { data: created } })

    const { onCountChange } = renderThread()
    await screen.findByText('Respuesta única')

    await user.click(screen.getByRole('button', { name: 'Responder' }))
    await user.type(screen.getByPlaceholderText('Escribe una respuesta…'), '  Respuesta nueva  ')

    const replyForm = screen.getByRole('form', { name: 'Responder a Ana Propietaria' })
    await user.click(within(replyForm).getByRole('button', { name: 'Enviar respuesta' }))

    expect(await screen.findByText('Respuesta nueva')).toBeInTheDocument()
    expect(screen.getByText('Respuesta única')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ocultar respuestas' })).toBeInTheDocument()
    expect(api.post).toHaveBeenCalledWith('/tasks/100/comments', {
      body: 'Respuesta nueva',
      parent_id: 1,
    })
    expect(screen.queryByPlaceholderText('Escribe una respuesta…')).not.toBeInTheDocument()
    expect(onCountChange).toHaveBeenCalledTimes(1)
  })

  it('cancels a reply', async () => {
    const user = userEvent.setup()
    api.get.mockResolvedValue({ data: { data: [COMMENTS[0]] } })

    renderThread()
    await screen.findByText('Comentario de Ana')

    await user.click(screen.getByRole('button', { name: 'Responder' }))
    expect(screen.getByPlaceholderText('Escribe una respuesta…')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(screen.queryByPlaceholderText('Escribe una respuesta…')).not.toBeInTheDocument()
    expect(api.post).not.toHaveBeenCalled()
  })

  it('deletes a reply without deleting its parent', async () => {
    const user = userEvent.setup()
    api.get.mockResolvedValue({ data: { data: [COMMENT_WITH_ONE_REPLY] } })
    api.delete.mockResolvedValue({ data: {} })

    const { onCountChange } = renderThread({ currentUserId: 2 })

    await screen.findByText('Respuesta única')

    const replyArticle = screen.getByRole('article', { name: 'Comentario de Beto Miembro' })
    await user.click(within(replyArticle).getByRole('button', { name: 'Eliminar' }))

    expect(screen.queryByText('Respuesta única')).not.toBeInTheDocument()
    expect(screen.getByText('Comentario de Ana')).toBeInTheDocument()
    expect(api.delete).toHaveBeenCalledWith('/comments/11')
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
