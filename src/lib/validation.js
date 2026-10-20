export const TEXT_LIMITS = {
  workspaceName: 30,
  workspaceDescription: 200,
  boardName: 30,
  boardDescription: 100,
  listName: 40,
  taskTitle: 40,
  taskDescription: 1000,
  commentBody: 300,
  search: 20,
}

export function validateRequiredText(value, label, maxLength) {
  const trimmed = value.trim()

  if (!trimmed) {
    return `${label} no es válido.`
  }

  if (trimmed.length > maxLength) {
    return `${label} no puede superar los ${maxLength} caracteres.`
  }

  return ''
}

export function validateOptionalText(value, label, maxLength) {
  if (value.trim().length > maxLength) {
    return `${label} no puede superar los ${maxLength} caracteres.`
  }

  return ''
}

export function validateWorkspaceForm(form) {
  const errors = {}
  const nameError = validateRequiredText(form.name, 'El nombre', TEXT_LIMITS.workspaceName)
  const descriptionError = validateOptionalText(
    form.description,
    'La descripción',
    TEXT_LIMITS.workspaceDescription,
  )

  if (nameError) {
    errors.name = nameError
  }

  if (descriptionError) {
    errors.description = descriptionError
  }

  return errors
}
