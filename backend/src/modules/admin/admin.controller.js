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
 * POST /api/v1/admin/notifications/send
 * Send an announcement to an authorized audience.
 */
async function getInquiryMonetizationSettingsCtrl(request, reply) {
  return reply.send(success(await adminService.getInquiryMonetizationSettings()));
}

async function updateInquiryMonetizationSettingsCtrl(request, reply) {
  const result = await adminService.updateInquiryMonetizationSettings(request.body.subscriptionEnforcement, Number(request.user.id));
  return reply.send(success(result));
}

async function listInquiryPlansCtrl(request, reply) {
  return reply.send(success(await adminService.listInquiryPlans()));
}

async function createInquiryPlanCtrl(request, reply) {
  return reply.code(201).send(success(await adminService.createInquiryPlan(request.body)));
}


async function updateInquiryPlanCtrl(request, reply) {
  return reply.send(success(await adminService.updateInquiryPlan(Number(request.params.id), request.body)));
}

async function listInquirySubscriptionsCtrl(request, reply) {
  return reply.send(success(await adminService.listInquirySubscriptions()));
}

async function grantInquirySubscriptionCtrl(request, reply) {
  return reply.code(201).send(success(await adminService.grantInquirySubscription(request.body, Number(request.user.id))));
}


async function rejectPendingInquirySubscriptionCtrl(request, reply) {
  const result = await adminService.rejectPendingInquirySubscription(Number(request.params.id), Number(request.user.id), request.body.notes);
  return reply.send(success(result));
}

async function activatePendingInquirySubscriptionCtrl(request, reply) {
  if (request.body.paymentConfirmed !== true) {
    const { AppError } = require('../../utils/error');
    throw new AppError('برای فعال‌سازی باید تأیید کنید که پرداخت را خارج از سامانه بررسی کرده‌اید.', 400, true, 'PAYMENT_CONFIRMATION_REQUIRED');
  }
  const result = await adminService.activatePendingInquirySubscription(Number(request.params.id), Number(request.user.id), request.body.notes);
  return reply.send(success(result));
}

async function sendNotificationCtrl(request, reply) {
  const result = await adminService.sendNotification(request.body);
  return reply.code(202).send({ data: result });
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

async function listNotificationFoldersCtrl(request, reply) {
  const folders = await adminService.listNotificationFolders();
  return reply.send({ data: folders });
}

async function createNotificationFolderCtrl(request, reply) {
  const folder = await adminService.createNotificationFolder(request.body);
  return reply.code(201).send({ data: folder });
}

async function updateNotificationFolderCtrl(request, reply) {
  const folder = await adminService.updateNotificationFolder(Number(request.params.id), request.body);
  return reply.send({ data: folder });
}

module.exports = { getStats, getSettings, updateReviewEditThreshold, getInquiryMonetizationSettingsCtrl, updateInquiryMonetizationSettingsCtrl, listInquiryPlansCtrl, createInquiryPlanCtrl, updateInquiryPlanCtrl, listInquirySubscriptionsCtrl, grantInquirySubscriptionCtrl, activatePendingInquirySubscriptionCtrl, rejectPendingInquirySubscriptionCtrl, sendNotificationCtrl, getDeliveryStatsCtrl, listDeliveriesCtrl, listNotificationFoldersCtrl, createNotificationFolderCtrl, updateNotificationFolderCtrl };
