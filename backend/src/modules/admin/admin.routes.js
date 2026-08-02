// =============================================================
// Admin Routes — Dashboard statistics only
//
// User management  → /api/v1/users
// Role management  → /api/v1/roles
// Permissions      → /api/v1/permissions
//
// Route map:
//   GET /api/v1/admin/stats → dashboard statistics
// =============================================================

const ctrl = require('./admin.controller');
const { requirePermission } = require('../../middlewares/rbac');

async function adminRoutes(fastify) {
  fastify.get('/stats', {
    onRequest: [fastify.authenticate],
    preHandler: [requirePermission('users.read')],
    schema: {
      summary: 'Get admin dashboard statistics',
      tags: ['Admin'],
    },
  }, ctrl.getStats);
}

module.exports = adminRoutes;