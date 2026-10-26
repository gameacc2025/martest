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


const INQUIRY_ENFORCEMENT_KEY = 'inquiry.subscription_enforcement';

async function getInquiryMonetizationSettings() {
  const setting = await prisma.systemSetting.findUnique({ where: { key: INQUIRY_ENFORCEMENT_KEY }, select: { value: true } });
  return { subscriptionEnforcement: setting?.value === 'true' };
}

async function updateInquiryMonetizationSettings(enabled, adminUserId) {
  if (typeof enabled !== 'boolean') throw new AppError('وضعیت کنترل اشتراک باید درست یا نادرست باشد.', 400, true, 'INVALID_SUBSCRIPTION_SETTING');
  await prisma.systemSetting.upsert({
    where: { key: INQUIRY_ENFORCEMENT_KEY },
    create: { key: INQUIRY_ENFORCEMENT_KEY, value: String(enabled), updatedByUserId: adminUserId },
    update: { value: String(enabled), updatedByUserId: adminUserId },
  });
  return getInquiryMonetizationSettings();
}

async function listInquiryPlans() {
  return prisma.inquiryPlan.findMany({ orderBy: [{ isActive: 'desc' }, { price: 'asc' }, { id: 'asc' }] });
}

async function createInquiryPlan(data) {
  const code = String(data.code || '').trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-');
  const name = String(data.name || '').trim();
  const durationDays = Number(data.durationDays);
  const price = Number(data.price);
  if (!/^[a-z0-9][a-z0-9_-]{1,49}$/.test(code) || !name || name.length > 100) {
    throw new AppError('کد یا نام طرح اشتراک معتبر نیست.', 400, true, 'INVALID_INQUIRY_PLAN');
  }
  if (!Number.isInteger(durationDays) || durationDays < 1 || durationDays > 3650 || !Number.isFinite(price) || price < 0) {
    throw new AppError('مدت یا قیمت طرح اشتراک معتبر نیست.', 400, true, 'INVALID_INQUIRY_PLAN');
  }
  const quotas = ['inquiriesPerPeriod', 'responsesPerPeriod', 'internalMessagesPerPeriod', 'smsPerPeriod'];
  const normalized = {};
  for (const key of quotas) {
    const value = data[key] === undefined ? 0 : Number(data[key]);
    if (!Number.isInteger(value) || value < 0 || value > 100000000) {
      throw new AppError('سهمیه طرح باید عدد صحیح نامنفی باشد.', 400, true, 'INVALID_INQUIRY_PLAN_QUOTA');
    }
    normalized[key] = value;
  }
  return prisma.inquiryPlan.create({
    data: { code, name, description: data.description || null, durationDays, price, currency: data.currency || 'IRR', ...normalized, isActive: data.isActive !== false },
  });
}


async function updateInquiryPlan(planId, data) {
  const id = Number(planId);
  if (!Number.isInteger(id) || id < 1) throw new AppError('شناسه طرح معتبر نیست.', 400, true, 'INVALID_INQUIRY_PLAN_ID');
  const existing = await prisma.inquiryPlan.findUnique({ where: { id } });
  if (!existing) throw new AppError('طرح اشتراک پیدا نشد.', 404, true, 'INQUIRY_PLAN_NOT_FOUND');
  const update = {};
  if (data.name !== undefined) {
    const name = String(data.name).trim();
    if (!name || name.length > 100) throw new AppError('نام طرح معتبر نیست.', 400, true, 'INVALID_INQUIRY_PLAN');
    update.name = name;
  }
  if (data.description !== undefined) update.description = data.description ? String(data.description).trim().slice(0, 1000) : null;
  if (data.durationDays !== undefined) {
    const days = Number(data.durationDays);
    if (!Number.isInteger(days) || days < 1 || days > 3650) throw new AppError('مدت طرح معتبر نیست.', 400, true, 'INVALID_INQUIRY_PLAN');
    update.durationDays = days;
  }
  if (data.price !== undefined) {
    const price = Number(data.price);
    if (!Number.isFinite(price) || price < 0) throw new AppError('قیمت طرح معتبر نیست.', 400, true, 'INVALID_INQUIRY_PLAN');
    update.price = price;
  }
  if (data.currency !== undefined) {
    const currency = String(data.currency).trim().toUpperCase();
    if (!/^[A-Z]{3,8}$/.test(currency)) throw new AppError('واحد پول معتبر نیست.', 400, true, 'INVALID_INQUIRY_PLAN');
    update.currency = currency;
  }
  for (const key of ['inquiriesPerPeriod', 'responsesPerPeriod', 'internalMessagesPerPeriod', 'smsPerPeriod']) {
    if (data[key] === undefined) continue;
    const value = Number(data[key]);
    if (!Number.isInteger(value) || value < 0 || value > 100000000) throw new AppError('سهمیه طرح معتبر نیست.', 400, true, 'INVALID_INQUIRY_PLAN_QUOTA');
    update[key] = value;
  }
  if (data.isActive !== undefined) {
    if (typeof data.isActive !== 'boolean') throw new AppError('وضعیت طرح معتبر نیست.', 400, true, 'INVALID_INQUIRY_PLAN');
    update.isActive = data.isActive;
  }
  if (!Object.keys(update).length) throw new AppError('هیچ تغییری برای ذخیره ارسال نشده است.', 400, true, 'EMPTY_INQUIRY_PLAN_UPDATE');
  return prisma.inquiryPlan.update({ where: { id }, data: update });
}

