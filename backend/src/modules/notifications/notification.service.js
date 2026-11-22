/**
 * Notification Service
 * Handles user notifications (in-app)
 */

const prisma = require('../../config/db');
const { recordAuditLogExplicit } = require('../audit/audit.service');
const { AUDIT_ACTIONS } = require('../audit/audit.events');

function notificationAuditSnapshot(notification) {
  return { id: notification.id, isRead: Boolean(notification.isRead) };
}

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
  return prisma.$transaction(async (tx) => {
    const notification = await tx.notification.findFirst({ where: { id: notificationId, userId } });
    if (!notification) throw { statusCode: 404, code: 'NOT_FOUND', message: 'اعلان یافت نشد.' };
    const before = notificationAuditSnapshot(notification);
    await tx.notification.update({ where: { id: notificationId }, data: { isRead: true } });
    await recordAuditLogExplicit({
      tx,
      actorUserId: actor?.id || null,
      actorAccessType: actor?.accessType || 'CUSTOMER',
      companyId: null,
      action: AUDIT_ACTIONS.NOTIFICATION_MARKED_READ,
      entityType: 'Notification',
      entityId: notificationId,
      before,
      after: { id: notification.id, isRead: true },
      metadata: { changedFields: ['isRead'] },
    });
  });
}

async function markAllAsRead(userId, actor = null) {
  return prisma.$transaction(async (tx) => {
    const notifications = await tx.notification.findMany({
      where: { userId, isRead: false },
      select: { id: true, isRead: true },
    });
    const result = await tx.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
    if (notifications.length > 0) {
      await recordAuditLogExplicit({
        tx,
        actorUserId: actor?.id || null,
        actorAccessType: actor?.accessType || 'CUSTOMER',
        companyId: null,
        action: AUDIT_ACTIONS.NOTIFICATION_BULK_READ,
        entityType: 'Notification',
        entityId: 'bulk',
        after: { notificationIds: notifications.map((n) => n.id), count: notifications.length },
        metadata: { count: notifications.length },
      });
    }
    return result;
  });
}

async function setNotificationReadState(notificationId, userId, isRead, actor = null) {
  if (typeof isRead !== 'boolean') throw { statusCode: 400, code: 'INVALID_READ_STATE', message: 'وضعیت خواندن پیام نامعتبر است.' };
  return prisma.$transaction(async (tx) => {
    const notification = await tx.notification.findFirst({ where: { id: notificationId, userId } });
    if (!notification) throw { statusCode: 404, code: 'NOT_FOUND', message: 'اعلان یافت نشد.' };
    const before = notificationAuditSnapshot(notification);
    await tx.notification.update({ where: { id: notificationId }, data: { isRead } });
    await recordAuditLogExplicit({
      tx,
      actorUserId: actor?.id || null,
      actorAccessType: actor?.accessType || 'CUSTOMER',
      companyId: null,
      action: isRead ? AUDIT_ACTIONS.NOTIFICATION_MARKED_READ : AUDIT_ACTIONS.NOTIFICATION_MARKED_UNREAD,
      entityType: 'Notification',
      entityId: notificationId,
      before,
      after: { id: notification.id, isRead },
      metadata: { changedFields: ['isRead'] },
    });
  });
}

