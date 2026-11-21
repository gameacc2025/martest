/**
 * Notification Service
 * Handles user notifications (in-app)
 */

const prisma = require('../../config/db');
const { recordAuditLogExplicit } = require('../audit/audit.service');
const { AUDIT_ACTIONS } = require('../audit/audit.events');

/**
 * Get notifications for a user
 * @param {number} userId
 * @param {Object} options - { page, limit, unreadOnly }
 * @returns {Object} { data, meta }
 */
async function getNotifications(userId, options = {}) {
  const { page = 1, limit = 20, unreadOnly = false, readOnly = false, folderId = null } = options;
  const skip = (page - 1) * limit;

  const where = { userId };
  if (unreadOnly) where.isRead = false;
  else if (readOnly) where.isRead = true;
  if (folderId !== null && folderId !== undefined) where.folderMemberships = { some: { folderId: Number(folderId) } };

  const [data, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: { folderMemberships: { include: { folder: { select: { id: true, key: true, name: true, scope: true } } } } },
    }),
    prisma.notification.count({ where }),
  ]);

  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get unread notification count
 * @param {number} userId
 * @returns {number}
 */
async function getUnreadCount(userId) {
  return prisma.notification.count({
    where: { userId, isRead: false },
  });
}

/**
 * Mark a notification as read
 * @param {number} notificationId
 * @param {number} userId
 * @param {object} actor - Actor context for audit logging
 */
async function markAsRead(notificationId, userId, actor = null) {
  const notification = await prisma.notification.findFirst({
    where: { id: notificationId, userId },
  });

  if (!notification) {
    throw { statusCode: 404, code: 'NOT_FOUND', message: 'اعلان یافت نشد.' };
  }

  const before = { ...notification };

  await prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true },
  });

  await recordAuditLogExplicit({
    actorUserId: actor?.id || null,
    actorAccessType: actor?.accessType || 'CUSTOMER',
    companyId: null,
    action: AUDIT_ACTIONS.NOTIFICATION_MARKED_READ,
    entityType: 'Notification',
    entityId: notificationId,
    before,
    after: { ...notification, isRead: true },
    metadata: { changedFields: ['isRead'] },
  });
}

/**
 * Mark all notifications as read
 * @param {number} userId
 * @param {object} actor - Actor context for audit logging
 */
async function markAllAsRead(userId, actor = null) {
  const notifications = await prisma.notification.findMany({
    where: { userId, isRead: false },
    select: { id: true },
  });

  const result = await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });

  if (notifications.length > 0) {
    await recordAuditLogExplicit({
      actorUserId: actor?.id || null,
      actorAccessType: actor?.accessType || 'CUSTOMER',
      companyId: null,
      action: AUDIT_ACTIONS.NOTIFICATION_BULK_READ,
      entityType: 'Notification',
      entityId: 'bulk',
      after: { notificationIds: notifications.map(n => n.id), count: notifications.length },
      metadata: { count: notifications.length },
    });
  }

  return result;
}

async function setNotificationReadState(notificationId, userId, isRead, actor = null) {
  if (typeof isRead !== 'boolean') throw { statusCode: 400, code: 'INVALID_READ_STATE', message: 'وضعیت خواندن پیام نامعتبر است.' };
  const notification = await prisma.notification.findFirst({ where: { id: notificationId, userId } });
  if (!notification) throw { statusCode: 404, code: 'NOT_FOUND', message: 'اعلان یافت نشد.' };

  const before = { ...notification };

  await prisma.notification.update({ where: { id: notificationId }, data: { isRead } });

  await recordAuditLogExplicit({
    actorUserId: actor?.id || null,
    actorAccessType: actor?.accessType || 'CUSTOMER',
    companyId: null,
    action: isRead ? AUDIT_ACTIONS.NOTIFICATION_MARKED_READ : AUDIT_ACTIONS.NOTIFICATION_MARKED_UNREAD,
    entityType: 'Notification',
    entityId: notificationId,
    before,
    after: { ...notification, isRead },
    metadata: { changedFields: ['isRead'] },
  });
}

