/**
 * Notification Routes
 */

const ctrl = require('./notification.controller');
const prefCtrl = require('./notification.preference.controller');
const schema = require('./notification.schemas');

async function notificationRoutes(fastify) {
  fastify.addHook('onRequest', fastify.authenticate);

  // ── User-facing notification CRUD ─────────────────────────────
  fastify.get('/', ctrl.list);
  fastify.get('/unread-count', ctrl.getUnreadCount);
  fastify.post('/bulk-read-state', {
    schema: { body: { type: 'object', required: ['ids', 'isRead'], additionalProperties: false, properties: {
      ids: { type: 'array', minItems: 1, maxItems: 100, uniqueItems: true, items: { type: 'integer', minimum: 1 } },
      isRead: { type: 'boolean' },
    } } },
  }, ctrl.bulkSetReadState);
  fastify.post('/bulk-delete', {
    schema: { body: { type: 'object', required: ['ids'], additionalProperties: false, properties: {
      ids: { type: 'array', minItems: 1, maxItems: 100, uniqueItems: true, items: { type: 'integer', minimum: 1 } },
    } } },
  }, ctrl.bulkRemove);
  fastify.get('/folders', ctrl.listFolders);
  fastify.post('/:id/folders', {
    schema: { params: { type: 'object', required: ['id'], properties: { id: { type: 'integer', minimum: 1 } } }, body: { type: 'object', required: ['folderId', 'action'], additionalProperties: false, properties: { folderId: { type: 'integer', minimum: 1 }, action: { type: 'string', enum: ['copy', 'move'] }, sourceFolderId: { type: 'integer', minimum: 1 } } } },
  }, ctrl.changeFolder);
  fastify.patch('/:id/read-state', {
    schema: {
      params: { type: 'object', required: ['id'], properties: { id: { type: 'integer', minimum: 1 } } },
      body: { type: 'object', required: ['isRead'], additionalProperties: false, properties: { isRead: { type: 'boolean' } } },
    },
  }, ctrl.setReadState);
  fastify.patch('/:id/read', ctrl.markAsRead);
  fastify.patch('/read-all', ctrl.markAllAsRead);
  fastify.delete('/:id', ctrl.remove);

  // ── User notification preferences ─────────────────────────────
  // GET    /preferences — effective (stored + defaults) matrix
  // PATCH  /preferences — batch update user's (eventType, channel, enabled) rows
  fastify.get('/preferences', {
    schema: {
      summary: 'Get effective notification preferences (stored overrides + event defaults)',
      tags: ['Preferences'],
    },
  }, prefCtrl.getPreferencesCtrl);

  fastify.patch('/preferences', {
    schema: {
      summary: 'Batch update notification preferences',
      description: 'Array of { eventType, channel, enabled } — unknown keys/channels are rejected with 400.',
      tags: ['Preferences'],
      body: schema.preferenceUpdateBodySchema,
      response: schema.preferenceResponseSchema,
    },
  }, prefCtrl.updatePreferencesCtrl);
}

module.exports = notificationRoutes;
