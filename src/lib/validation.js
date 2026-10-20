export const TEXT_LIMITS = {
  workspaceName: 100,
  workspaceDescription: 200,
  boardName: 30,
  boardDescription: 100,
  listName: 40,
  taskTitle: 80,
  taskDescription: 1000,
  commentBody: 1000,
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
