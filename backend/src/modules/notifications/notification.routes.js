/**
 * Notification Routes
 */

const ctrl = require('./notification.controller');

async function notificationRoutes(fastify) {
  fastify.addHook('onRequest', fastify.authenticate);

  fastify.get('/', ctrl.list);
  fastify.get('/unread-count', ctrl.getUnreadCount);
  fastify.patch('/:id/read', ctrl.markAsRead);
  fastify.patch('/read-all', ctrl.markAllAsRead);
  fastify.delete('/:id', ctrl.remove);
}

module.exports = notificationRoutes;
