// مسیر فایل: backend/src/modules/admin/admin.routes.test.js
// =============================================================
// Integration tests — Admin routes (permission wiring)
//
// Run with:  node --test
// =============================================================

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const Module = require('node:module');
const Fastify = require('fastify');

function injectMock(relativePath, exportsObj) {
  const resolved = require.resolve(path.join(__dirname, relativePath));
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

injectMock('../../config/db', {});

const hit = {};
const trivialController = {
  getInquiryMonetizationSettingsCtrl: async (request, reply) => reply.code(200).send({ data: { subscriptionEnforcement: false } }),
  updateInquiryMonetizationSettingsCtrl: async (request, reply) => reply.code(200).send({ data: { subscriptionEnforcement: request.body.subscriptionEnforcement } }),
  listInquiryPlansCtrl: async (request, reply) => reply.code(200).send({ data: [] }),
  createInquiryPlanCtrl: async (request, reply) => reply.code(201).send({ data: request.body }),
  updateInquiryPlanCtrl: async (request, reply) => reply.code(200).send({ data: { id: Number(request.params.id), ...request.body } }),
  listInquirySubscriptionsCtrl: async (request, reply) => reply.code(200).send({ data: [] }),
  grantInquirySubscriptionCtrl: async (request, reply) => reply.code(201).send({ data: request.body }),
  activatePendingInquirySubscriptionCtrl: async (request, reply) => reply.code(200).send({ data: { id: Number(request.params.id), status: 'ACTIVE' } }),
  rejectPendingInquirySubscriptionCtrl: async (request, reply) => reply.code(200).send({ data: { id: Number(request.params.id), status: 'CANCELLED' } }),
  activateInquirySubscriptionCtrl: async (request, reply) => reply.code(200).send({ data: { id: Number(request.params.id), status: 'ACTIVE' } }),
  getStats: async (request, reply) => {
    hit.getStats = true;
    return reply.code(200).send({ ok: true });
  },
  getSettings: async (request, reply) => {
    hit.getSettings = true;
    return reply.code(200).send({ productReviewEditThreshold: 5 });
  },
  updateReviewEditThreshold: async (request, reply) => {
    hit.updateReviewEditThreshold = request.body;
    return reply.code(200).send({ productReviewEditThreshold: request.body.value });
  },
  sendNotificationCtrl: async (request, reply) => {
    hit.sendNotification = request.body;
    return reply.code(202).send({ data: { recipients: 3 } });
  },
  getDeliveryStatsCtrl: async (request, reply) => reply.code(200).send({ data: {} }),
  listDeliveriesCtrl: async (request, reply) => reply.code(200).send({ data: [], meta: { total: 0, totalPages: 1 } }),
  listNotificationFoldersCtrl: async (request, reply) => {
    hit.listNotificationFolders = true;
    return reply.code(200).send({ data: [] });
  },
  createNotificationFolderCtrl: async (request, reply) => {
    hit.createNotificationFolder = request.body;
    return reply.code(201).send({ data: { id: 1, ...request.body } });
  },
  updateNotificationFolderCtrl: async (request, reply) => {
    hit.updateNotificationFolder = { id: Number(request.params.id), body: request.body };
    return reply.code(200).send({ data: { id: Number(request.params.id), ...request.body } });
  },
};
injectMock('./admin.controller', trivialController);

const adminRoutes = require('./admin.routes');

async function buildApp() {
  const app = Fastify();
  app.decorate('authenticate', async (request, reply) => {
    const raw = request.headers['x-test-user'];
    if (!raw) {
      return reply.code(401).send({ error: true, code: 'UNAUTHORIZED', message: 'Authentication required.' });
    }
    request.user = JSON.parse(raw);
  });
  await app.register(adminRoutes, { prefix: '/api/v1/admin' });
  await app.ready();
  return app;
}

function userHeader(permissions, { accessType = 'STAFF', roles = [] } = {}) {
  return { 'x-test-user': JSON.stringify({ accessType, roles, permissions }) };
}

test.beforeEach(() => { Object.keys(hit).forEach((k) => delete hit[k]); });

test('POST /notifications/send: requires notifications.send and forwards validated payload', async () => {
  const app = await buildApp();
  const payload = { title: 'اطلاعیه', message: 'متن اطلاعیه', audience: 'CUSTOMER', channels: ['IN_APP', 'EMAIL'] };
  const res = await app.inject({
    method: 'POST',
    url: '/api/v1/admin/notifications/send',
    headers: userHeader(['notifications.send']),
    payload,
  });
  assert.equal(res.statusCode, 202);
  assert.deepEqual(hit.sendNotification, payload);
  await app.close();
});

test('POST /notifications/send: rejects invalid audience and missing permission', async () => {
  const app = await buildApp();
  const denied = await app.inject({
    method: 'POST', url: '/api/v1/admin/notifications/send',
    headers: userHeader(['users.read']),
    payload: { title: 'اطلاعیه', message: 'متن', audience: 'CUSTOMER', channels: ['IN_APP'] },
  });
  assert.equal(denied.statusCode, 403);
  const invalid = await app.inject({
    method: 'POST', url: '/api/v1/admin/notifications/send',
    headers: userHeader(['notifications.send']),
    payload: { title: 'اطلاعیه', message: 'متن', audience: 'UNKNOWN', channels: ['IN_APP'] },
  });
  assert.equal(invalid.statusCode, 400);
  await app.close();
});

test('GET /stats: requires users.read permission', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'GET',
    url: '/api/v1/admin/stats',
    headers: userHeader(['users.read']),
  });
  assert.equal(res.statusCode, 200);
  assert.equal(hit.getStats, true);
  await app.close();
});

