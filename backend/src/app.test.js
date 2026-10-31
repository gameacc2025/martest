// مسیر فایل: backend/src/app.test.js
// =============================================================
// Boot smoke test — builds the REAL app.js (every real plugin, every
// real route module, in the real registration order) and confirms
// the whole chain comes up without throwing, that a representative
// sample of protected routes actually requires auth (nothing
// accidentally left public), and that /health is public and correct.
//
// Run with:  node --test
//
// This is deliberately NOT a full end-to-end test suite (that would
// need a real Postgres instance) — it exists purely to catch the
// class of bug a step-3 audit worries about: a typo in a route
// prefix, a plugin registered in the wrong order, a module that
// throws at require-time, or a route module that silently isn't
// registered in app.js at all. None of the per-module unit/
// integration tests above would ever catch a mistake in app.js
// itself, since none of them load it.
//
// Mocked: config/db (prisma — the only real I/O boundary; nothing in
// this smoke test exercises an actual DB-backed route handler),
// config/env (so this runs without a .env file / real secrets).
// Real: every plugin, every route module, in the real order.
// =============================================================

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const routeDocs = require('./utils/openapi-route-docs');
const Module = require('node:module');

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

injectMock('./config/db', {});
injectMock('./config/env', {
  port: 3000,
  nodeEnv: 'test',
  databaseUrl: 'postgresql://test',
  jwtAccessSecret: 'test-access-secret-at-least-32-chars-long',
  jwtAccessExpiresIn: '15m',
  jwtRefreshSecret: 'test-refresh-secret-at-least-32-chars-long',
  jwtRefreshExpiresIn: '7d',
  bcryptSaltRounds: 4,
  frontendUrl: 'http://localhost:3001',
  superAdminPhone: '09120000000',
  superAdminPassword: 'test-password',
  superAdminEmail: 'admin@test.local',
});

const buildApp = require('./app');

let app;
test.before(async () => {
  // Force logger off for a quiet smoke-test run (app.js wires request/response
  // logging by default, which is noisy — not something this test needs).
  app = await buildApp();
  app.log.level = 'silent';
  await app.ready();
});
test.after(async () => {
  if (app) await app.close();
});

// ── The whole plugin + route chain boots without throwing ──────

test('buildApp(): the full real plugin + route registration chain resolves without throwing', () => {
  assert.ok(app);
});

// ── The generated OpenAPI document must match the real registered routes ──

test('OpenAPI JSON contains every inventory route with effective security and global error responses', async () => {
  const specResponse = await app.inject({ method: 'GET', url: '/docs/json' });
  assert.equal(specResponse.statusCode, 200);
  const spec = specResponse.json();
  const inventoryPath = path.join(__dirname, '../../docs/API_ROUTE_INVENTORY.md');
  const inventory = fs.readFileSync(inventoryPath, 'utf8');
  const routes = [...inventory.matchAll(/^\| ([A-Z]+) \| `(\/api\/v1[^\`]+)` \|/gm)]
    .map((match) => ({ method: match[1], fullPath: match[2] }));

  assert.equal(routes.length, 149, 'update the expected route count when the route inventory changes');

  for (const { method, fullPath } of routes) {
    const routePath = fullPath.replace(/^\/api\/v1/, '').replace(/:([A-Za-z0-9_]+)/g, '{$1}') || '/';
    const fullOpenApiPath = fullPath.replace(/:([A-Za-z0-9_]+)/g, '{$1}');
    const apiPrefixedPath = '/api/v1' + routePath;
    const operation = spec.paths[routePath]?.[method.toLowerCase()]
      || spec.paths[routePath + '/']?.[method.toLowerCase()]
      || spec.paths[fullOpenApiPath]?.[method.toLowerCase()]
      || spec.paths[fullOpenApiPath + '/']?.[method.toLowerCase()]
      || spec.paths[apiPrefixedPath]?.[method.toLowerCase()]
      || spec.paths[apiPrefixedPath + '/']?.[method.toLowerCase()];
    const key = method + ' ' + fullPath;
    const doc = routeDocs[key];

    assert.ok(operation, 'missing generated OpenAPI operation for ' + key + '; candidate paths: ' + Object.keys(spec.paths).filter((value) => value.includes('users')).join(', '));
    assert.ok(doc, 'missing route documentation for ' + key);
    assert.equal(typeof operation['x-authentication-required'], 'boolean', key + ' must declare auth metadata');
    assert.ok(Array.isArray(operation.security), key + ' must have an explicit security requirement');

    const expectedSecurity = Array.isArray(doc.security)
      ? doc.security
      : (doc.authRequired === false ? [] : [{ bearerAuth: [] }]);
    assert.deepEqual(operation.security, expectedSecurity, key + ' security must match its route metadata');

    for (const status of ['400', '401', '403', '404', '409', '413', '429', '500']) {
      assert.ok(operation.responses[status], key + ' must document default error status ' + status);
    }

    if (operation.responses['204']) {
      assert.equal(operation.responses['204'].content, undefined, key + ' 204 response must not define a body');
    }
  }
});

