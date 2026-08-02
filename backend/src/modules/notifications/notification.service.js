/**
 * Notification Service
 * Handles user notifications (in-app)
 */

const prisma = require('../../config/db');

/**
 * Get notifications for a user
 * @param {number} userId
 * @param {Object} options - { page, limit, unreadOnly }
 * @returns {Object} { data, meta }
 */
async function getNotifications(userId, options = {}) {
  const { page = 1, limit = 20, unreadOnly = false } = options;
  const skip = (page - 1) * limit;

  const where = { userId };
  if (unreadOnly) where.isRead = false;

  const [data, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
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
 */
async function markAsRead(notificationId, userId) {
  const notification = await prisma.notification.findFirst({
    where: { id: notificationId, userId },
  });

  if (!notification) {
    throw { statusCode: 404, code: 'NOT_FOUND', message: 'اعلان یافت نشد.' };
  }

  await prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true },
  });
}

/**
 * Mark all notifications as read
 * @param {number} userId
 */
async function markAllAsRead(userId) {
  await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
}

/**
 * Delete a notification
 * @param {number} notificationId
 * @param {number} userId
 */
async function deleteNotification(notificationId, userId) {
  const notification = await prisma.notification.findFirst({
    where: { id: notificationId, userId },
  });

  if (!notification) {
    throw { statusCode: 404, code: 'NOT_FOUND', message: 'اعلان یافت نشد.' };
  }

  await prisma.notification.delete({
    where: { id: notificationId },
  });
}

/**
 * Create a notification for a user
 * @param {number} userId
 * @param {string} title
 * @param {string} message
 */
async function createNotification(userId, title, message) {
  return prisma.notification.create({
    data: { userId, title, message },
  });
}

module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  createNotification,
};
