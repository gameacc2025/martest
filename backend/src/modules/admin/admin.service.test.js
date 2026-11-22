// مسیر فایل: backend/src/modules/admin/admin.service.test.js
// =============================================================
// Unit tests — Admin service (getStats)
//
// Run with:  node --test
// =============================================================

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const Module = require('node:module');

const serviceDir = __dirname;

function injectMock(relativePath, exportsObj) {
  const resolved = require.resolve(path.join(serviceDir, relativePath));
  const original = require.cache[resolved];
  require.cache[resolved] = new Module(resolved);
  require.cache[resolved].exports = exportsObj;
  require.cache[resolved].loaded = true;
  test.after(() => {
    if (original) require.cache[resolved] = original;
    else delete require.cache[resolved];
  });
  return resolved;
}

const calls = {
  userCount: [],
  productCount: [],
  retailOrderCount: [],
  userFindMany: [],
  productFindMany: [],
  systemSettingFindUnique: [],
  systemSettingUpsert: [],
  auditLogCreate: [],
  transactions: [],
};
let fx;
function resetMocks() {
  Object.keys(calls).forEach((k) => (calls[k] = []));
  fx = {
    totalUsers: 0,
    activeUsers: 0,
    totalCompanies: 0,
    totalProducts: 0,
    pendingProducts: 0,
    totalInquiries: 0,
    totalOrders: 0,
    totalRoles: 0,
    totalPermissions: 0,
    recentUsers: [],
    pendingProductsList: [],
    systemSetting: null,
    inquirySetting: null,
    inquiryPlanById: null,
    inquiryPlanCreated: { id: 1 },
    inquiryPlanUpdated: { id: 1 },
    inquirySubscriptionCount: 0,
    folderByKey: null,
    folderById: null,
    folderCreated: { id: 1 },
    folderUpdated: { id: 1 },
    auditByIdempotencyKey: null,
  };
}
resetMocks();

const mockPrisma = {
  $transaction: async (callback) => {
    calls.transactions.push(true);
    return callback(mockPrisma);
  },
  user: {
    count: async (args) => {
      calls.userCount.push(args);
      // First call (no args) = total, second call (status: ACTIVE) = active
      return calls.userCount.length === 1 ? fx.totalUsers : fx.activeUsers;
    },
    findMany: async (args) => {
      calls.userFindMany.push(args);
      return fx.recentUsers;
    },
  },
  company: { count: async () => fx.totalCompanies },
  retailOrder: { count: async (args) => { calls.retailOrderCount.push(args); return fx.totalOrders; } },
  product: {
    count: async (args) => {
      calls.productCount.push(args);
      // First call (no args) = total, second (PENDING_REVIEW) = pending
      return calls.productCount.length === 1 ? fx.totalProducts : fx.pendingProducts;
    },
    findMany: async (args) => {
      calls.productFindMany.push(args);
      return fx.pendingProductsList;
    },
  },
  inquiry: { count: async () => fx.totalInquiries },
  role: { count: async () => fx.totalRoles },
  permission: { count: async () => fx.totalPermissions },
  systemSetting: {
    findUnique: async (args) => {
      calls.systemSettingFindUnique.push(args);
      return args.where.key === 'inquiry.subscription_enforcement' ? fx.inquirySetting : fx.systemSetting;
    },
    upsert: async (args) => {
      calls.systemSettingUpsert.push(args);
      const setting = { value: args.update?.value || args.create?.value };
      if (args.where.key === 'inquiry.subscription_enforcement') fx.inquirySetting = setting;
      else fx.systemSetting = setting;
      return {
        create: {
          value: args.create?.value || args.update?.value,
          updatedByUserId: args.create?.updatedByUserId || args.update?.updatedByUserId,
        },
      };
    },
  },
  inquiryPlan: {
    findUnique: async () => fx.inquiryPlanById,
    create: async () => fx.inquiryPlanCreated,
    update: async () => fx.inquiryPlanUpdated,
  },
  inquirySubscription: { count: async () => fx.inquirySubscriptionCount },
  notificationFolder: {
    findUnique: async (args) => args.where.key ? fx.folderByKey : fx.folderById,
    create: async () => fx.folderCreated,
    update: async () => fx.folderUpdated,
  },
  auditLog: {
    findUnique: async ({ where }) => fx.auditByIdempotencyKey?.idempotencyKey === where.idempotencyKey ? fx.auditByIdempotencyKey : null,
    create: async (args) => {
      calls.auditLogCreate = calls.auditLogCreate || [];
      calls.auditLogCreate.push(args);
      if (args.data.idempotencyKey) fx.auditByIdempotencyKey = { id: 99, ...args.data };
      return { id: 1 };
    },
  },
};

