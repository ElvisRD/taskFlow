import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  fetchNotificationPreferences,
  findNotificationMute,
  muteNotificationTarget,
  unmuteNotificationTarget,
  updateNotificationPreference,
} from '../notificationPreferences.js'
import { api } from '../../../lib/api.js'

vi.mock('../../../lib/api', async (importOriginal) => {
  const actual = await importOriginal()

  return {
    ...actual,
    api: {
      get: vi.fn(),
      post: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
    },
  }
})

const PREFERENCE = {
  type: 'task_assigned',
  label: 'Tarea asignada',
  in_app: true,
  email: false,
}

const MUTE = {
  id: 7,
  type: 'workspace',
  target_id: 1,
  name: 'Producto',
}

describe('notificationPreferences', () => {
  beforeEach(() => {
    api.get.mockReset()
    api.post.mockReset()
    api.patch.mockReset()
    api.delete.mockReset()
  })

  it('loads preferences and mutes from the API', async () => {
    api.get.mockResolvedValue({
      data: { data: [PREFERENCE], mutes: [MUTE] },
    })

    await expect(fetchNotificationPreferences()).resolves.toEqual({
      preferences: [PREFERENCE],
      mutes: [MUTE],
    })
    expect(api.get).toHaveBeenCalledWith('/notifications/preferences')
  })

  it('updates a single channel for a notification type', async () => {
    api.patch.mockResolvedValue({ data: { data: PREFERENCE } })

    await expect(
      updateNotificationPreference('task_assigned', { email: false }),
    ).resolves.toEqual(PREFERENCE)
    expect(api.patch).toHaveBeenCalledWith('/notifications/preferences/task_assigned', {
      email: false,
    })
  })

  it('mutes a workspace or board with the expected payload', async () => {
    api.post.mockResolvedValue({ data: { data: MUTE } })

    await expect(
      muteNotificationTarget({ targetType: 'workspace', targetId: 1 }),
    ).resolves.toEqual(MUTE)
    expect(api.post).toHaveBeenCalledWith('/notifications/mutes', {
      target_type: 'workspace',
      target_id: 1,
    })
  })

  it('removes a mute by id', async () => {
    api.delete.mockResolvedValue({})

    await unmuteNotificationTarget(7)

    expect(api.delete).toHaveBeenCalledWith('/notifications/mutes/7')
  })

  it('finds a mute using string or numeric target ids', () => {
    const mutes = [
      { ...MUTE, target_id: '1' },
      { ...MUTE, id: 8, type: 'board', target_id: 5 },
    ]

    expect(findNotificationMute(mutes, 'workspace', 1)).toEqual(mutes[0])
    expect(findNotificationMute(mutes, 'board', '5')).toEqual(mutes[1])
    expect(findNotificationMute(mutes, 'board', 99)).toBeNull()
  })
})
