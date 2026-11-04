// مسیر فایل: backend/src/modules/companies/company.routes.test.js
// =============================================================
// Integration tests — Company routes (permission wiring)
//
// Run with:  node --test
//
// Unlike the controller/service unit tests, this spins up a REAL
// Fastify instance and registers the REAL company.routes.js +
// REAL middlewares/rbac.js, with only company.controller mocked
// (its logic is already covered by company.controller.test.js) and
// `fastify.authenticate` stubbed to read request.user straight off a
// test header. The thing actually under test here is the wiring
// itself: does each route really require the permission the module's
// header comment claims it does, and does a route with NO matching
// permission correctly 403 rather than silently falling through to
// the controller? A unit test on rbac.js alone can't catch a typo
// in a route's preHandler list — only registering the real route
// table can.
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

// `middlewares/rbac.js` doesn't touch the DB directly, but it imports
// `utils/rbac.js` for the SUPER_ADMIN_ROLE constant, and that file also
// exports DB-backed helpers used elsewhere — so it requires config/db at
// module load time. Stub it out so this test doesn't need a generated
// Prisma client.
injectMock('../../config/db', {});

const hit = {};
const trivialController = {};
for (const name of ['list', 'getOne', 'getProducts', 'getSettings', 'getStatistics', 'create', 'update', 'remove', 'restore', 'changeStatus', 'toggleVerify', 'updateLogo', 'updateSettings']) {
  trivialController[name] = async (request, reply) => {
    hit[name] = true;
    return reply.code(200).send({ ok: true });
  };
}
injectMock('./company.controller', trivialController);

const companyRoutes = require('./company.routes');

async function buildApp() {
  const app = Fastify();
  // Stub authenticate: reads the test-only `x-test-user` header (JSON) so
  // each test can control request.user without going through real JWTs
  // (JWT verification itself is covered by auth.plugin.test.js).
  app.decorate('authenticate', async (request) => {
    const raw = request.headers['x-test-user'];
    if (raw) request.user = JSON.parse(raw);
    // else: leave request.user unset, simulating "no valid token" so the
    // downstream rbac preHandlers correctly see no user and 401.
  });
  await app.register(companyRoutes, { prefix: '/api/v1/companies' });
  await app.ready();
  return app;
}

function userHeader(permissions, { accessType = 'STAFF', companyId = null, roles = [] } = {}) {
  return { 'x-test-user': JSON.stringify({ accessType, companyId, roles, permissions }) };
}

test.beforeEach(() => { Object.keys(hit).forEach((k) => delete hit[k]); });

const cases = [
  { method: 'GET', url: '/api/v1/companies', controllerFn: 'list', anyOf: ['companies.read'] },
  { method: 'GET', url: '/api/v1/companies/1', controllerFn: 'getOne', anyOf: ['companies.read'] },
  { method: 'GET', url: '/api/v1/companies/1/products', controllerFn: 'getProducts', anyOf: ['companies.read'] },
  { method: 'GET', url: '/api/v1/companies/1/settings', controllerFn: 'getSettings', anyOf: ['companies.read', 'companies.manage_settings'] },
  { method: 'GET', url: '/api/v1/companies/1/statistics', controllerFn: 'getStatistics', anyOf: ['companies.view_statistics'] },
  { method: 'POST', url: '/api/v1/companies', controllerFn: 'create', anyOf: ['companies.create'] },
  { method: 'PATCH', url: '/api/v1/companies/1', controllerFn: 'update', anyOf: ['companies.update', 'company_profile.update'] },
  { method: 'DELETE', url: '/api/v1/companies/1', controllerFn: 'remove', anyOf: ['companies.delete'] },
  { method: 'PATCH', url: '/api/v1/companies/1/restore', controllerFn: 'restore', anyOf: ['companies.restore'] },
  { method: 'PATCH', url: '/api/v1/companies/1/status', controllerFn: 'changeStatus', anyOf: ['companies.activate', 'companies.deactivate'] },
  { method: 'PATCH', url: '/api/v1/companies/1/verify', controllerFn: 'toggleVerify', anyOf: ['companies.update'] },
  { method: 'PATCH', url: '/api/v1/companies/1/logo', controllerFn: 'updateLogo', anyOf: ['companies.update', 'company_profile.update'] },
  { method: 'PATCH', url: '/api/v1/companies/1/settings', controllerFn: 'updateSettings', anyOf: ['companies.manage_settings'] },
];

