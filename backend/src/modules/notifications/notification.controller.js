/**
 * Notification Controller
 */

const notificationService = require('./notification.service');

/**
 * GET /api/v1/notifications
 * Get user's notifications
 */
async function list(request, reply) {
  const { page = 1, limit = 20, unreadOnly } = request.query;
  const userId = request.user.id;
  const result = await notificationService.getNotifications(userId, {
    page: Number(page),
    limit: Number(limit),
    unreadOnly: unreadOnly === 'true',
  });
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

/**
 * DELETE /api/v1/notifications/:id
 * Delete a notification
 */
async function remove(request, reply) {
  await notificationService.deleteNotification(Number(request.params.id), request.user.id);
  return reply.send({ success: true });
}

module.exports = {
  list,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  remove,
};
