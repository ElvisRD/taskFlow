import { useCallback, useEffect, useState } from 'react'
import {
  fetchNotificationPreferences,
  findNotificationMute,
  muteNotificationTarget,
  unmuteNotificationTarget,
  updateNotificationPreference,
} from '../features/notifications/notificationPreferences.js'
import { apiErrorMessage } from '../lib/api.js'

/**
 * Loads notification preferences and mutes, and exposes the actions needed to
 * keep them in sync with the API.
 */
export function useNotificationPreferences({ enabled = true } = {}) {
  const [preferences, setPreferences] = useState([])
  const [mutes, setMutes] = useState([])
  const [loading, setLoading] = useState(enabled)
  const [error, setError] = useState('')
  const [savingKey, setSavingKey] = useState('')
  const [savingMute, setSavingMute] = useState(false)

  const load = useCallback(
    async ({ silent = false } = {}) => {
      if (!enabled) {
        return
      }

      if (!silent) {
        setLoading(true)
      }

      try {
        const result = await fetchNotificationPreferences()

        setPreferences(result.preferences)
        setMutes(result.mutes)
        setError('')
      } catch (requestError) {
        if (!silent) {
          setError(apiErrorMessage(requestError))
        }
      } finally {
        if (!silent) {
          setLoading(false)
        }
      }
    },
    [enabled],
  )

  useEffect(() => {
    load()
  }, [load])

  const updateChannel = useCallback(
    async (type, channel, value) => {
      const previous = preferences.find((preference) => preference.type === type)

      if (!previous) {
        return false
      }

      setSavingKey(`${type}:${channel}`)
      setError('')
      setPreferences((current) =>
        current.map((preference) =>
          preference.type === type ? { ...preference, [channel]: value } : preference,
        ),
      )

      try {
        const updated = await updateNotificationPreference(type, { [channel]: value })

        setPreferences((current) =>
          current.map((preference) =>
            preference.type === type ? { ...preference, ...updated } : preference,
          ),
        )

        return true
      } catch (requestError) {
        setPreferences((current) =>
          current.map((preference) =>
            preference.type === type ? { ...preference, ...previous } : preference,
          ),
        )
        setError(apiErrorMessage(requestError))

        return false
      } finally {
        setSavingKey('')
      }
    },
    [preferences],
  )

  const muteTarget = useCallback(async (targetType, targetId) => {
    setSavingMute(true)
    setError('')

    try {
      const created = await muteNotificationTarget({ targetType, targetId })

      if (!created) {
        return false
      }

      setMutes((current) => [
        created,
        ...current.filter(
          (mute) =>
            !(
              mute.type === targetType &&
              Number(mute.target_id) === Number(targetId)
            ),
        ),
      ])

      return true
    } catch (requestError) {
      setError(apiErrorMessage(requestError))

      return false
    } finally {
      setSavingMute(false)
    }
  }, [])

  const unmuteTarget = useCallback(
    async (mute) => {
      if (!mute?.id) {
        return false
      }

      const previous = mutes

      setSavingMute(true)
      setError('')
      setMutes((current) => current.filter((item) => item.id !== mute.id))

      try {
        await unmuteNotificationTarget(mute.id)

        return true
      } catch (requestError) {
        setMutes(previous)
        setError(apiErrorMessage(requestError))

        return false
      } finally {
        setSavingMute(false)
      }
    },
    [mutes],
  )

  const findMute = useCallback(
    (targetType, targetId) => findNotificationMute(mutes, targetType, targetId),
    [mutes],
  )

  const isMuted = useCallback(
    (targetType, targetId) => findMute(targetType, targetId) !== null,
    [findMute],
  )

  return {
    preferences,
    mutes,
    loading,
    error,
    savingKey,
    savingMute,
    reload: load,
    updateChannel,
    muteTarget,
    unmuteTarget,
    findMute,
    isMuted,
  }
}