async function listInquirySubscriptions() {
  await prisma.inquirySubscription.updateMany({ where: { status: 'ACTIVE', endsAt: { lte: new Date() } }, data: { status: 'EXPIRED' } });
  return prisma.inquirySubscription.findMany({
    take: 100,
    orderBy: { createdAt: 'desc' },
    include: { plan: { select: { id: true, code: true, name: true, price: true, durationDays: true } }, company: { select: { id: true, name: true } }, user: { select: { id: true, phone: true, email: true } } },
  });
}

// Explicit staff grant for support/compensation. This is NOT a payment callback;
// online checkout must only activate a subscription after a verified gateway callback.

async function grantInquirySubscription(data, adminUserId) {
  const companyId = data.companyId == null ? null : Number(data.companyId);
  const userId = data.userId == null ? null : Number(data.userId);
  if ((companyId == null) === (userId == null) || (companyId != null && (!Number.isInteger(companyId) || companyId < 1)) || (userId != null && (!Number.isInteger(userId) || userId < 1))) {
    throw new AppError('باید دقیقاً یکی از شناسه شرکت یا کاربر تعیین شود.', 400, true, 'INVALID_SUBSCRIPTION_OWNER');
  }
  const planId = Number(data.planId);
  const plan = await prisma.inquiryPlan.findFirst({ where: { id: planId, isActive: true } });
  if (!plan) throw new AppError('طرح اشتراک فعال پیدا نشد.', 404, true, 'INQUIRY_PLAN_NOT_FOUND');
  return prisma.$transaction(async (tx) => {
    const ownerFilter = companyId != null ? { companyId } : { userId };
    const now = new Date();
    const active = await tx.inquirySubscription.findFirst({
      where: { ...ownerFilter, status: 'ACTIVE', startsAt: { lte: now }, endsAt: { gt: now } },
      select: { id: true },
    });
    if (active) throw new AppError('این حساب در حال حاضر اشتراک فعال دارد.', 409, true, 'ACTIVE_SUBSCRIPTION_EXISTS');
    const startsAt = new Date();
    const endsAt = new Date(startsAt.getTime() + plan.durationDays * 86400000);
    return tx.inquirySubscription.create({
      data: { planId, companyId, userId, status: 'ACTIVE', startsAt, endsAt, activatedBy: adminUserId, notes: data.notes || 'Manual administrative grant' },
      include: { plan: true, company: { select: { id: true, name: true } }, user: { select: { id: true, phone: true } } },
    });
  });
}


