import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CreateBoardDialog } from '../CreateBoardDialog.jsx'
import { api } from '../../../lib/api.js'
import { BOARD_COLORS } from '../../../lib/constants.js'

vi.mock('../../../lib/api', async (importOriginal) => {
  const actual = await importOriginal()

  return {
    ...actual,
    api: {
      post: vi.fn(),
    },
  }
})

function renderDialog(props = {}) {
  const onCreated = vi.fn()
  const onClose = vi.fn()

  render(
    <CreateBoardDialog
      open
      workspaceId={1}
      onClose={onClose}
      onCreated={onCreated}
      {...props}
    />,
  )

  return { onCreated, onClose }
}

describe('CreateBoardDialog', () => {
  beforeEach(() => {
    api.post.mockReset()
  })

  it('shows an error when the name is invalid', async () => {
    const user = userEvent.setup()
    renderDialog()

    const name = screen.getByLabelText('Nombre')
    await user.type(name, '   ')
    await user.click(screen.getByRole('button', { name: 'Crear tablero' }))

    expect(await screen.findByText('El nombre no es válido.')).toBeInTheDocument()
    expect(api.post).not.toHaveBeenCalled()

    await user.clear(name)
    await user.type(name, 'Sprint 2')

    expect(screen.queryByText('El nombre no es válido.')).not.toBeInTheDocument()
  })

  it('shows an error when the name exceeds 30 characters', async () => {
    const user = userEvent.setup()
    renderDialog()

    fireEvent.change(screen.getByLabelText('Nombre'), {
      target: { value: 'a'.repeat(31) },
    })

    expect(
      screen.getByText('El nombre no puede superar los 30 caracteres.'),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Crear tablero' }))

    expect(api.post).not.toHaveBeenCalled()
  })

  it('shows an error when the description exceeds 100 characters', async () => {
    const user = userEvent.setup()
    renderDialog()

    fireEvent.change(screen.getByLabelText('Nombre'), {
      target: { value: 'Sprint 2' },
    })
    fireEvent.change(screen.getByLabelText('Descripción'), {
      target: { value: 'a'.repeat(101) },
    })

    expect(
      screen.getByText('La descripción no puede superar los 100 caracteres.'),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Crear tablero' }))

    expect(api.post).not.toHaveBeenCalled()
  })

  it('accepts the maximum lengths, trims the payload and keeps the selected color', async () => {
    const user = userEvent.setup()
    const name = 'a'.repeat(30)
    const description = 'b'.repeat(100)
    const created = { id: 5, name, description, color: BOARD_COLORS[1].value }

    api.post.mockResolvedValue({ data: { data: created } })

    const { onCreated } = renderDialog()

    fireEvent.change(screen.getByLabelText('Nombre'), {
      target: { value: `  ${name}  ` },
    })
    fireEvent.change(screen.getByLabelText('Descripción'), {
      target: { value: description },
    })
    await user.click(screen.getByRole('button', { name: 'Azul' }))
    await user.click(screen.getByRole('button', { name: 'Crear tablero' }))

    await waitFor(() => expect(onCreated).toHaveBeenCalledWith(created))
    expect(api.post).toHaveBeenCalledWith('/workspaces/1/boards', {
      name,
      description,
      color: BOARD_COLORS[1].value,
    })
    expect(
      screen.queryByText('El nombre no puede superar los 30 caracteres.'),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByText('La descripción no puede superar los 100 caracteres.'),
    ).not.toBeInTheDocument()
  })

  it('shows field errors returned by the API', async () => {
    const user = userEvent.setup()

    api.post.mockRejectedValue({
      response: {
        status: 422,
        data: {
          message: 'Datos inválidos',
          errors: { name: ['Ese nombre ya está en uso.'] },
        },
      },
    })

    renderDialog()

    await user.type(screen.getByLabelText('Nombre'), 'Sprint 2')
    await user.click(screen.getByRole('button', { name: 'Crear tablero' }))

    expect(await screen.findByText('Ese nombre ya está en uso.')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.getByRole('dialog', { name: 'Nuevo tablero' })).toBeInTheDocument()
  })
})
