import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { BoardCard } from '../BoardCard.jsx'

const LONG_NAME =
  'Tablero con un nombre extremadamente largo que no debería desbordar la tarjeta'
const LONG_DESCRIPTION =
  'Esta es una descripción muy larga que debería ocupar como máximo dos líneas y terminar con puntos suspensivos sin desbordar la tarjeta del tablero.'

describe('BoardCard', () => {
  it('truncates long names and descriptions', () => {
    render(
      <MemoryRouter>
        <BoardCard
          workspaceId={1}
          board={{
            id: 2,
            name: LONG_NAME,
            description: LONG_DESCRIPTION,
            color: '#6366f1',
            lists_count: 3,
          }}
        />
      </MemoryRouter>,
    )

    const name = screen.getByRole('heading', { name: LONG_NAME })
    const card = name.closest('a')
    const description = screen.getByText(LONG_DESCRIPTION)

    expect(name).toHaveClass('min-w-0', 'flex-1', 'truncate')
    expect(name).toHaveAttribute('title', LONG_NAME)
    expect(card).toHaveClass('min-w-0')
    expect(description).toHaveClass('line-clamp-2', 'break-words')
    expect(description).toHaveAttribute('title', LONG_DESCRIPTION)
  })
})