function normalizeNotificationIds(ids) {
  if (!Array.isArray(ids) || ids.length < 1 || ids.length > 100 || ids.some(id => !Number.isInteger(id) || id < 1)) {
    throw { statusCode: 400, code: 'INVALID_NOTIFICATION_IDS', message: 'فهرست پیام‌های انتخاب‌شده نامعتبر است.' };
  }
  return [...new Set(ids)];
}

async function setNotificationsReadState(ids, userId, isRead, actor = null) {
  const notificationIds = normalizeNotificationIds(ids);
  if (typeof isRead !== 'boolean') throw { statusCode: 400, code: 'INVALID_READ_STATE', message: 'وضعیت خواندن پیام نامعتبر است.' };

  const notifications = await prisma.notification.findMany({
    where: { userId, id: { in: notificationIds } },
    select: { id: true, isRead: true },
  });

  const result = await prisma.notification.updateMany({ where: { userId, id: { in: notificationIds } }, data: { isRead } });

  if (notifications.length > 0) {
    await recordAuditLogExplicit({
      actorUserId: actor?.id || null,
      actorAccessType: actor?.accessType || 'CUSTOMER',
      companyId: null,
      action: isRead ? AUDIT_ACTIONS.NOTIFICATION_BULK_READ : AUDIT_ACTIONS.NOTIFICATION_BULK_READ,
      entityType: 'Notification',
      entityId: 'bulk',
      after: { notificationIds: notifications.map(n => n.id), count: notifications.length },
      metadata: { count: notifications.length, previousStates: notifications.map(n => ({ id: n.id, isRead: n.isRead })) },
    });
  }

  return result;
}

/**
 * Delete a notification
 * @param {number} notificationId
 * @param {number} userId
 * @param {object} actor - Actor context for audit logging
 */
async function deleteNotification(notificationId, userId, actor = null) {
  const notification = await prisma.notification.findFirst({
    where: { id: notificationId, userId },
  });

  if (!notification) {
    throw { statusCode: 404, code: 'NOT_FOUND', message: 'اعلان یافت نشد.' };
  }

  const before = { ...notification };

  await prisma.notification.delete({
    where: { id: notificationId },
  });

  await recordAuditLogExplicit({
    actorUserId: actor?.id || null,
    actorAccessType: actor?.accessType || 'CUSTOMER',
    companyId: null,
    action: AUDIT_ACTIONS.NOTIFICATION_DELETED,
    entityType: 'Notification',
    entityId: notificationId,
    before,
    metadata: { deleted: true },
  });
}

/**
 * Create a notification for a user
 * @param {number} userId
 * @param {string} title
 * @param {string} message
 */
async function deleteNotifications(ids, userId, actor = null) {
  const notificationIds = normalizeNotificationIds(ids);

  const notifications = await prisma.notification.findMany({
    where: { userId, id: { in: notificationIds } },
    select: { id: true, title: true, message: true, isRead: true },
  });

  const result = await prisma.notification.deleteMany({ where: { userId, id: { in: notificationIds } } });

  if (notifications.length > 0) {
    await recordAuditLogExplicit({
      actorUserId: actor?.id || null,
      actorAccessType: actor?.accessType || 'CUSTOMER',
      companyId: null,
      action: AUDIT_ACTIONS.NOTIFICATION_BULK_DELETE,
      entityType: 'Notification',
      entityId: 'bulk',
      before: { notificationIds: notifications.map(n => n.id), count: notifications.length },
      metadata: { count: notifications.length, deletedItems: notifications },
    });
  }

  return result;
}

async function createNotification(userId, title, message) {
  return prisma.notification.create({
    data: { userId, title, message },
  });
}


const VALID_FOLDER_SCOPES = new Set(['WEBSITE', 'COMPANY', 'ADMIN']);

async function getUserFolders(app) {
  if (!VALID_FOLDER_SCOPES.has(app)) {
    throw { statusCode: 400, code: 'INVALID_APP_SCOPE', message: 'دامنه برنامه نامعتبر است.' };
  }
  return prisma.notificationFolder.findMany({
    where: { isActive: true, OR: [{ scope: 'ALL' }, { scope: app }] },
    orderBy: [{ isSystem: 'desc' }, { sortOrder: 'asc' }, { id: 'asc' }],
    select: { id: true, key: true, name: true, scope: true, isSystem: true, sortOrder: true },
  });
}

