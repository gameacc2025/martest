// =============================================================
// Admin Routes — Dashboard statistics + system settings
//
// User management  → /api/v1/users
// Role management  → /api/v1/roles
// Permissions      → /api/v1/permissions
//
// Route map:
//   GET   /api/v1/admin/stats                          → dashboard statistics
//   GET   /api/v1/admin/settings                       → system settings
//   PATCH /api/v1/admin/settings/product-review-threshold → edit review threshold
// =============================================================

const ctrl = require('./admin.controller');
const { requirePermission } = require('../../middlewares/rbac');

const thresholdBodySchema = {
  type: 'object',
  required: ['value'],
  additionalProperties: false,
  properties: { value: { type: 'integer', minimum: 1, maximum: 1000 } },
};

async function adminRoutes(fastify) {
  fastify.get('/stats', {
    onRequest: [fastify.authenticate],
    preHandler: [requirePermission('users.read')],
    schema: {
      summary: 'Get admin dashboard statistics',
      tags: ['Admin'],
    },
  }, ctrl.getStats);

  // System settings are a manage-only concern. Neither role needs them at
  // read time for the dashboard; requirePermission below grants access to
  // SUPER_ADMIN (bypass layer) and any role holding system_settings.manage
  // (seeded into SUPER_ADMIN only today — see prisma/seed.js).
  fastify.get('/settings', {
    onRequest: [fastify.authenticate],
    preHandler: [requirePermission('system_settings.manage')],
    schema: {
      summary: 'Get system settings',
      tags: ['Admin'],
    },
  }, ctrl.getSettings);

  fastify.patch('/settings/product-review-threshold', {
    onRequest: [fastify.authenticate],
    preHandler: [requirePermission('system_settings.manage')],
    schema: {
      summary: 'Update product review edit threshold',
      tags: ['Admin'],
      body: thresholdBodySchema,
    },
  }, ctrl.updateReviewEditThreshold);
}

module.exports = adminRoutes;