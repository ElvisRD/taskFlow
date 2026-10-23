import { useState } from 'react'
import { IconBell, IconBellOff } from '../../components/icons.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { useNotificationPreferences } from '../../hooks/useNotificationPreferences.js'

const LABELS = {
  workspace: 'workspace',
  board: 'tablero',
}

/**
 * Toggles notifications for the workspace or board currently being viewed.
 *
 * The button keeps its own copy of the user's mutes so it can be dropped into
 * any page without sharing global state.
 */
export function NotificationMuteButton({
  targetType,
  targetId,
  size = 'sm',
  className = '',
  onError,
}) {
  const { loading, findMute, muteTarget, unmuteTarget } = useNotificationPreferences()
  const [saving, setSaving] = useState(false)
  const mute = findMute(targetType, Number(targetId))
  const targetLabel = LABELS[targetType] ?? 'elemento'

  const handleClick = async () => {
    setSaving(true)

    const succeeded = mute
      ? await unmuteTarget(mute)
      : await muteTarget(targetType, Number(targetId))

    setSaving(false)

    if (!succeeded) {
      onError?.('No se pudieron actualizar las notificaciones.')
    }
  }

  return (
    <Button
      variant="ghost"
      size={size}
      className={className}
      loading={saving}
      disabled={loading || saving}
      aria-pressed={mute !== null}
      onClick={handleClick}
    >
      {mute ? <IconBellOff className="h-4 w-4" /> : <IconBell className="h-4 w-4" />}
      {mute ? 'Reactivar notificaciones' : `Silenciar ${targetLabel}`}
    </Button>
  )
}
