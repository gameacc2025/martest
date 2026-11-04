export const FIXED_NOTIFICATION_FOLDER_KEYS = Object.freeze(['INBOX', 'SAVED'])

export function normalizeFixedNotificationFolders(folders) {
  if (!Array.isArray(folders)) return []
  return FIXED_NOTIFICATION_FOLDER_KEYS
    .map((key) => folders.find((folder) => folder?.key === key))
    .filter(Boolean)
}

export function notificationFolderLabel(folder) {
  if (folder?.key === 'INBOX') return 'دریافتی'
  if (folder?.key === 'SAVED') return 'ذخیره‌شده‌ها'
  return ''
}
