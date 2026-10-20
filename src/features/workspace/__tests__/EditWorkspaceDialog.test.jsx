import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { EditWorkspaceDialog } from '../EditWorkspaceDialog.jsx'
import { api } from '../../../lib/api.js'

vi.mock('../../../lib/api', async (importOriginal) => {
  const actual = await importOriginal()

  return {
    ...actual,
    api: {
      patch: vi.fn(),
    },
  }
})

const WORKSPACE = {
  id: 3,
  name: 'Producto',
  description: 'Equipo de producto',
}

function renderDialog(props = {}) {
  const onUpdated = vi.fn()
  const onClose = vi.fn()

  render(
    <EditWorkspaceDialog
      open
      workspace={WORKSPACE}
      onClose={onClose}
      onUpdated={onUpdated}
      {...props}
    />,
  )

  return { onUpdated, onClose }
}

describe('EditWorkspaceDialog', () => {
  beforeEach(() => {
    api.patch.mockReset()
  })

  it('shows an error when the name is invalid', async () => {
    const user = userEvent.setup()
    renderDialog()

    await user.clear(screen.getByLabelText('Nombre'))
    await user.type(screen.getByLabelText('Nombre'), '   ')
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    expect(await screen.findByText('El nombre no es válido.')).toBeInTheDocument()
    expect(api.patch).not.toHaveBeenCalled()
  })

  it('shows errors when the name and description exceed their limits', async () => {
    const user = userEvent.setup()
    renderDialog()

    const name = screen.getByLabelText('Nombre')
    const description = screen.getByLabelText('Descripción')

    expect(name).toHaveAttribute('maxlength', '30')
    expect(description).toHaveAttribute('maxlength', '200')

    fireEvent.change(name, {
      target: { value: 'a'.repeat(31) },
    })
    fireEvent.change(description, {
      target: { value: 'b'.repeat(201) },
    })

    expect(
      screen.getByText('El nombre no puede superar los 30 caracteres.'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('La descripción no puede superar los 200 caracteres.'),
    ).toBeInTheDocument()
    expect(description).toHaveClass('resize-none')

    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    expect(api.patch).not.toHaveBeenCalled()
  })

  it('accepts the maximum lengths and trims the payload', async () => {
    const user = userEvent.setup()
    const updated = {
      ...WORKSPACE,
      name: 'a'.repeat(30),
      description: 'b'.repeat(200),
    }
    api.patch.mockResolvedValue({ data: { data: updated } })
    const { onUpdated } = renderDialog()

    fireEvent.change(screen.getByLabelText('Nombre'), {
      target: { value: `  ${'a'.repeat(30)}  ` },
    })
    fireEvent.change(screen.getByLabelText('Descripción'), {
      target: { value: `  ${'b'.repeat(200)}  ` },
    })
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    await waitFor(() =>
      expect(api.patch).toHaveBeenCalledWith('/workspaces/3', {
        name: 'a'.repeat(30),
        description: 'b'.repeat(200),
      }),
    )
    expect(onUpdated).toHaveBeenCalledWith(updated)
  })

  it('shows validation errors returned by the API', async () => {
    const user = userEvent.setup()
    api.patch.mockRejectedValue({
      response: {
        status: 422,
        data: {
          message: 'Los datos no son válidos.',
          errors: { name: ['El nombre ya existe.'] },
        },
      },
    })
    renderDialog()

    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    expect(await screen.findByText('El nombre ya existe.')).toBeInTheDocument()
    expect(api.patch).toHaveBeenCalledTimes(1)
  })
})
