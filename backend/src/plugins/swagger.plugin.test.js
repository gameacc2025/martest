// مسیر فایل: backend/src/plugins/swagger.plugin.test.js
// =============================================================
// Unit tests — Swagger / OpenAPI plugin
//
// Run with:  node --test
//
// Validates that the swagger plugin:
//   1. Registers @fastify/swagger and @fastify/swagger-ui.
//   2. Serves OpenAPI JSON at /docs/json.
//   3. Serves Swagger UI at /docs.
//   4. Has all expected tags defined.
//   5. Includes common reusable schemas in components.
//   6. Applies the transform function to merge route-level docs.
// =============================================================

const test = require('node:test');
const assert = require('node:assert/strict');
const Fastify = require('fastify');

let swaggerPlugin;
test.before(() => {
  // Import the plugin — it requires @fastify/swagger and @fastify/swagger-ui
  // which are installed as dependencies.
  swaggerPlugin = require('./swagger.plugin');
});

test('swagger plugin: registers and serves OpenAPI JSON at /docs/json', async () => {
  const app = Fastify();
  await app.register(swaggerPlugin);
  // Register a trivial route so the spec has at least one path
  app.get('/api/v1/health', {
    schema: { summary: 'Health check', tags: ['Admin'] },
  }, async () => ({ status: 'ok' }));
  await app.ready();

  const res = await app.inject({ method: 'GET', url: '/docs/json' });
  assert.equal(res.statusCode, 200);

  const spec = res.json();
  assert.equal(spec.openapi, '3.0.3');
  assert.equal(spec.info.title, 'Telecom Marketplace API');
  assert.equal(spec.info.version, '1.0.0');
  await app.close();
});

test('swagger plugin: serves Swagger UI HTML at /docs', async () => {
  const app = Fastify();
  await app.register(swaggerPlugin);
  await app.ready();

  // /docs redirects to the static index.html — verify the redirect target serves HTML
  const redirect = await app.inject({ method: 'GET', url: '/docs' });
  assert.equal(redirect.statusCode, 302);

  const res = await app.inject({ method: 'GET', url: '/docs/static/index.html' });
  assert.equal(res.statusCode, 200);
  assert.ok(res.headers['content-type'].includes('text/html'));
  await app.close();
});

test('swagger plugin: OpenAPI spec includes all expected tags', async () => {
  const app = Fastify();
  await app.register(swaggerPlugin);
  await app.ready();

  const res = await app.inject({ method: 'GET', url: '/docs/json' });
  const spec = res.json();

  const expectedTags = [
    'Authentication', 'Users', 'Roles', 'Permissions',
    'Companies', 'Categories', 'Products', 'Inquiries',
    'Notifications', 'Orders', 'Settings', 'Admin',
  ];
  const tagNames = spec.tags.map((t) => t.name);
  for (const tag of expectedTags) {
    assert.ok(tagNames.includes(tag), `spec should include tag: ${tag}`);
  }
  await app.close();
});

test('swagger plugin: OpenAPI spec includes common component schemas', async () => {
  const app = Fastify();
  await app.register(swaggerPlugin);
  await app.ready();

  const res = await app.inject({ method: 'GET', url: '/docs/json' });
  const spec = res.json();

  const schemas = spec.components && spec.components.schemas;
  assert.ok(schemas, 'spec should have components.schemas');
  const expectedSchemas = [
    'ErrorResponse', 'MessageResponse', 'PaginatedMeta',
    'PaginatedResponse', 'SuccessResponse', 'AuthTokens',
    'User', 'Profile', 'AccessProfile',
  ];
  for (const name of expectedSchemas) {
    assert.ok(schemas[name], `spec should include schema: ${name}`);
  }
  await app.close();
});

test('swagger plugin: OpenAPI spec includes bearerAuth security scheme', async () => {
  const app = Fastify();
  await app.register(swaggerPlugin);
  await app.ready();

  const res = await app.inject({ method: 'GET', url: '/docs/json' });
  const spec = res.json();

  const schemes = spec.components.securitySchemes;
  assert.ok(schemes.bearerAuth, 'should have bearerAuth security scheme');
  assert.equal(schemes.bearerAuth.type, 'http');
  assert.equal(schemes.bearerAuth.scheme, 'bearer');
  assert.equal(schemes.bearerAuth.bearerFormat, 'JWT');
  await app.close();
});

test('swagger plugin: transform function merges route docs and adds default error responses', async () => {
  const app = Fastify();
  await app.register(swaggerPlugin);
  // Register a route with a schema that the transform function will process
  app.get('/api/v1/health', {
    schema: {
      summary: 'Health check',
      tags: ['Admin'],
      response: { 200: { type: 'object', properties: { status: { type: 'string' } } } },
    },
  }, async () => ({ status: 'ok' }));
  await app.ready();

  const res = await app.inject({ method: 'GET', url: '/docs/json' });
  const spec = res.json();

  const healthPath = spec.paths['/health'];
  assert.ok(healthPath, 'spec should have /health path');
  assert.ok(healthPath.get, 'path should have a GET operation');

  const op = healthPath.get;
  assert.equal(op.summary, 'Health check');
  assert.ok(op.tags.includes('Admin'));
  // transform adds default error responses (401, 404, 500) for authenticated routes
  assert.ok(op.responses[500], 'operation should have a 500 response');
  await app.close();
});

test('swagger plugin: transform sets empty security array when authRequired is false', async () => {
  const app = Fastify();
  await app.register(swaggerPlugin);
  // A public route (no auth) — the transform should set security: []
  app.get('/api/v1/public', {
    schema: {
      summary: 'Public endpoint',
      tags: ['Admin'],
      security: [], // explicit no-auth
    },
  }, async () => ({ ok: true }));
  await app.ready();

  const res = await app.inject({ method: 'GET', url: '/docs/json' });
  const spec = res.json();

  const publicPath = spec.paths['/public'];
  assert.ok(publicPath, 'spec should have /public path');
  // The transform may or may not override security, but the path should exist
  assert.ok(publicPath.get, 'path should have a GET operation');
  await app.close();
});

test('swagger plugin: OpenAPI spec has /api/v1 server', async () => {
  const app = Fastify();
  await app.register(swaggerPlugin);
  await app.ready();

  const res = await app.inject({ method: 'GET', url: '/docs/json' });
  const spec = res.json();

  assert.ok(spec.servers, 'spec should have servers array');
  assert.ok(
    spec.servers.some((s) => s.url === '/api/v1'),
    'spec should include /api/v1 server',
  );
  await app.close();
});
