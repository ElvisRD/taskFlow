import { api } from '../../lib/api.js'

/**
 * Loads the authenticated user's notification preferences and active mutes.
 *
 * Returns `{ preferences, mutes }` where every preference has the shape
 * `{ type, label, in_app, email }` and every mute has
 * `{ id, type, target_id, workspace_id?, name }`.
 */
export async function fetchNotificationPreferences() {
  const { data } = await api.get('/notifications/preferences')

  return {
    preferences: data?.data ?? [],
    mutes: data?.mutes ?? [],
  }
}

/** Updates one channel (`in_app` or `email`) for a notification type. */
export async function updateNotificationPreference(type, changes) {
  const { data } = await api.patch(`/notifications/preferences/${type}`, changes)

  return data?.data ?? null
}

/** Silences every notification for a workspace or board. */
export async function muteNotificationTarget({ targetType, targetId }) {
  const { data } = await api.post('/notifications/mutes', {
    target_type: targetType,
    target_id: targetId,
  })

  return data?.data ?? null
}

/** Removes a workspace or board mute. */
export async function unmuteNotificationTarget(muteId) {
  await api.delete(`/notifications/mutes/${muteId}`)
}

/** Finds the mute that matches a workspace or board, if it is silenced. */
export function findNotificationMute(mutes, targetType, targetId) {
  return (
    mutes.find(
      (mute) =>
        mute.type === targetType && Number(mute.target_id) === Number(targetId),
    ) ?? null
  )
}