injectMock('../../config/db', mockPrisma);
const dispatchCalls = [];
injectMock('../notifications/notification.dispatch.service', {
  dispatchNotification: async (...args) => {
    dispatchCalls.push(args);
    return {
      recipients: args[1].length,
      inApp: { created: 2, duplicates: 0 },
      email: { queued: 1, duplicates: 0, preferenceDisabled: 0, noEmailAddress: 0 },
      sms: { notImplemented: 0 },
    };
  },
});

const { getStats, getSettings, updateReviewEditThreshold, updateInquiryMonetizationSettings, createInquiryPlan, updateInquiryPlan, createNotificationFolder, updateNotificationFolder, sendNotification } = require('./admin.service');

test('sendNotification: outbox and idempotency audit are transaction-bound', async () => {
  resetMocks();
  dispatchCalls.length = 0;
  fx.recentUsers = [{ id: 10, email: 'a@example.com' }, { id: 11, email: 'b@example.com' }];
  const actor = { id: 9, accessType: 'STAFF' };
  const input = {
    title: 'Service update',
    message: 'Scheduled maintenance',
    audience: 'ALL_ACTIVE',
    channels: ['IN_APP', 'EMAIL'],
    idempotencyKey: 'campaign-key-123456',
  };
  const result = await sendNotification(input, actor);

  assert.equal(result.recipients, 2);
  assert.equal(result.inAppCreated, 2);
  assert.equal(result.emailQueued, 1);
  assert.equal(dispatchCalls.length, 1);
  assert.equal(dispatchCalls[0][3].tx, mockPrisma);
  assert.equal(dispatchCalls[0][3].dedupeKey(10), 'campaign-key-123456:10');
  assert.equal(calls.auditLogCreate[0].data.action, 'ADMIN_ANNOUNCEMENT_SENT');
  assert.equal(calls.auditLogCreate[0].data.idempotencyKey, input.idempotencyKey);
  assert.equal(calls.auditLogCreate[0].data.actorUserId, 9);
  assert.equal(calls.transactions.length, 1);
});

test('sendNotification: a retry returns the original result without redispatch', async () => {
  resetMocks();
  dispatchCalls.length = 0;
  fx.recentUsers = [{ id: 10, email: 'a@example.com' }];
  const actor = { id: 9, accessType: 'STAFF' };
  const input = { title: 'Notice', message: 'Message', audience: 'ALL_ACTIVE', channels: ['IN_APP'], idempotencyKey: 'stable-key-123456' };
  const first = await sendNotification(input, actor);
  const second = await sendNotification(input, actor);
  assert.deepEqual(second, first);
  assert.equal(dispatchCalls.length, 1);
  assert.equal(calls.auditLogCreate.length, 1);
});

test('sendNotification: rejects key reuse with a different payload and non-staff callers', async () => {
  resetMocks();
  dispatchCalls.length = 0;
  const actor = { id: 9, accessType: 'STAFF' };
  const input = { title: 'Notice', message: 'Message', audience: 'ALL_ACTIVE', channels: ['IN_APP'], idempotencyKey: 'stable-key-123456' };
  await sendNotification(input, actor);
  await assert.rejects(
    () => sendNotification({ ...input, message: 'Different' }, actor),
    (error) => error.statusCode === 409 && error.code === 'IDEMPOTENCY_KEY_REUSED',
  );
  await assert.rejects(
    () => sendNotification(input, { id: 10, accessType: 'COMPANY' }),
    (error) => error.statusCode === 403 && error.code === 'STAFF_CONTEXT_REQUIRED',
  );
});

