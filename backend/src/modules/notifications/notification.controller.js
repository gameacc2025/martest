/**
 * Notification Controller
 */

const notificationService = require('./notification.service');

function resolveNotificationAppScope(request) {
  const accessType = String(request.user?.accessType || '').toUpperCase();
  const roles = Array.isArray(request.user?.roles) ? request.user.roles : [];
  // Match the central RBAC default Website context for AccessProfile-less
  // customer registrations. This fallback must never grant a panel scope
  // or apply to SUPER_ADMIN.
  const isDefaultCustomer = !accessType
    && roles.includes('CUSTOMER_USER')
    && !roles.includes('SUPER_ADMIN');
  const effectiveAccessType = isDefaultCustomer ? 'CUSTOMER' : accessType;
  const scopeByAccessType = { STAFF: 'ADMIN', COMPANY: 'COMPANY', CUSTOMER: 'WEBSITE' };
  const scope = scopeByAccessType[effectiveAccessType];
  if (!scope) {
    throw { statusCode: 403, code: 'NOTIFICATION_APP_CONTEXT_REQUIRED', message: 'دامنه دسترسی برای اعلان‌ها مشخص نیست.' };
  }
  return scope;
}

/**
 * GET /api/v1/notifications
 * Get user's notifications
 */
async function list(request, reply) {
  const { page = 1, limit = 20, unreadOnly, readOnly } = request.query;
  const userId = request.user.id;
  const options = {
    page: Number(page),
    limit: Number(limit),
    unreadOnly: unreadOnly === 'true',
    ...(readOnly === 'true' ? { readOnly: true } : {}),
  };

  if (request.query.folderId) {
    const appScope = resolveNotificationAppScope(request);
    const folderId = Number(request.query.folderId);
    const folders = await notificationService.getUserFolders(appScope);
    if (!folders.some((folder) => Number(folder.id) === folderId)) {
      throw { statusCode: 404, code: 'FOLDER_NOT_FOUND', message: 'پوشه در این پنل در دسترس نیست.' };
    }
    options.folderId = folderId;
  }

  const result = await notificationService.getNotifications(userId, options);
  return reply.send(result);
}

/**
 * GET /api/v1/notifications/unread-count
 * Get unread notification count
 */
async function getUnreadCount(request, reply) {
  const count = await notificationService.getUnreadCount(request.user.id);
  return reply.send({ count });
}

/**
 * PATCH /api/v1/notifications/:id/read
 * Mark a notification as read
 */
async function markAsRead(request, reply) {
  await notificationService.markAsRead(Number(request.params.id), request.user.id);
  return reply.send({ success: true });
}

/**
 * PATCH /api/v1/notifications/read-all
 * Mark all notifications as read
 */
async function markAllAsRead(request, reply) {
  await notificationService.markAllAsRead(request.user.id);
  return reply.send({ success: true });
}

async function setReadState(request, reply) {
  await notificationService.setNotificationReadState(Number(request.params.id), request.user.id, request.body.isRead);
  return reply.send({ success: true });
}

async function bulkSetReadState(request, reply) {
  const result = await notificationService.setNotificationsReadState(request.body.ids, request.user.id, request.body.isRead);
  return reply.send({ success: true, count: result.count });
}

async function bulkRemove(request, reply) {
  const result = await notificationService.deleteNotifications(request.body.ids, request.user.id);
  return reply.send({ success: true, count: result.count });
}

/**
 * DELETE /api/v1/notifications/:id
 * Delete a notification
 */
async function remove(request, reply) {
  await notificationService.deleteNotification(Number(request.params.id), request.user.id);
  return reply.send({ success: true });
}

async function listFolders(request, reply) {
  // App scope is derived from the verified access token, never from a client query.
  const appScope = resolveNotificationAppScope(request);
  const data = await notificationService.getUserFolders(appScope);
  return reply.send({ data });
}

async function changeFolder(request, reply) {
  const result = await notificationService.changeNotificationFolder(
    request.user.id,
    Number(request.params.id),
    Number(request.body.folderId),
    request.body.action,
    // Ignore request.body.app; scope comes from the verified access token.
    resolveNotificationAppScope(request),
    request.body.sourceFolderId === undefined ? null : Number(request.body.sourceFolderId),
  );
  return reply.send(result);
}

module.exports = {
  listFolders,
  changeFolder,
  list,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  setReadState,
  bulkSetReadState,
  bulkRemove,
  remove,
};
