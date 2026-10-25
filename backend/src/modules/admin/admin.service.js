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

  const campaignId = require('node:crypto').randomUUID();
  const result = await dispatchNotification(
    'ADMIN_ANNOUNCEMENT',
    users.map((user) => ({ userId: user.id, email: user.email })),
    { title, message },
    { channels, dedupeKey: (userId) => campaignId + ':' + userId },
  );
  return {
    audience,
    recipients: result.recipients,
    inAppCreated: result.inApp.created,
    emailQueued: result.email.queued,
    emailSkipped: result.email.preferenceDisabled + result.email.noEmailAddress,
    smsNotImplemented: result.sms.notImplemented,
  };
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

async function listNotificationFolders() {
  return prisma.notificationFolder.findMany({
    orderBy: [{ isSystem: 'desc' }, { sortOrder: 'asc' }, { id: 'asc' }],
  });
}

function folderKeyFromName(name) {
  const base = String(name).normalize('NFKD').toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06FF]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48);
  return base || 'folder';
}

async function createNotificationFolder({ name, scope, sortOrder = 10 }) {
  const cleanName = String(name || '').trim();
  if (cleanName.length < 2 || cleanName.length > 60) {
    throw new AppError('نام پوشه باید بین ۲ تا ۶۰ نویسه باشد.', 400, true, 'INVALID_FOLDER_NAME');
  }
  const base = folderKeyFromName(cleanName);
  let key = base;
  let suffix = 2;
  while (await prisma.notificationFolder.findUnique({ where: { key } })) key = `${base}-${suffix++}`;
  return prisma.notificationFolder.create({
    data: { key, name: cleanName, scope, sortOrder: Number(sortOrder) || 0, isSystem: false, isActive: true },
  });
}

async function updateNotificationFolder(id, changes) {
  const folder = await prisma.notificationFolder.findUnique({ where: { id } });
  if (!folder) throw new AppError('پوشه پیدا نشد.', 404, true, 'FOLDER_NOT_FOUND');
  if (folder.isSystem) throw new AppError('پوشه‌های سیستمی قابل تغییر نیستند.', 400, true, 'SYSTEM_FOLDER_IMMUTABLE');
  const data = {};
  if (changes.name !== undefined) {
    const name = String(changes.name).trim();
    if (name.length < 2 || name.length > 60) throw new AppError('نام پوشه باید بین ۲ تا ۶۰ نویسه باشد.', 400, true, 'INVALID_FOLDER_NAME');
    data.name = name;
  }
  if (changes.scope !== undefined) data.scope = changes.scope;
  if (changes.sortOrder !== undefined) data.sortOrder = changes.sortOrder;
  if (changes.isActive !== undefined) data.isActive = changes.isActive;
  return prisma.notificationFolder.update({ where: { id }, data });
}

module.exports = { getStats, getSettings, updateReviewEditThreshold, sendNotification, getDeliveryStats, listDeliveries, listNotificationFolders, createNotificationFolder, updateNotificationFolder };