async function changeNotificationFolder(userId, notificationId, folderId, action, app, sourceFolderId = null, actor = null) {
  app = String(app || '').toUpperCase();
  if (!VALID_FOLDER_SCOPES.has(app)) throw { statusCode: 400, code: 'INVALID_APP_SCOPE', message: 'دامنه برنامه نامعتبر است.' };
  if (!['copy', 'move'].includes(action)) {
    throw { statusCode: 400, code: 'INVALID_FOLDER_ACTION', message: 'عملیات پوشه نامعتبر است.' };
  }
  const [notification, destination] = await Promise.all([
    prisma.notification.findFirst({ where: { id: notificationId, userId }, select: { id: true } }),
    prisma.notificationFolder.findUnique({ where: { id: folderId } }),
  ]);
  if (!notification) throw { statusCode: 404, code: 'NOT_FOUND', message: 'اعلان پیدا نشد.' };
  if (!destination || !destination.isActive || !['ALL', app].includes(destination.scope)) throw { statusCode: 404, code: 'FOLDER_NOT_FOUND', message: 'پوشه مقصد در دسترس نیست.' };

  if (action === 'copy') {
    await prisma.notificationFolderMembership.upsert({
      where: { notificationId_folderId: { notificationId, folderId } },
      create: { notificationId, folderId },
      update: {},
    });

    await recordAuditLogExplicit({
      actorUserId: actor?.id || null,
      actorAccessType: actor?.accessType || 'CUSTOMER',
      companyId: null,
      action: AUDIT_ACTIONS.NOTIFICATION_FOLDER_CHANGED,
      entityType: 'Notification',
      entityId: notificationId,
      after: { action: 'copy', destinationFolderId: folderId },
      metadata: { action: 'copy', destinationFolderId: folderId },
    });

    return { success: true, action, notificationId, folderId };
  }

  const sourceId = sourceFolderId === null || sourceFolderId === undefined
    ? (await prisma.notificationFolder.findUnique({ where: { key: 'INBOX' }, select: { id: true } }))?.id
    : Number(sourceFolderId);
  if (!sourceId) throw { statusCode: 500, code: 'INBOX_FOLDER_MISSING', message: 'پوشه دریافتی‌ها پیدا نشد.' };
  const sourceFolder = await prisma.notificationFolder.findUnique({ where: { id: sourceId }, select: { scope: true, isActive: true } });
  if (!sourceFolder || !sourceFolder.isActive || !['ALL', app].includes(sourceFolder.scope)) throw { statusCode: 404, code: 'SOURCE_FOLDER_NOT_FOUND', message: 'پوشه مبدا در دسترس نیست.' };
  if (sourceId === folderId) return { success: true, action, notificationId, folderId };

  const sourceMembership = await prisma.notificationFolderMembership.findUnique({
    where: { notificationId_folderId: { notificationId, folderId: sourceId } },
  });
  if (!sourceMembership) {
    throw { statusCode: 400, code: 'SOURCE_MEMBERSHIP_MISSING', message: 'این پیام در پوشه مبدا نیست.' };
  }
  await prisma.$transaction([
    prisma.notificationFolderMembership.upsert({
      where: { notificationId_folderId: { notificationId, folderId } },
      create: { notificationId, folderId },
      update: {},
    }),
    prisma.notificationFolderMembership.delete({
      where: { notificationId_folderId: { notificationId, folderId: sourceId } },
    }),
  ]);

  await recordAuditLogExplicit({
    actorUserId: actor?.id || null,
    actorAccessType: actor?.accessType || 'CUSTOMER',
    companyId: null,
    action: AUDIT_ACTIONS.NOTIFICATION_FOLDER_CHANGED,
    entityType: 'Notification',
    entityId: notificationId,
    after: { action: 'move', sourceFolderId, destinationFolderId: folderId },
    metadata: { action: 'move', sourceFolderId, destinationFolderId: folderId },
  });

  return { success: true, action, notificationId, folderId };
}

module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  setNotificationReadState,
  setNotificationsReadState,
  deleteNotification,
  deleteNotifications,
  createNotification,
  getUserFolders,
  changeNotificationFolder,
};
