// =============================================================
// Admin Service — Dashboard statistics + pending products
// =============================================================

const prisma = require('../../config/db');
const deliveryService = require('../notifications/notification.delivery.service');
const { dispatchNotification } = require('../notifications/notification.dispatch.service');
const { AppError } = require('../../utils/error');

// System settings keys. Value is shared with the products module
// (product.service.js REVIEW_EDIT_THRESHOLD_KEY) — keep both in sync.
const REVIEW_EDIT_THRESHOLD_KEY = 'catalog.productReviewEditThreshold';
const DEFAULT_REVIEW_EDIT_THRESHOLD = 5;

/**
 * Read an admin-managed system setting; falls back to `fallback` when
 * missing or invalid.
 */
async function readSetting(key, fallback) {
  const setting = await prisma.systemSetting.findUnique({ where: { key }, select: { value: true } });
  const parsed = setting ? Number(setting.value) : NaN;
  return Number.isInteger(parsed) && parsed >= 1 ? parsed : fallback;
}

/**
 * Get admin-visible system settings.
 */
async function getSettings() {
  return {
    productReviewEditThreshold: await readSetting(REVIEW_EDIT_THRESHOLD_KEY, DEFAULT_REVIEW_EDIT_THRESHOLD),
  };
}

/**
 * Update the number of post-approval edits that send a product back into
 * review. Positive integer ≥ 1.
 */
async function updateReviewEditThreshold(value, adminUserId) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new AppError('Review threshold must be a positive integer.', 400, true, 'INVALID_REVIEW_THRESHOLD');
  }
  await prisma.systemSetting.upsert({
    where: { key: REVIEW_EDIT_THRESHOLD_KEY },
    create: { key: REVIEW_EDIT_THRESHOLD_KEY, value: String(parsed), updatedByUserId: adminUserId },
    update: { value: String(parsed), updatedByUserId: adminUserId },
  });
  return getSettings();
}

/**
 * Get admin dashboard statistics.
 * Returns counts of key entities, recent activity, and pending products.
 */
async function getStats() {
  const [
    totalUsers,
    activeUsers,
    totalCompanies,
    totalProducts,
    pendingProducts,
    totalInquiries,
    totalRoles,
    totalPermissions,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { status: 'ACTIVE' } }),
    prisma.company.count(),
    prisma.product.count(),
    prisma.product.count({ where: { status: 'PENDING_REVIEW' } }),
    prisma.inquiry.count(),
    prisma.role.count(),
    prisma.permission.count(),
  ]);

  // Recent users (last 5)
  const recentUsers = await prisma.user.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      email: true,
      status: true,
      createdAt: true,
      profile: { select: { firstName: true, lastName: true } },
    },
  });

  // Pending products (for approval queue)
  const pendingProductsList = await prisma.product.findMany({
    where: { status: 'PENDING_REVIEW' },
    take: 20,
    orderBy: { createdAt: 'desc' },
    include: {
      company: { select: { id: true, name: true } },
      category: { select: { id: true, nameFa: true } },
      subcategory: { select: { id: true, nameFa: true } },
      createdBy: {
        select: {
          id: true,
          email: true,
          profile: { select: { firstName: true, lastName: true } },
        },
      },
    },
  });

  return {
    counts: {
      users: totalUsers,
      activeUsers,
      companies: totalCompanies,
      products: totalProducts,
      pendingProducts,
      orders: totalInquiries,
      roles: totalRoles,
      permissions: totalPermissions,
    },
    recentUsers,
    pendingProducts: pendingProductsList,
  };
}

/**
 * Send an admin announcement to active users in a selected access profile.
 * Delivery preferences are honored by the central dispatcher.
 */
async function sendNotification({ title, message, audience, channels }) {
  const where = { status: 'ACTIVE' };
  if (audience !== 'ALL_ACTIVE') {
    where.accessProfile = { type: audience, isActive: true };
  }
  const users = await prisma.user.findMany({
    where,
    select: { id: true, email: true },
    orderBy: { id: 'asc' },
  });

  const summary = { audience, recipients: users.length, inAppCreated: 0, emailQueued: 0, emailSkipped: 0, smsNotImplemented: 0 };
  const campaignId = require('node:crypto').randomUUID();
  for (const user of users) {
    const result = await dispatchNotification(
      'ADMIN_ANNOUNCEMENT',
      [{ userId: user.id, email: user.email }],
      { title, message },
      { channels, dedupeKey: campaignId + ':' + user.id },
    );
    summary.inAppCreated += result.inApp.created;
    summary.emailQueued += result.email.queued;
    summary.emailSkipped += result.email.preferenceDisabled + result.email.noEmailAddress;
    summary.smsNotImplemented += result.sms.notImplemented;
  }
  return summary;
}

/**
 * Admin: Get delivery statistics for monitoring dashboard.
 */
async function getDeliveryStats(options = {}) {
  return deliveryService.getDeliveryStats(options);
}

/**
 * Admin: List deliveries for monitoring page.
 */
async function listDeliveries(options = {}) {
  return deliveryService.listDeliveries(options);
}

module.exports = { getStats, getSettings, updateReviewEditThreshold, sendNotification, getDeliveryStats, listDeliveries };
