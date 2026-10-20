import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { WorkspacesPage } from '../WorkspacesPage.jsx'
import { api } from '../../lib/api.js'

vi.mock('../../lib/api', async (importOriginal) => {
  const actual = await importOriginal()

  return {
    ...actual,
    api: {
      get: vi.fn(),
      post: vi.fn(),
    },
  }
})

const WORKSPACES = [
  {
    id: 1,
    name: 'Producto',
    description: 'Equipo de producto',
    role: 'admin',
    members_count: 4,
    boards_count: 2,
  },
  {
    id: 2,
    name: 'Ventas',
    description: '',
    role: 'member',
    members_count: 3,
    boards_count: 1,
  },
]

function renderPage() {
  return render(
    <MemoryRouter>
      <WorkspacesPage />
    </MemoryRouter>,
  )
}

function pageResponse(items, meta = null) {
  return { data: { data: items, meta } }
}

describe('WorkspacesPage', () => {
  beforeEach(() => {
    api.get.mockReset()
    api.post.mockReset()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('loads and displays workspaces with role and counters', async () => {
    api.get.mockResolvedValue(
      pageResponse(WORKSPACES, { current_page: 1, last_page: 1, total: 2 }),
    )

    renderPage()

    expect(await screen.findByText('Producto')).toBeInTheDocument()
    expect(screen.getByText('Ventas')).toBeInTheDocument()
    expect(screen.getByText('Administrador')).toBeInTheDocument()
    expect(screen.getByText('Miembro')).toBeInTheDocument()
    expect(screen.getByText('4 miembros')).toBeInTheDocument()
    expect(screen.getByText('2 tableros')).toBeInTheDocument()

    expect(api.get).toHaveBeenCalledWith('/workspaces', {
      params: { page: 1, per_page: 12, search: undefined },
    })
  })

  it('shows the empty state without search', async () => {
    api.get.mockResolvedValue(pageResponse([], null))

    renderPage()

    expect(await screen.findByText('Todavía no tienes workspaces')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Crear workspace' })).toBeInTheDocument()
  })

  it('truncates long names and descriptions', async () => {
    const longName =
      'Workspace con un nombre extremadamente largo que no debería desbordar la tarjeta'
    const longDescription =
      'Esta es una descripción muy larga que debería ocupar como máximo dos líneas y terminar con puntos suspensivos sin desbordar la tarjeta del workspace.'

    api.get.mockResolvedValue(
      pageResponse(
        [
          {
            ...WORKSPACES[0],
            name: longName,
            description: longDescription,
          },
        ],
        null,
      ),
    )

    renderPage()

    const name = await screen.findByRole('heading', { name: longName })
    const card = name.closest('a')
    const description = screen.getByText(longDescription)

    expect(name).toHaveClass('min-w-0', 'truncate')
    expect(name).toHaveAttribute('title', longName)
    expect(card).toHaveClass('min-w-0')
    expect(description).toHaveClass('line-clamp-2', 'break-words')
    expect(description).toHaveAttribute('title', longDescription)
  })

  it('creates a workspace and adds it to the list', async () => {
    const user = userEvent.setup()
    const created = {
      id: 9,
      name: 'Marketing',
      description: 'Equipo de marketing',
      role: 'admin',
      members_count: 1,
      boards_count: 0,
    }

    api.get.mockResolvedValue(pageResponse([WORKSPACES[0]], null))
    api.post.mockResolvedValue({ data: { data: created } })

    renderPage()
    await screen.findByText('Producto')

    await user.click(screen.getByRole('button', { name: 'Nuevo workspace' }))
    await user.type(screen.getByLabelText('Nombre'), 'Marketing')
    await user.type(screen.getByLabelText('Descripción'), 'Equipo de marketing')
    await user.click(screen.getByRole('button', { name: 'Crear workspace' }))

    expect(await screen.findByText('Marketing')).toBeInTheDocument()
    expect(api.post).toHaveBeenCalledWith('/workspaces', {
      name: 'Marketing',
      description: 'Equipo de marketing',
    })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('shows an error when the name is invalid', async () => {
    const user = userEvent.setup()
    api.get.mockResolvedValue(pageResponse([WORKSPACES[0]], null))

    renderPage()
    await screen.findByText('Producto')

    await user.click(screen.getByRole('button', { name: 'Nuevo workspace' }))
    const name = screen.getByLabelText('Nombre')

    await user.type(name, '   ')
    await user.click(screen.getByRole('button', { name: 'Crear workspace' }))

    expect(await screen.findByText('El nombre no es válido.')).toBeInTheDocument()
    expect(api.post).not.toHaveBeenCalled()

    await user.clear(name)
    await user.type(name, 'Producto')

    expect(screen.queryByText('El nombre no es válido.')).not.toBeInTheDocument()
  })

  it('shows an error when the name exceeds 100 characters', async () => {
    const user = userEvent.setup()
    api.get.mockResolvedValue(pageResponse([WORKSPACES[0]], null))

    renderPage()
    await screen.findByText('Producto')

    await user.click(screen.getByRole('button', { name: 'Nuevo workspace' }))
    fireEvent.change(screen.getByLabelText('Nombre'), {
      target: { value: 'a'.repeat(101) },
    })

    expect(
      screen.getByText('El nombre no puede superar los 100 caracteres.'),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Crear workspace' }))

    expect(api.post).not.toHaveBeenCalled()
  })

  it('shows an error when the description exceeds 200 characters', async () => {
    const user = userEvent.setup()
    api.get.mockResolvedValue(pageResponse([WORKSPACES[0]], null))

    renderPage()
    await screen.findByText('Producto')

    await user.click(screen.getByRole('button', { name: 'Nuevo workspace' }))
    await user.type(screen.getByLabelText('Nombre'), 'Producto')

    const description = screen.getByLabelText('Descripción')
    expect(description).toHaveClass('resize-none')

    fireEvent.change(description, {
      target: { value: 'a'.repeat(201) },
    })

    expect(
      screen.getByText('La descripción no puede superar los 200 caracteres.'),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Crear workspace' }))

    expect(api.post).not.toHaveBeenCalled()
  })

  it('accepts the maximum lengths and trims the payload', async () => {
    const user = userEvent.setup()
    const longName = 'a'.repeat(100)
    const longDescription = 'b'.repeat(200)
    const created = {
      id: 9,
      name: longName,
      description: longDescription,
      role: 'admin',
      members_count: 1,
      boards_count: 0,
    }

    api.get.mockResolvedValue(pageResponse([WORKSPACES[0]], null))
    api.post.mockResolvedValue({ data: { data: created } })

    renderPage()
    await screen.findByText('Producto')

    await user.click(screen.getByRole('button', { name: 'Nuevo workspace' }))
    fireEvent.change(screen.getByLabelText('Nombre'), {
      target: { value: `  ${longName}  ` },
    })
    fireEvent.change(screen.getByLabelText('Descripción'), {
      target: { value: longDescription },
    })
    await user.click(screen.getByRole('button', { name: 'Crear workspace' }))

    expect(await screen.findByRole('heading', { name: longName })).toBeInTheDocument()
    expect(api.post).toHaveBeenCalledWith('/workspaces', {
      name: longName,
      description: longDescription,
    })
    expect(
      screen.queryByText('El nombre no puede superar los 100 caracteres.'),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByText('La descripción no puede superar los 200 caracteres.'),
    ).not.toBeInTheDocument()
  })

  it('shows field errors returned by the API', async () => {
    const user = userEvent.setup()
    api.get.mockResolvedValue(pageResponse([WORKSPACES[0]], null))
    api.post.mockRejectedValue({
      response: {
        status: 422,
        data: {
          message: 'Datos inválidos',
          errors: { name: ['Ese nombre ya está en uso.'] },
        },
      },
    })

    renderPage()
    await screen.findByText('Producto')

    await user.click(screen.getByRole('button', { name: 'Nuevo workspace' }))
    await user.type(screen.getByLabelText('Nombre'), 'Producto')
    await user.click(screen.getByRole('button', { name: 'Crear workspace' }))

    expect(await screen.findByText('Ese nombre ya está en uso.')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.getByRole('dialog', { name: 'Nuevo workspace' })).toBeInTheDocument()
  })

  it('keeps the form open when the API fails', async () => {
    const user = userEvent.setup()
    api.get.mockResolvedValue(pageResponse([WORKSPACES[0]], null))
    api.post.mockRejectedValue({
      response: {
        status: 500,
        data: { message: 'No se pudo crear el workspace' },
      },
    })

    renderPage()
    await screen.findByText('Producto')

    await user.click(screen.getByRole('button', { name: 'Nuevo workspace' }))
    await user.type(screen.getByLabelText('Nombre'), 'Producto')
    await user.click(screen.getByRole('button', { name: 'Crear workspace' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No se pudo crear el workspace',
    )
    expect(screen.getByLabelText('Nombre')).toHaveValue('Producto')
    expect(screen.getByRole('dialog', { name: 'Nuevo workspace' })).toBeInTheDocument()
  })

  it('debounces search for 300 ms before calling the API', async () => {
    api.get.mockResolvedValue(pageResponse(WORKSPACES, null))

    renderPage()
    await screen.findByText('Producto')
    expect(api.get).toHaveBeenCalledTimes(1)

    vi.useFakeTimers()
    fireEvent.change(screen.getByPlaceholderText('Buscar…'), {
      target: { value: '  producto  ' },
    })

    expect(api.get).toHaveBeenCalledTimes(1)

    await act(async () => {
      vi.advanceTimersByTime(299)
    })
    expect(api.get).toHaveBeenCalledTimes(1)

    await act(async () => {
      vi.advanceTimersByTime(1)
    })

    expect(api.get).toHaveBeenCalledTimes(2)
    expect(api.get.mock.calls.at(-1)[1].params.search).toBe('producto')
  })

  it('paginates results and disables buttons at the extremes', async () => {
    const user = userEvent.setup()

    api.get.mockImplementation((url, config) => {
      const page = config.params.page

      return Promise.resolve(
        page === 1
          ? pageResponse([WORKSPACES[0]], { current_page: 1, last_page: 2, total: 2 })
          : pageResponse([WORKSPACES[1]], { current_page: 2, last_page: 2, total: 2 }),
      )
    })

    renderPage()
    await screen.findByText('Producto')

    expect(screen.getByRole('button', { name: 'Anterior' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Siguiente' })).toBeEnabled()

    await user.click(screen.getByRole('button', { name: 'Siguiente' }))

    expect(await screen.findByText('Ventas')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Anterior' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Siguiente' })).toBeDisabled()
    expect(api.get).toHaveBeenLastCalledWith('/workspaces', {
      params: { page: 2, per_page: 12, search: undefined },
    })
  })

  it('shows the loading error', async () => {
    api.get.mockRejectedValue({
      response: { status: 500, data: { message: 'No se pudo cargar' } },
    })

    renderPage()

    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo cargar')
  })
})
