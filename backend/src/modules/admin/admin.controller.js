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

/**
 * GET /api/v1/admin/settings
 * Get admin-visible system settings (e.g. product review threshold).
 */
async function getSettings(request, reply) {
  const settings = await adminService.getSettings();
  return reply.send(success(settings));
}

/**
 * PATCH /api/v1/admin/settings/product-review-threshold
 * Update the number of post-approval edits before a product is re-reviewed.
 */
async function updateReviewEditThreshold(request, reply) {
  const settings = await adminService.updateReviewEditThreshold(request.body.value, Number(request.user.id));
  return reply.send(success(settings));
}

/**
 * GET /api/v1/admin/notifications/delivery-stats
 * Get delivery statistics for monitoring dashboard.
 */
async function getDeliveryStatsCtrl(request, reply) {
  const options = {
    status: request.query.status,
    channel: request.query.channel,
    eventType: request.query.eventType,
    userId: request.query.userId ? Number(request.query.userId) : undefined,
    page: request.query.page ? Number(request.query.page) : 1,
    limit: request.query.limit ? Number(request.query.limit) : 20,
  };
  const stats = await adminService.getDeliveryStats(options);
  return reply.send({ data: stats });
}

/**
 * GET /api/v1/admin/notifications/deliveries
 * List deliveries for monitoring page.
 */
async function listDeliveriesCtrl(request, reply) {
  const options = {
    status: request.query.status,
    channel: request.query.channel,
    eventType: request.query.eventType,
    userId: request.query.userId ? Number(request.query.userId) : undefined,
    page: request.query.page ? Number(request.query.page) : 1,
    limit: request.query.limit ? Number(request.query.limit) : 20,
  };
  const result = await adminService.listDeliveries(options);
  return reply.send({ data: result.data, meta: result.meta });
}

module.exports = { getStats, getSettings, updateReviewEditThreshold, getDeliveryStatsCtrl, listDeliveriesCtrl };