test('getStats: assembles all counts into the counts object with correct key names', async () => {
  resetMocks();
  fx.totalUsers = 100;
  fx.activeUsers = 80;
  fx.totalCompanies = 15;
  fx.totalProducts = 300;
  fx.pendingProducts = 12;
  fx.totalInquiries = 50;
  fx.totalOrders = 8;
  fx.totalRoles = 6;
  fx.totalPermissions = 40;

  const result = await getStats();

  assert.deepEqual(result.counts, {
    users: 100,
    activeUsers: 80,
    companies: 15,
    products: 300,
    pendingProducts: 12,
    inquiries: 50,
    orders: 8,
    roles: 6,
    permissions: 40,
  });
});

test('getStats: recentUsers is capped at 5, ordered by createdAt desc', async () => {
  resetMocks();
  fx.recentUsers = [{ id: 1 }];

  await getStats();

  assert.equal(calls.userFindMany[0].take, 5);
  assert.deepEqual(calls.userFindMany[0].orderBy, { createdAt: 'desc' });
});

test('getStats: pendingProducts list is filtered to PENDING_REVIEW, capped at 20', async () => {
  resetMocks();
  fx.pendingProductsList = [{ id: 1, status: 'PENDING_REVIEW' }];

  const result = await getStats();

  assert.deepEqual(calls.productFindMany[0].where, { status: 'PENDING_REVIEW' });
  assert.equal(calls.productFindMany[0].take, 20);
  assert.deepEqual(result.pendingProducts, fx.pendingProductsList);
});

test('getStats: returns an empty-but-well-formed shape when there is no data yet', async () => {
  resetMocks();

  const result = await getStats();

  assert.deepEqual(result.counts, {
    users: 0,
    activeUsers: 0,
    companies: 0,
    products: 0,
    pendingProducts: 0,
    inquiries: 0,
    orders: 0,
    roles: 0,
    permissions: 0,
  });
  assert.deepEqual(result.recentUsers, []);
  assert.deepEqual(result.pendingProducts, []);
});

test('getSettings: falls back to the default review threshold when no setting exists', async () => {
  resetMocks();
  fx.systemSetting = null;
  const result = await getSettings();
  assert.deepEqual(result, { productReviewEditThreshold: 5 });
});

test('getSettings: reads the configured threshold', async () => {
  resetMocks();
  fx.systemSetting = { value: '7' };
  const result = await getSettings();
  assert.deepEqual(result, { productReviewEditThreshold: 7 });
});

test('updateReviewEditThreshold: persists setting and AuditLog in one transaction', async () => {
  resetMocks();
  fx.systemSetting = { value: '3' };
  const result = await updateReviewEditThreshold(4, 9);
  const upsert = calls.systemSettingUpsert[0];
  assert.equal(upsert.where.key, 'catalog.productReviewEditThreshold');
  assert.equal(upsert.create.value, '4');
  assert.equal(upsert.create.updatedByUserId, 9);
  assert.deepEqual(result, { productReviewEditThreshold: 4 });
  assert.equal(calls.transactions.length, 1);
  assert.equal(calls.auditLogCreate[0].data.action, 'ADMIN_SETTING_UPDATED');
  assert.equal(calls.auditLogCreate[0].data.actorUserId, 9);
  assert.equal(calls.auditLogCreate[0].data.metadata.before.value, 3);
  assert.equal(calls.auditLogCreate[0].data.metadata.after.value, 4);
});