async function setNotificationsReadState(ids, userId, isRead, actor = null) {
  const notificationIds = normalizeNotificationIds(ids);
  if (typeof isRead !== 'boolean') throw { statusCode: 400, code: 'INVALID_READ_STATE', message: 'وضعیت خواندن پیام نامعتبر است.' };

  return prisma.$transaction(async (tx) => {
    const notifications = await tx.notification.findMany({
      where: { userId, id: { in: notificationIds } },
      select: { id: true, isRead: true },
    });
    const result = await tx.notification.updateMany({
      where: { userId, id: { in: notificationIds } },
      data: { isRead },
    });
    if (notifications.length > 0) {
      await recordAuditLogExplicit({
        tx,
        actorUserId: actor?.id || null,
        actorAccessType: actor?.accessType || 'CUSTOMER',
        companyId: null,
        action: isRead ? AUDIT_ACTIONS.NOTIFICATION_BULK_READ : AUDIT_ACTIONS.NOTIFICATION_BULK_UNREAD,
        entityType: 'Notification',
        entityId: 'bulk',
        after: { notificationIds: notifications.map((n) => n.id), count: notifications.length },
        metadata: { count: notifications.length, previousStates: notifications.map((n) => ({ id: n.id, isRead: n.isRead })) },
      });
    }
    return result;
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
      action: isRead ? AUDIT_ACTIONS.NOTIFICATION_BULK_READ : AUDIT_ACTIONS.NOTIFICATION_BULK_UNREAD,
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
  return prisma.$transaction(async (tx) => {
    const notification = await tx.notification.findFirst({ where: { id: notificationId, userId } });
    if (!notification) throw { statusCode: 404, code: 'NOT_FOUND', message: 'اعلان یافت نشد.' };
    await tx.notification.delete({ where: { id: notificationId } });
    await recordAuditLogExplicit({
      tx,
      actorUserId: actor?.id || null,
      actorAccessType: actor?.accessType || 'CUSTOMER',
      companyId: null,
      action: AUDIT_ACTIONS.NOTIFICATION_DELETED,
      entityType: 'Notification',
      entityId: notificationId,
      before: notificationAuditSnapshot(notification),
      metadata: { deleted: true },
    });
  });
}

async function deleteNotifications(ids, userId, actor = null) {
  const notificationIds = normalizeNotificationIds(ids);
  return prisma.$transaction(async (tx) => {
    const notifications = await tx.notification.findMany({
      where: { userId, id: { in: notificationIds } },
      select: { id: true, isRead: true },
    });
    const result = await tx.notification.deleteMany({ where: { userId, id: { in: notificationIds } } });
    if (notifications.length > 0) {
      await recordAuditLogExplicit({
        tx,
        actorUserId: actor?.id || null,
        actorAccessType: actor?.accessType || 'CUSTOMER',
        companyId: null,
        action: AUDIT_ACTIONS.NOTIFICATION_BULK_DELETE,
        entityType: 'Notification',
        entityId: 'bulk',
        before: { notificationIds: notifications.map((n) => n.id), count: notifications.length },
        metadata: { count: notifications.length, deletedItems: notifications.map(notificationAuditSnapshot) },
      });
    }
    return result;
  });
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

  return prisma.$transaction(async (tx) => {
    const [notification, destination] = await Promise.all([
      tx.notification.findFirst({ where: { id: notificationId, userId }, select: { id: true } }),
      tx.notificationFolder.findUnique({ where: { id: folderId } }),
    ]);
    if (!notification) throw { statusCode: 404, code: 'NOT_FOUND', message: 'اعلان پیدا نشد.' };
    if (!destination || !destination.isActive || !['ALL', app].includes(destination.scope)) {
      throw { statusCode: 404, code: 'FOLDER_NOT_FOUND', message: 'پوشه مقصد در دسترس نیست.' };
    }

    if (action === 'copy') {
      await tx.notificationFolderMembership.upsert({
        where: { notificationId_folderId: { notificationId, folderId } },
        create: { notificationId, folderId },
        update: {},
      });
      await recordAuditLogExplicit({
        tx,
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
      ? (await tx.notificationFolder.findUnique({ where: { key: 'INBOX' }, select: { id: true } }))?.id
      : Number(sourceFolderId);
    if (!sourceId) throw { statusCode: 500, code: 'INBOX_FOLDER_MISSING', message: 'پوشه دریافتی‌ها پیدا نشد.' };
    const sourceFolder = await tx.notificationFolder.findUnique({
      where: { id: sourceId },
      select: { scope: true, isActive: true },
    });
    if (!sourceFolder || !sourceFolder.isActive || !['ALL', app].includes(sourceFolder.scope)) {
      throw { statusCode: 404, code: 'SOURCE_FOLDER_NOT_FOUND', message: 'پوشه مبدا در دسترس نیست.' };
    }
    if (sourceId === folderId) return { success: true, action, notificationId, folderId };

    const sourceMembership = await tx.notificationFolderMembership.findUnique({
      where: { notificationId_folderId: { notificationId, folderId: sourceId } },
    });
    if (!sourceMembership) throw { statusCode: 400, code: 'SOURCE_MEMBERSHIP_MISSING', message: 'این پیام در پوشه مبدا نیست.' };

    await tx.notificationFolderMembership.upsert({
      where: { notificationId_folderId: { notificationId, folderId } },
      create: { notificationId, folderId },
      update: {},
    });
    await tx.notificationFolderMembership.delete({
      where: { notificationId_folderId: { notificationId, folderId: sourceId } },
    });
    await recordAuditLogExplicit({
      tx,
      actorUserId: actor?.id || null,
      actorAccessType: actor?.accessType || 'CUSTOMER',
      companyId: null,
      action: AUDIT_ACTIONS.NOTIFICATION_FOLDER_CHANGED,
      entityType: 'Notification',
      entityId: notificationId,
      after: { action: 'move', sourceFolderId: sourceId, destinationFolderId: folderId },
      metadata: { action: 'move', sourceFolderId: sourceId, destinationFolderId: folderId },
    });
    return { success: true, action, notificationId, folderId };
  });
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