for (const c of cases) {
  test(`${c.method} ${c.url}: with ${c.anyOf[0]} the request reaches the controller (200)`, async () => {
    const app = await buildApp();
    const res = await app.inject({ method: c.method, url: c.url, headers: userHeader([c.anyOf[0]]), payload: {} });
    assert.equal(res.statusCode, 200);
    assert.equal(hit[c.controllerFn], true);
    await app.close();
  });

  test(`${c.method} ${c.url}: with NO matching permission -> 403, controller never called`, async () => {
    const app = await buildApp();
    const res = await app.inject({ method: c.method, url: c.url, headers: userHeader(['some.unrelated.permission']), payload: {} });
    assert.equal(res.statusCode, 403);
    assert.equal(hit[c.controllerFn], undefined);
    await app.close();
  });

  test(`${c.method} ${c.url}: with no request.user at all -> 401`, async () => {
    const app = await buildApp();
    const res = await app.inject({ method: c.method, url: c.url, payload: {} });
    assert.equal(res.statusCode, 401);
    await app.close();
  });
}

// ── requireAnyPermission routes accept the SECOND listed permission too ──

test('GET /:id/settings: also accepts companies.manage_settings alone (requireAnyPermission, not requirePermission)', async () => {
  const app = await buildApp();
  const res = await app.inject({ method: 'GET', url: '/api/v1/companies/1/settings', headers: userHeader(['companies.manage_settings']) });
  assert.equal(res.statusCode, 200);
  await app.close();
});

test('PATCH /:id: also accepts company_profile.update alone', async () => {
  const app = await buildApp();
  const res = await app.inject({ method: 'PATCH', url: '/api/v1/companies/1', headers: userHeader(['company_profile.update']), payload: {} });
  assert.equal(res.statusCode, 200);
  await app.close();
});

// ── SUPER_ADMIN wildcard bypass ────────────────────────────────

test('a SUPER_ADMIN (permissions: ["*"]) can hit every route regardless of the specific permission required', async () => {
  const app = await buildApp();
  for (const c of cases) {
    const res = await app.inject({ method: c.method, url: c.url, headers: userHeader(['*']), payload: {} });
    assert.equal(res.statusCode, 200, `${c.method} ${c.url} should be 200 for a wildcard SUPER_ADMIN`);
  }
  await app.close();
});

// ── every route requires authentication (onRequest hook) ──────

test('COMPANY context can read its own company with company_profile.read', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'GET',
    url: '/api/v1/companies/10',
    headers: userHeader(['company_profile.read'], { accessType: 'COMPANY', companyId: 10 }),
  });
  assert.equal(res.statusCode, 200);
  assert.equal(hit.getOne, true);
  await app.close();
});

test('COMPANY context with SUPER_ADMIN role can read only its own company', async () => {
  const app = await buildApp();
  const own = await app.inject({
    method: 'GET',
    url: '/api/v1/companies/10',
    headers: userHeader(['*'], { accessType: 'COMPANY', companyId: 10, roles: ['SUPER_ADMIN'] }),
  });
  assert.equal(own.statusCode, 200);
  assert.equal(hit.getOne, true);

  delete hit.getOne;
  const other = await app.inject({
    method: 'GET',
    url: '/api/v1/companies/11',
    headers: userHeader(['*'], { accessType: 'COMPANY', companyId: 10, roles: ['SUPER_ADMIN'] }),
  });
  assert.equal(other.statusCode, 403);
  assert.equal(hit.getOne, undefined);
  await app.close();
});

test('COMPANY context cannot list companies or change company lifecycle with wildcard permissions', async () => {
  const app = await buildApp();
  const headers = userHeader(['*'], { accessType: 'COMPANY', companyId: 10, roles: ['SUPER_ADMIN'] });
  const list = await app.inject({ method: 'GET', url: '/api/v1/companies', headers });
  assert.equal(list.statusCode, 403);
  assert.equal(hit.list, undefined);

  const status = await app.inject({ method: 'PATCH', url: '/api/v1/companies/10/status', headers, payload: { status: 'SUSPENDED' } });
  assert.equal(status.statusCode, 403);
  assert.equal(hit.changeStatus, undefined);
  await app.close();
});