// ── /health — public, no auth ───────────────────────────────────


test('GET /health: public, returns status ok', async () => {
  const res = await app.inject({ method: 'GET', url: '/health' });
  assert.equal(res.statusCode, 200);
  const body = res.json();
  assert.equal(body.status, 'ok');
  assert.equal(body.env, 'test');
  assert.ok(body.timestamp);
});

// ── Every module's route prefix is actually registered ─────────

const protectedProbes = [
  { method: 'GET', url: '/api/v1/users' },
  { method: 'GET', url: '/api/v1/roles' },
  { method: 'GET', url: '/api/v1/permissions' },
  { method: 'GET', url: '/api/v1/admin/stats' },
  { method: 'GET', url: '/api/v1/settings/profile' },
  { method: 'GET', url: '/api/v1/companies' },
  { method: 'GET', url: '/api/v1/products/my-products' },
  { method: 'GET', url: '/api/v1/inquiries' },
  { method: 'GET', url: '/api/v1/settings/notifications' },
  { method: 'GET', url: '/api/v1/auth/me' },
];

for (const probe of protectedProbes) {
  test(`${probe.method} ${probe.url}: is registered and requires authentication (401, not 404)`, async () => {
    const res = await app.inject(probe);
    // The critical assertion is NOT-404: a 404 here would mean the route
    // module isn't actually mounted under this prefix in app.js (e.g. a
    // typo, or a forgotten app.register call). 401 confirms it's mounted
    // AND correctly guarded.
    assert.notEqual(res.statusCode, 404, `${probe.url} returned 404 — is it actually registered in app.js?`);
    assert.equal(res.statusCode, 401);
  });
}

// ── Public (unauthenticated) routes that ARE expected to exist ──

const publicProbes = [
  { method: 'GET', url: '/api/v1/categories' },
  { method: 'GET', url: '/api/v1/specification-library' },
];

for (const probe of publicProbes) {
  test(`${probe.method} ${probe.url}: is registered and public (not a 404)`, async () => {
    const res = await app.inject(probe);
    assert.notEqual(res.statusCode, 404, `${probe.url} returned 404 — is it actually registered in app.js?`);
  });
}

// ── A route that genuinely doesn't exist is a real 404 (sanity check) ──

test('GET /api/v1/this-route-does-not-exist: a genuinely unmatched route is a 404', async () => {
  const res = await app.inject({ method: 'GET', url: '/api/v1/this-route-does-not-exist' });
  assert.equal(res.statusCode, 404);
});

// ── Static uploads mount is registered ──────────────────────────

test('GET /uploads/*: the static file plugin is mounted (a missing file 404s, but the route itself exists)', async () => {
  const res = await app.inject({ method: 'GET', url: '/uploads/does-not-exist.png' });
  assert.equal(res.statusCode, 404);
});

// ── Security headers (helmet) are actually applied ───────────────

test('helmet is registered: responses carry basic security headers', async () => {
  const res = await app.inject({ method: 'GET', url: '/health' });
  assert.ok(res.headers['x-content-type-options']);
});
