import { describe, expect, it } from 'vitest'
import { normalizeFixedNotificationFolders, notificationFolderLabel } from './notificationFolders'

describe('fixed notification folders', () => {
  it('exposes only INBOX and SAVED, in a stable order', () => {
    const folders = [
      { id: 12, key: 'CUSTOM', name: 'پوشه شخصی' },
      { id: 9, key: 'SAVED', name: 'نام دلخواه سرور' },
      { id: 3, key: 'INBOX', name: 'نام دلخواه سرور' },
    ]

    const fixed = normalizeFixedNotificationFolders(folders)
    expect(fixed.map((folder) => folder.key)).toEqual(['INBOX', 'SAVED'])
    expect(fixed.map(notificationFolderLabel)).toEqual(['دریافتی', 'ذخیره‌شده‌ها'])
  })

  it('returns an empty list for missing or invalid folder data', () => {
    expect(normalizeFixedNotificationFolders(null)).toEqual([])
    expect(normalizeFixedNotificationFolders({ data: [] })).toEqual([])
    expect(normalizeFixedNotificationFolders([{ id: 1, key: 'CUSTOM' }])).toEqual([])
  })
})
