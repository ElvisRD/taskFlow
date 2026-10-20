import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Modal } from '../Modal.jsx'

describe('Modal', () => {
  beforeEach(() => {
    document.body.style.overflow = ''
  })

  it('renders nothing when closed', () => {
    render(
      <Modal open={false} onClose={vi.fn()} title="Título">
        Contenido
      </Modal>,
    )

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.queryByText('Contenido')).not.toBeInTheDocument()
  })

  it('renders title, description, content and footer in a portal', () => {
    render(
      <Modal
        open
        onClose={vi.fn()}
        title="Detalle"
        description="Descripción del modal"
        footer={<button type="button">Guardar</button>}
      >
        <p>Contenido del modal</p>
      </Modal>,
    )

    const dialog = screen.getByRole('dialog', { name: 'Detalle' })

    expect(dialog).toBeInTheDocument()
    expect(screen.getByText('Descripción del modal')).toBeInTheDocument()
    expect(screen.getByText('Contenido del modal')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Guardar' })).toBeInTheDocument()
    expect(dialog.parentElement.parentElement).toBe(document.body)
  })

  it('locks body scroll while open and restores it', () => {
    const { unmount } = render(
      <Modal open onClose={vi.fn()} title="Bloqueo">
        Contenido
      </Modal>,
    )

    expect(document.body.style.overflow).toBe('hidden')

    unmount()

    expect(document.body.style.overflow).toBe('')
  })

  it('calls onClose when pressing Escape', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()

    render(
      <Modal open onClose={onClose} title="Escape">
        Contenido
      </Modal>,
    )

    await user.keyboard('{Escape}')

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when clicking the backdrop or the X', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()

    render(
      <Modal open onClose={onClose} title="Cerrar">
        Contenido
      </Modal>,
    )

    const closeButtons = screen.getAllByRole('button', { name: 'Cerrar' })
    expect(closeButtons).toHaveLength(2)

    await user.click(closeButtons[0])
    expect(onClose).toHaveBeenCalledTimes(1)

    await user.click(closeButtons[1])
    expect(onClose).toHaveBeenCalledTimes(2)
  })

  it('stops listening for Escape when unmounted', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()

    const { unmount } = render(
      <Modal open onClose={onClose} title="Desmontar">
        Contenido
      </Modal>,
    )

    unmount()
    await user.keyboard('{Escape}')

    expect(onClose).not.toHaveBeenCalled()
  })
})