async function activatePendingInquirySubscription(subscriptionId, adminUserId, notes) {
  const id = Number(subscriptionId);
  if (!Number.isInteger(id) || id < 1) throw new AppError('شناسه اشتراک معتبر نیست.', 400, true, 'INVALID_SUBSCRIPTION_ID');
  return prisma.$transaction(async (tx) => {
    let pending = await tx.inquirySubscription.findUnique({ where: { id }, include: { plan: true } });
    if (!pending) throw new AppError('درخواست اشتراک پیدا نشد.', 404, true, 'SUBSCRIPTION_NOT_FOUND');
    if (pending.status !== 'PENDING_PAYMENT') throw new AppError('فقط درخواست‌های در انتظار پرداخت قابل فعال‌سازی هستند.', 409, true, 'SUBSCRIPTION_NOT_PENDING');

    // Lock the owner row to prevent two pending requests for the same owner
    // from being activated concurrently after both observed "no active plan".
    if (typeof tx.$queryRawUnsafe === 'function') {
      if (pending.companyId) await tx.$queryRawUnsafe('SELECT id FROM "Company" WHERE id = $1 FOR UPDATE', pending.companyId);
      else await tx.$queryRawUnsafe('SELECT id FROM "User" WHERE id = $1 FOR UPDATE', pending.userId);
    }
    pending = await tx.inquirySubscription.findUnique({ where: { id }, include: { plan: true } });
    if (!pending || pending.status !== 'PENDING_PAYMENT') throw new AppError('وضعیت درخواست تغییر کرده است؛ فهرست را تازه‌سازی کنید.', 409, true, 'SUBSCRIPTION_NOT_PENDING');
    if (!pending.plan.isActive) throw new AppError('طرح این اشتراک غیرفعال شده است.', 409, true, 'SUBSCRIPTION_PLAN_INACTIVE');

    const ownerFilter = pending.companyId ? { companyId: pending.companyId } : { userId: pending.userId };
    const active = await tx.inquirySubscription.findFirst({
      where: { ...ownerFilter, status: 'ACTIVE', startsAt: { lte: new Date() }, endsAt: { gt: new Date() } },
      select: { id: true },
    });
    if (active) throw new AppError('این حساب هم‌اکنون اشتراک فعال دارد.', 409, true, 'ACTIVE_SUBSCRIPTION_EXISTS');
    const startsAt = new Date();
    const endsAt = new Date(startsAt.getTime() + pending.plan.durationDays * 86400000);
    const changed = await tx.inquirySubscription.updateMany({
      where: { id, status: 'PENDING_PAYMENT' },
      data: {
        status: 'ACTIVE', startsAt, endsAt, activatedBy: Number(adminUserId),
        notes: [pending.notes, 'پرداخت به‌صورت دستی توسط مدیر بررسی و تأیید شد.', notes].filter(Boolean).join(' | ').slice(0, 2000),
      },
    });
    if (changed.count !== 1) throw new AppError('وضعیت درخواست تغییر کرده است؛ فهرست را تازه‌سازی کنید.', 409, true, 'SUBSCRIPTION_NOT_PENDING');
    return tx.inquirySubscription.findUnique({
      where: { id },
      include: { plan: true, company: { select: { id: true, name: true } }, user: { select: { id: true, phone: true } } },
    });
  });
}

async function rejectPendingInquirySubscription(subscriptionId, adminUserId, notes) {
  const id = Number(subscriptionId);
  if (!Number.isInteger(id) || id < 1) throw new AppError('شناسه اشتراک معتبر نیست.', 400, true, 'INVALID_SUBSCRIPTION_ID');
  return prisma.$transaction(async (tx) => {
    const pending = await tx.inquirySubscription.findUnique({ where: { id }, select: { id: true, status: true, notes: true } });
    if (!pending) throw new AppError('درخواست اشتراک پیدا نشد.', 404, true, 'SUBSCRIPTION_NOT_FOUND');
    if (pending.status !== 'PENDING_PAYMENT') throw new AppError('فقط درخواست‌های در انتظار بررسی قابل رد هستند.', 409, true, 'SUBSCRIPTION_NOT_PENDING');
    const changed = await tx.inquirySubscription.updateMany({
      where: { id, status: 'PENDING_PAYMENT' },
      data: { status: 'CANCELLED', activatedBy: Number(adminUserId), notes: [pending.notes, 'درخواست پرداخت توسط مدیر رد شد.', notes].filter(Boolean).join(' | ').slice(0, 2000) },
    });
    if (changed.count !== 1) throw new AppError('وضعیت درخواست تغییر کرده است؛ فهرست را تازه‌سازی کنید.', 409, true, 'SUBSCRIPTION_NOT_PENDING');
    return tx.inquirySubscription.findUnique({
      where: { id },
      include: { plan: true, company: { select: { id: true, name: true } }, user: { select: { id: true, phone: true } } },
    });
  });
}

module.exports = { getStats, getSettings, updateReviewEditThreshold, sendNotification, getDeliveryStats, listDeliveries, listNotificationFolders, createNotificationFolder, updateNotificationFolder, getInquiryMonetizationSettings, updateInquiryMonetizationSettings, listInquiryPlans, createInquiryPlan, updateInquiryPlan, listInquirySubscriptions, grantInquirySubscription, activatePendingInquirySubscription, rejectPendingInquirySubscription };
