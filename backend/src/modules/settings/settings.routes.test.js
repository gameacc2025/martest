// مسیر فایل: backend/src/modules/settings/settings.routes.test.js
// =============================================================
// Integration tests — Settings routes (auth + schema wiring)
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
for (const name of ['getProfile', 'updateProfile', 'uploadAvatar', 'deleteAvatar', 'changePassword']) {
  trivialController[name] = async (request, reply) => {
    hit[name] = true;
    return reply.code(200).send({ ok: true });
  };
}
injectMock('./settings.controller', trivialController);

const settingsRoutes = require('./settings.routes');

async function buildApp() {
  const app = Fastify();
  app.decorate('authenticate', async (request, reply) => {
    const raw = request.headers['x-test-user'];
    if (!raw) {
      return reply.code(401).send({ error: true, code: 'UNAUTHORIZED', message: 'Authentication required.' });
    }
    request.user = JSON.parse(raw);
  });
  await app.register(settingsRoutes, { prefix: '/api/v1/settings' });
  await app.ready();
  return app;
}

test.beforeEach(() => { Object.keys(hit).forEach((k) => delete hit[k]); });

// ── GET /profile — requires authenticate ─────────────────────

test('GET /profile: requires authentication', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'GET',
    url: '/api/v1/settings/profile',
    headers: { 'x-test-user': JSON.stringify({ id: 1 }) },
  });
  assert.equal(res.statusCode, 200);
  assert.equal(hit.getProfile, true);
  await app.close();
});

test('GET /profile: without auth -> 401', async () => {
  const app = await buildApp();
  const res = await app.inject({ method: 'GET', url: '/api/v1/settings/profile' });
  assert.equal(res.statusCode, 401);
  await app.close();
});

// ── PATCH /profile — requires authenticate ───────────────────

test('PATCH /profile: requires authentication', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'PATCH',
    url: '/api/v1/settings/profile',
    headers: { 'x-test-user': JSON.stringify({ id: 1 }) },
    payload: { firstName: 'Ali' },
  });
  assert.equal(res.statusCode, 200);
  assert.equal(hit.updateProfile, true);
  await app.close();
});

test('PATCH /profile: without auth -> 401', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'PATCH',
    url: '/api/v1/settings/profile',
    payload: { firstName: 'Ali' },
  });
  assert.equal(res.statusCode, 401);
  await app.close();
});

// ── POST /profile/avatar — requires authenticate ─────────────

test('POST /profile/avatar: requires authentication', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'POST',
    url: '/api/v1/settings/profile/avatar',
    headers: { 'x-test-user': JSON.stringify({ id: 1 }) },
  });
  assert.equal(res.statusCode, 200);
  assert.equal(hit.uploadAvatar, true);
  await app.close();
});

// ── DELETE /profile/avatar — requires authenticate ───────────

test('DELETE /profile/avatar: requires authentication', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'DELETE',
    url: '/api/v1/settings/profile/avatar',
    headers: { 'x-test-user': JSON.stringify({ id: 1 }) },
  });
  assert.equal(res.statusCode, 200);
  assert.equal(hit.deleteAvatar, true);
  await app.close();
});

test('DELETE /profile/avatar: without auth -> 401', async () => {
  const app = await buildApp();
  const res = await app.inject({ method: 'DELETE', url: '/api/v1/settings/profile/avatar' });
  assert.equal(res.statusCode, 401);
  await app.close();
});

// ── PATCH /change-password — requires authenticate ───────────

test('PATCH /change-password: requires authentication', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'PATCH',
    url: '/api/v1/settings/change-password',
    headers: { 'x-test-user': JSON.stringify({ id: 1 }) },
    payload: { currentPassword: 'old123', newPassword: 'new123456' },
  });
  assert.equal(res.statusCode, 200);
  assert.equal(hit.changePassword, true);
  await app.close();
});

test('PATCH /change-password: without auth -> 401', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'PATCH',
    url: '/api/v1/settings/change-password',
    payload: { currentPassword: 'old123', newPassword: 'new123456' },
  });
  assert.equal(res.statusCode, 401);
  await app.close();
});

test('PATCH /change-password: missing required fields -> 400 (schema validation)', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'PATCH',
    url: '/api/v1/settings/change-password',
    headers: { 'x-test-user': JSON.stringify({ id: 1 }) },
    payload: { currentPassword: 'old123' },
  });
  assert.equal(res.statusCode, 400);
  assert.equal(hit.changePassword, undefined);
  await app.close();
});
