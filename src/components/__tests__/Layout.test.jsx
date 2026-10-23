import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Layout } from '../Layout.jsx'
import { AuthContext } from '../../context/AuthContext.jsx'
import { ThemeProvider } from '../../context/ThemeContext.jsx'

vi.mock('../../lib/api', async (importOriginal) => {
  const actual = await importOriginal()

  return {
    ...actual,
    api: {
      get: vi.fn(() =>
        Promise.resolve({
          data: { data: [], unread_count: 0, meta: { current_page: 1, last_page: 1 } },
        }),
      ),
      post: vi.fn(),
      patch: vi.fn(),
    },
  }
})

const USER = {
  id: 1,
  name: 'Ana Propietaria',
  email: 'ana@taskflow.test',
  avatar: null,
}

function renderLayout(logout = vi.fn()) {
  render(
    <MemoryRouter initialEntries={['/workspaces']}>
      <AuthContext.Provider value={{ user: USER, status: 'authenticated', logout }}>
        <ThemeProvider>
          <Routes>
            <Route element={<Layout />}>
              <Route
                path="/workspaces"
                element={
                  <div>
                    <span>Workspaces</span>
                    <button type="button">Fuera</button>
                  </div>
                }
              />
              <Route path="/login" element={<div>Iniciar sesión</div>} />
              <Route
                path="/settings/notifications"
                element={<div>Preferencias de notificaciones</div>}
              />
            </Route>
          </Routes>
        </ThemeProvider>
      </AuthContext.Provider>
    </MemoryRouter>,
  )

  return { logout }
}

describe('Layout', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('shows the theme switch before the user menu and removes the old exit button', () => {
    renderLayout()

    const themeButton = screen.getByRole('button', { name: 'Cambiar tema' })
    const userButton = screen.getByRole('button', { name: 'Menú de Ana Propietaria' })
    const notificationsButton = screen.getByRole('button', { name: 'Notificaciones' })

    expect(themeButton.compareDocumentPosition(userButton)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    )
    expect(notificationsButton.compareDocumentPosition(userButton)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    )
    expect(screen.getByText('Ana Propietaria')).toBeInTheDocument()
    expect(screen.getByText('ana@taskflow.test')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Salir' })).not.toBeInTheDocument()
  })

  it('opens a menu with the settings and logout actions', async () => {
    const user = userEvent.setup()
    const { logout } = renderLayout()

    await user.click(screen.getByRole('button', { name: 'Menú de Ana Propietaria' }))

    const menu = screen.getByRole('menu', { name: 'Menú de usuario' })
    expect(within(menu).getAllByRole('menuitem')).toHaveLength(2)
    expect(within(menu).getByRole('menuitem', { name: 'Notificaciones' })).toHaveAttribute(
      'href',
      '/settings/notifications',
    )

    await user.click(within(menu).getByRole('menuitem', { name: 'Cerrar sesión' }))

    await waitFor(() => expect(logout).toHaveBeenCalledTimes(1))
    expect(await screen.findByText('Iniciar sesión')).toBeInTheDocument()
  })

  it('navigates to the notification settings from the user menu', async () => {
    const user = userEvent.setup()
    renderLayout()

    await user.click(screen.getByRole('button', { name: 'Menú de Ana Propietaria' }))
    await user.click(screen.getByRole('menuitem', { name: 'Notificaciones' }))

    expect(await screen.findByText('Preferencias de notificaciones')).toBeInTheDocument()
  })

  it('closes the user menu with Escape', async () => {
    const user = userEvent.setup()
    renderLayout()

    await user.click(screen.getByRole('button', { name: 'Menú de Ana Propietaria' }))
    expect(screen.getByRole('menu', { name: 'Menú de usuario' })).toBeInTheDocument()

    await user.keyboard('{Escape}')

    expect(screen.queryByRole('menu', { name: 'Menú de usuario' })).not.toBeInTheDocument()
  })

  it('closes the user menu when clicking outside', async () => {
    const user = userEvent.setup()
    renderLayout()

    await user.click(screen.getByRole('button', { name: 'Menú de Ana Propietaria' }))
    expect(screen.getByRole('menu', { name: 'Menú de usuario' })).toBeInTheDocument()

    fireEvent.pointerDown(screen.getByRole('button', { name: 'Fuera' }))

    expect(screen.queryByRole('menu', { name: 'Menú de usuario' })).not.toBeInTheDocument()
  })
})
