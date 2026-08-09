// مسیر فایل: backend/src/modules/notifications/notification.routes.test.js
// =============================================================
// Integration tests — Notification routes (auth wiring)
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
const trivialController = {};
for (const name of ['list', 'getUnreadCount', 'markAsRead', 'markAllAsRead', 'remove']) {
  trivialController[name] = async (request, reply) => {
    hit[name] = true;
    return reply.code(200).send({ ok: true });
  };
}
injectMock('./notification.controller', trivialController);

const notificationRoutes = require('./notification.routes');

async function buildApp() {
  const app = Fastify();
  app.decorate('authenticate', async (request, reply) => {
    const raw = request.headers['x-test-user'];
    if (!raw) {
      return reply.code(401).send({ error: true, code: 'UNAUTHORIZED', message: 'Authentication required.' });
    }
    request.user = JSON.parse(raw);
  });
  await app.register(notificationRoutes, { prefix: '/api/v1/notifications' });
  await app.ready();
  return app;
}

test.beforeEach(() => { Object.keys(hit).forEach((k) => delete hit[k]); });

test('GET /: requires authentication', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'GET',
    url: '/api/v1/notifications',
    headers: { 'x-test-user': JSON.stringify({ id: 1 }) },
  });
  assert.equal(res.statusCode, 200);
  assert.equal(hit.list, true);
  await app.close();
});

test('GET /: without auth -> 401', async () => {
  const app = await buildApp();
  const res = await app.inject({ method: 'GET', url: '/api/v1/notifications' });
  assert.equal(res.statusCode, 401);
  await app.close();
});

test('GET /unread-count: requires authentication', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'GET',
    url: '/api/v1/notifications/unread-count',
    headers: { 'x-test-user': JSON.stringify({ id: 1 }) },
  });
  assert.equal(res.statusCode, 200);
  assert.equal(hit.getUnreadCount, true);
  await app.close();
});

test('PATCH /:id/read: requires authentication', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'PATCH',
    url: '/api/v1/notifications/1/read',
    headers: { 'x-test-user': JSON.stringify({ id: 1 }) },
  });
  assert.equal(res.statusCode, 200);
  assert.equal(hit.markAsRead, true);
  await app.close();
});

test('PATCH /read-all: requires authentication', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'PATCH',
    url: '/api/v1/notifications/read-all',
    headers: { 'x-test-user': JSON.stringify({ id: 1 }) },
  });
  assert.equal(res.statusCode, 200);
  assert.equal(hit.markAllAsRead, true);
  await app.close();
});

test('DELETE /:id: requires authentication', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'DELETE',
    url: '/api/v1/notifications/1',
    headers: { 'x-test-user': JSON.stringify({ id: 1 }) },
  });
  assert.equal(res.statusCode, 200);
  assert.equal(hit.remove, true);
  await app.close();
});

test('DELETE /:id: without auth -> 401', async () => {
  const app = await buildApp();
  const res = await app.inject({ method: 'DELETE', url: '/api/v1/notifications/1' });
  assert.equal(res.statusCode, 401);
  await app.close();
});
