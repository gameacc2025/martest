// =============================================================
// Admin Controller — Dashboard statistics only
//
// User management  → /api/v1/users
// Role management  → /api/v1/roles
// Permissions      → /api/v1/permissions
// =============================================================

const adminService = require('./admin.service');
const { success } = require('../../utils/success');

/**
 * GET /api/v1/admin/stats
 * Get admin dashboard statistics
 */
async function getStats(request, reply) {
  const stats = await adminService.getStats();
  return reply.send(success(stats));
}

module.exports = { getStats };
