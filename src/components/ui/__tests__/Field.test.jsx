import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Field, inputClass } from '../Field.jsx'

describe('Field', () => {
  it('uses the primary color for the focus ring', () => {
    render(
      <Field label="Nombre" htmlFor="name">
        <input id="name" className={inputClass} />
      </Field>,
    )

    const input = screen.getByLabelText('Nombre')

    expect(input).toHaveClass('focus:outline-none')
    expect(input).toHaveClass('focus:ring-indigo-600')
    expect(input).toHaveClass('dark:focus:ring-indigo-500')
  })

  it('shows the hint until an error replaces it', () => {
    const { rerender } = render(
      <Field label="Nombre" htmlFor="name" hint="Máximo 100 caracteres">
        <input id="name" className={inputClass} />
      </Field>,
    )

    expect(screen.getByText('Máximo 100 caracteres')).toBeInTheDocument()

    rerender(
      <Field
        label="Nombre"
        htmlFor="name"
        hint="Máximo 100 caracteres"
        error="El nombre no es válido."
      >
        <input id="name" className={inputClass} />
      </Field>,
    )

    expect(screen.getByText('El nombre no es válido.')).toBeInTheDocument()
    expect(screen.queryByText('Máximo 100 caracteres')).not.toBeInTheDocument()
  })
})