test('updateInquiryMonetizationSettings: setting and AuditLog are transaction-bound', async () => {
  resetMocks();
  fx.inquirySetting = { value: 'false' };
  const result = await updateInquiryMonetizationSettings(true, 9);
  assert.deepEqual(result, { subscriptionEnforcement: true });
  assert.equal(calls.transactions.length, 1);
  assert.equal(calls.auditLogCreate[0].data.action, 'ADMIN_SETTING_UPDATED');
  assert.equal(calls.auditLogCreate[0].data.actorUserId, 9);
});

test('createInquiryPlan: writes plan and audit event in one transaction with actor', async () => {
  resetMocks();
  const actor = { id: 9, accessType: 'STAFF' };
  fx.inquiryPlanCreated = { id: 3, code: 'starter', name: 'Starter' };
  const result = await createInquiryPlan({
    code: 'starter', name: 'Starter', durationDays: 30, price: 100, currency: 'IRR',
  }, actor);
  assert.equal(result.id, 3);
  assert.equal(calls.transactions.length, 1);
  assert.equal(calls.auditLogCreate[0].data.action, 'INQUIRY_PLAN_CREATED');
  assert.equal(calls.auditLogCreate[0].data.actorUserId, actor.id);
});

test('updateInquiryPlan: uses the locked current row and records audit in the same transaction', async () => {
  resetMocks();
  const actor = { id: 9, accessType: 'STAFF' };
  fx.inquiryPlanById = { id: 3, name: 'Starter', durationDays: 30, price: 100, currency: 'IRR' };
  fx.inquiryPlanUpdated = { id: 3, name: 'Starter Plus' };
  const result = await updateInquiryPlan(3, { name: 'Starter Plus' }, actor);
  assert.equal(result.name, 'Starter Plus');
  assert.equal(calls.transactions.length, 1);
  assert.equal(calls.auditLogCreate[0].data.action, 'INQUIRY_PLAN_UPDATED');
  assert.equal(calls.auditLogCreate[0].data.actorUserId, actor.id);
  assert.equal(calls.auditLogCreate[0].data.metadata.before.name, 'Starter');
});

test('createNotificationFolder: folder and audit event are transaction-bound', async () => {
  resetMocks();
  const actor = { id: 9, accessType: 'STAFF' };
  fx.folderCreated = { id: 4, key: 'my-folder', name: 'My Folder' };
  const result = await createNotificationFolder({ name: 'My Folder', scope: 'WEBSITE' }, actor);
  assert.equal(result.id, 4);
  assert.equal(calls.transactions.length, 1);
  assert.equal(calls.auditLogCreate[0].data.action, 'NOTIFICATION_FOLDER_CHANGED');
  assert.equal(calls.auditLogCreate[0].data.actorUserId, actor.id);
});

test('updateNotificationFolder: update and audit event are transaction-bound', async () => {
  resetMocks();
  const actor = { id: 9, accessType: 'STAFF' };
  fx.folderById = { id: 4, isSystem: false, name: 'Old Folder' };
  fx.folderUpdated = { id: 4, isSystem: false, name: 'New Folder' };
  const result = await updateNotificationFolder(4, { name: 'New Folder' }, actor);
  assert.equal(result.name, 'New Folder');
  assert.equal(calls.transactions.length, 1);
  assert.equal(calls.auditLogCreate[0].data.action, 'NOTIFICATION_FOLDER_CHANGED');
  assert.equal(calls.auditLogCreate[0].data.actorUserId, actor.id);
});

test('updateReviewEditThreshold: rejects a non-positive value', async () => {
  resetMocks();
  await assert.rejects(
    () => updateReviewEditThreshold(0, 9),
    (err) => err.statusCode === 400 && err.code === 'INVALID_REVIEW_THRESHOLD'
  );
  await assert.rejects(
    () => updateReviewEditThreshold(2.5, 9),
    (err) => err.statusCode === 400 && err.code === 'INVALID_REVIEW_THRESHOLD'
  );
  assert.equal(calls.systemSettingUpsert.length, 0);
});