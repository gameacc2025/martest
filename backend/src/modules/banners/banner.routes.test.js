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
}

const calls = {};
const service = {};
for (const name of ['listPublic','listAdmin','getById','create','update','archive','uploadImage']) {
  service[name] = async (...args) => {
    calls[name] = args;
    if (name === 'listAdmin') return { data: [], meta: { page: 1, limit: 20, total: 0, totalPages: 0 } };
    if (name === 'listPublic') return [];
    return { id: 1, ...((args[0] && typeof args[0] === 'object') ? args[0] : {}) };
  };
}
injectMock('./banner.service', service);
const routes = require('./banner.routes');

async function buildApp() {
  const app = Fastify();
  app.decorate('authenticate', async (request, reply) => {
    const raw = request.headers['x-test-user'];
    if (!raw) return reply.code(401).send({ error: true, code: 'UNAUTHORIZED' });
    request.user = JSON.parse(raw);
  });
  await app.register(routes, { prefix: '/api/v1/banners' });
  await app.ready();
  return app;
}
const header = (accessType, permissions = []) => ({ 'x-test-user': JSON.stringify({ accessType, permissions, roles: [] }) });

test('public active banners do not require authentication', async () => {
  const app = await buildApp();
  const response = await app.inject({ method: 'GET', url: '/api/v1/banners/active?placement=HOME_HERO' });
  assert.equal(response.statusCode, 200);
  assert.deepEqual(calls.listPublic, ['HOME_HERO']);
  await app.close();
});

test('management endpoints require authentication', async () => {
  const app = await buildApp();
  const response = await app.inject({ method: 'GET', url: '/api/v1/banners/manage' });
  assert.equal(response.statusCode, 401);
  await app.close();
});

test('company access cannot enter staff banner management', async () => {
  const app = await buildApp();
  const response = await app.inject({ method: 'GET', url: '/api/v1/banners/manage', headers: header('COMPANY', ['banners.read']) });
  assert.equal(response.statusCode, 403);
  await app.close();
});

test('staff with banners.read can list banners', async () => {
  const app = await buildApp();
  const response = await app.inject({ method: 'GET', url: '/api/v1/banners/manage', headers: header('STAFF', ['banners.read']) });
  assert.equal(response.statusCode, 200);
  assert.ok(calls.listAdmin);
  await app.close();
});

test('staff without banners.create cannot create a banner', async () => {
  const app = await buildApp();
  const response = await app.inject({ method: 'POST', url: '/api/v1/banners/manage', headers: header('STAFF', ['banners.read']), payload: { title: 'جشنواره', imageUrl: '/uploads/banners/test.webp' } });
  assert.equal(response.statusCode, 403);
  await app.close();
});

test('staff with banners.create can create a valid banner', async () => {
  const app = await buildApp();
  const response = await app.inject({ method: 'POST', url: '/api/v1/banners/manage', headers: header('STAFF', ['banners.create']), payload: { title: 'جشنواره', imageUrl: '/uploads/banners/test.webp' } });
  assert.equal(response.statusCode, 201);
  assert.ok(calls.create);
  await app.close();
});

test('invalid create payload is rejected by route schema', async () => {
  const app = await buildApp();
  const response = await app.inject({ method: 'POST', url: '/api/v1/banners/manage', headers: header('STAFF', ['banners.create']), payload: { title: 'جشنواره' } });
  assert.equal(response.statusCode, 400);
  await app.close();
});
