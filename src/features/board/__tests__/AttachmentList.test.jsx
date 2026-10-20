import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AttachmentList } from '../AttachmentList.jsx'
import { api, downloadFile } from '../../../lib/api.js'

vi.mock('../../../lib/api', async (importOriginal) => {
  const actual = await importOriginal()

  return {
    ...actual,
    api: {
      get: vi.fn(),
      post: vi.fn(),
      delete: vi.fn(),
    },
    downloadFile: vi.fn(),
  }
})

const ATTACHMENTS = [
  {
    id: 1,
    name: 'informe.pdf',
    size: 1536,
    uploader: { id: 1, name: 'Ana Propietaria' },
    created_at: '2026-10-19T10:00:00',
  },
  {
    id: 2,
    name: 'foto.png',
    size: 2048,
    uploader: { id: 2, name: 'Beto Miembro' },
    created_at: '2026-10-19T11:00:00',
  },
]

function renderAttachments(props = {}) {
  const onCountChange = vi.fn()

  return {
    onCountChange,
    ...render(
      <AttachmentList
        taskId={100}
        currentUserId={1}
        isAdmin={false}
        onCountChange={onCountChange}
        {...props}
      />,
    ),
  }
}

describe('AttachmentList', () => {
  beforeEach(() => {
    api.get.mockReset()
    api.post.mockReset()
    api.delete.mockReset()
    downloadFile.mockReset()
  })

  it('loads and displays attachments with their size', async () => {
    api.get.mockResolvedValue({ data: { data: ATTACHMENTS } })

    renderAttachments()

    expect(await screen.findByText('informe.pdf')).toBeInTheDocument()
    expect(screen.getByText('foto.png')).toBeInTheDocument()
    expect(screen.getByText(/1\.5 KB/)).toBeInTheDocument()
    expect(api.get).toHaveBeenCalledWith('/tasks/100/attachments')
  })

  it('shows the empty state', async () => {
    api.get.mockResolvedValue({ data: { data: [] } })

    renderAttachments()

    expect(await screen.findByText('Sin archivos adjuntos.')).toBeInTheDocument()
  })

  it('only shows delete to the uploader or admin', async () => {
    api.get.mockResolvedValue({ data: { data: ATTACHMENTS } })

    const { rerender } = renderAttachments()
    await screen.findByText('informe.pdf')

    expect(screen.getAllByRole('button', { name: /^Eliminar / })).toHaveLength(1)

    rerender(
      <AttachmentList taskId={100} currentUserId={99} isAdmin onCountChange={vi.fn()} />,
    )

    expect(await screen.findAllByRole('button', { name: /^Eliminar / })).toHaveLength(2)
  })

  it('downloads a protected attachment', async () => {
    const user = userEvent.setup()
    api.get.mockResolvedValue({ data: { data: ATTACHMENTS } })

    renderAttachments()
    await screen.findByText('informe.pdf')

    await user.click(screen.getByRole('button', { name: 'Descargar informe.pdf' }))

    expect(downloadFile).toHaveBeenCalledWith('/attachments/1/download', 'informe.pdf')
  })

  it('deletes an attachment and updates the counter', async () => {
    const user = userEvent.setup()
    api.get.mockResolvedValue({ data: { data: ATTACHMENTS } })
    api.delete.mockResolvedValue({ data: {} })

    const { onCountChange } = renderAttachments()
    await screen.findByText('informe.pdf')

    await user.click(screen.getByRole('button', { name: 'Eliminar informe.pdf' }))

    await waitFor(() => expect(screen.queryByText('informe.pdf')).not.toBeInTheDocument())
    expect(api.delete).toHaveBeenCalledWith('/attachments/1')
    expect(onCountChange).toHaveBeenCalledTimes(1)
  })

  it('uploads a file and adds it to the list', async () => {
    const user = userEvent.setup()
    api.get.mockResolvedValue({ data: { data: [] } })
    api.post.mockResolvedValue({
      data: {
        data: {
          id: 3,
          name: 'notas.txt',
          size: 10,
          uploader: { id: 1, name: 'Ana Propietaria' },
          created_at: '2026-10-19T12:00:00',
        },
      },
    })

    const { container, onCountChange } = renderAttachments()
    await screen.findByText('Sin archivos adjuntos.')

    const file = new File(['contenido'], 'notas.txt', { type: 'text/plain' })
    await user.upload(container.querySelector('input[type="file"]'), file)

    expect(await screen.findByText('notas.txt')).toBeInTheDocument()
    expect(api.post).toHaveBeenCalledWith('/tasks/100/attachments', expect.any(FormData))
    expect(onCountChange).toHaveBeenCalledTimes(1)
  })

  it('shows the loading error', async () => {
    api.get.mockRejectedValue({
      response: { status: 500, data: { message: 'Error al cargar adjuntos' } },
    })

    renderAttachments()

    expect(await screen.findByRole('alert')).toHaveTextContent('Error al cargar adjuntos')
  })
})