test('GET /stats: without permission -> 403', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'GET',
    url: '/api/v1/admin/stats',
    headers: userHeader([]),
  });
  assert.equal(res.statusCode, 403);
  assert.equal(hit.getStats, undefined);
  await app.close();
});

test('GET /stats: without auth -> 401', async () => {
  const app = await buildApp();
  const res = await app.inject({ method: 'GET', url: '/api/v1/admin/stats' });
  assert.equal(res.statusCode, 401);
  await app.close();
});

test('GET /stats: SUPER_ADMIN bypasses permission check', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'GET',
    url: '/api/v1/admin/stats',
    headers: { 'x-test-user': JSON.stringify({ accessType: 'STAFF', roles: ['SUPER_ADMIN'], permissions: ['*'] }) },
  });
  assert.equal(res.statusCode, 200);
  assert.equal(hit.getStats, true);
  await app.close();
});

test('COMPANY context cannot access admin settings or statistics with SUPER_ADMIN wildcard permissions', async () => {
  const app = await buildApp();
  const headers = userHeader(['*'], { accessType: 'COMPANY', roles: ['SUPER_ADMIN'] });
  const stats = await app.inject({ method: 'GET', url: '/api/v1/admin/stats', headers });
  assert.equal(stats.statusCode, 403);
  assert.equal(hit.getStats, undefined);

  const settings = await app.inject({ method: 'GET', url: '/api/v1/admin/settings', headers });
  assert.equal(settings.statusCode, 403);
  assert.equal(hit.getSettings, undefined);
  await app.close();
});

test('GET /settings: requires system_settings.manage permission', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'GET',
    url: '/api/v1/admin/settings',
    headers: userHeader(['system_settings.manage']),
  });
  assert.equal(res.statusCode, 200);
  assert.equal(hit.getSettings, true);
  await app.close();
});

test('GET /settings: without permission -> 403 (users.read is not enough)', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'GET',
    url: '/api/v1/admin/settings',
    headers: userHeader(['users.read']),
  });
  assert.equal(res.statusCode, 403);
  assert.equal(hit.getSettings, undefined);
  await app.close();
});

test('PATCH /settings/product-review-threshold: validates body and forwards it', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'PATCH',
    url: '/api/v1/admin/settings/product-review-threshold',
    headers: userHeader(['system_settings.manage']),
    payload: { value: 3 },
  });
  assert.equal(res.statusCode, 200);
  assert.deepEqual(hit.updateReviewEditThreshold, { value: 3 });
  await app.close();
});

test('PATCH /settings/product-review-threshold: rejects a non-positive value (schema)', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'PATCH',
    url: '/api/v1/admin/settings/product-review-threshold',
    headers: userHeader(['system_settings.manage']),
    payload: { value: 0 },
  });
  assert.equal(res.statusCode, 400);
  assert.equal(hit.updateReviewEditThreshold, undefined);
  await app.close();
});

test('PATCH /settings/product-review-threshold: SUPER_ADMIN bypasses permission check', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'PATCH',
    url: '/api/v1/admin/settings/product-review-threshold',
    headers: { 'x-test-user': JSON.stringify({ accessType: 'STAFF', roles: ['SUPER_ADMIN'], permissions: ['*'] }) },
    payload: { value: 7 },
  });
  assert.equal(res.statusCode, 200);
  assert.deepEqual(hit.updateReviewEditThreshold, { value: 7 });
  await app.close();
});


test('GET /notifications/folders: requires system_settings.manage permission', async () => {
  const app = await buildApp();
  const allowed = await app.inject({
    method: 'GET',
    url: '/api/v1/admin/notifications/folders',
    headers: userHeader(['system_settings.manage']),
  });
  assert.equal(allowed.statusCode, 200);
  assert.equal(hit.listNotificationFolders, true);

  const denied = await app.inject({
    method: 'GET',
    url: '/api/v1/admin/notifications/folders',
    headers: userHeader(['users.read']),
  });
  assert.equal(denied.statusCode, 403);
  await app.close();
});

test('POST /notifications/folders: validates and forwards a permitted create request', async () => {
  const app = await buildApp();
  const payload = { name: 'پیگیری', scope: 'COMPANY', sortOrder: 2 };
  const res = await app.inject({
    method: 'POST',
    url: '/api/v1/admin/notifications/folders',
    headers: userHeader(['system_settings.manage']),
    payload,
  });
  assert.equal(res.statusCode, 201);
  assert.deepEqual(hit.createNotificationFolder, payload);
  await app.close();
});

test('PATCH /notifications/folders/:id: validates and forwards a permitted update request', async () => {
  const app = await buildApp();
  const payload = { name: 'پیگیری‌های مهم', isActive: true };
  const res = await app.inject({
    method: 'PATCH',
    url: '/api/v1/admin/notifications/folders/3',
    headers: userHeader(['system_settings.manage']),
    payload,
  });
  assert.equal(res.statusCode, 200);
  assert.deepEqual(hit.updateNotificationFolder, { id: 3, body: payload });
  await app.close();
});