test('CUSTOMER context cannot call company management endpoints with wildcard permissions', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'GET',
    url: '/api/v1/companies/10',
    headers: userHeader(['*'], { accessType: 'CUSTOMER', roles: ['SUPER_ADMIN'] }),
  });
  assert.equal(res.statusCode, 403);
  assert.equal(hit.getOne, undefined);
  await app.close();
});

test('COMPANY context may update its own profile through company_profile.update', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'PATCH',
    url: '/api/v1/companies/10',
    headers: userHeader(['company_profile.update'], { accessType: 'COMPANY', companyId: 10 }),
    payload: { name: 'Updated' },
  });
  assert.equal(res.statusCode, 200);
  assert.equal(hit.update, true);
  await app.close();
});

test('every registered route runs fastify.authenticate first — none are left accidentally public', async () => {
  const app = await buildApp();
  for (const c of cases) {
    const res = await app.inject({ method: c.method, url: c.url, payload: {} });
    assert.equal(res.statusCode, 401, `${c.method} ${c.url} should require authentication`);
  }
  await app.close();
});


// ── company tenant boundary coverage for remaining company-scoped routes ──

test('COMPANY context can read only its own company product listing', async () => {
  const app = await buildApp();
  const own = await app.inject({
    method: 'GET',
    url: '/api/v1/companies/10/products',
    headers: userHeader(['companies.read'], { accessType: 'COMPANY', companyId: 10 }),
  });
  assert.equal(own.statusCode, 200);
  assert.equal(hit.getProducts, true);

  delete hit.getProducts;
  const other = await app.inject({
    method: 'GET',
    url: '/api/v1/companies/11/products',
    headers: userHeader(['companies.read'], { accessType: 'COMPANY', companyId: 10 }),
  });
  assert.equal(other.statusCode, 403);
  assert.equal(hit.getProducts, undefined);
  await app.close();
});

test('COMPANY context can read only its own company statistics', async () => {
  const app = await buildApp();
  const own = await app.inject({
    method: 'GET',
    url: '/api/v1/companies/10/statistics',
    headers: userHeader(['companies.view_statistics'], { accessType: 'COMPANY', companyId: 10 }),
  });
  assert.equal(own.statusCode, 200);
  assert.equal(hit.getStatistics, true);

  delete hit.getStatistics;
  const other = await app.inject({
    method: 'GET',
    url: '/api/v1/companies/11/statistics',
    headers: userHeader(['companies.view_statistics'], { accessType: 'COMPANY', companyId: 10 }),
  });
  assert.equal(other.statusCode, 403);
  assert.equal(hit.getStatistics, undefined);
  await app.close();
});

test('COMPANY context can update only its own company logo', async () => {
  const app = await buildApp();
  const own = await app.inject({
    method: 'PATCH',
    url: '/api/v1/companies/10/logo',
    headers: userHeader(['company_profile.update'], { accessType: 'COMPANY', companyId: 10 }),
    payload: { logo: 'logo.png' },
  });
  assert.equal(own.statusCode, 200);
  assert.equal(hit.updateLogo, true);

  delete hit.updateLogo;
  const other = await app.inject({
    method: 'PATCH',
    url: '/api/v1/companies/11/logo',
    headers: userHeader(['company_profile.update'], { accessType: 'COMPANY', companyId: 10 }),
    payload: { logo: 'logo.png' },
  });
  assert.equal(other.statusCode, 403);
  assert.equal(hit.updateLogo, undefined);
  await app.close();
});

test('COMPANY context cannot read or update company settings, even with wildcard permissions', async () => {
  const app = await buildApp();
  const headers = userHeader(['*'], { accessType: 'COMPANY', companyId: 10, roles: ['SUPER_ADMIN'] });

  const read = await app.inject({
    method: 'GET',
    url: '/api/v1/companies/10/settings',
    headers,
  });
  assert.equal(read.statusCode, 403);
  assert.equal(hit.getSettings, undefined);

  const update = await app.inject({
    method: 'PATCH',
    url: '/api/v1/companies/10/settings',
    headers,
    payload: { limits: { 'rfq.max_open': 99 } },
  });
  assert.equal(update.statusCode, 403);
  assert.equal(hit.updateSettings, undefined);
  await app.close();
});
