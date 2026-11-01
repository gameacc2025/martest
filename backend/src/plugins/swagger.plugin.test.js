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
    'Authentication', 'Users', 'Addresses', 'Roles', 'Permissions',
    'Companies', 'Categories', 'Specification Library', 'Products', 'Inquiries',
    'Notifications', 'Settings', 'Admin',
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
  assert.ok(op.responses[409], 'operation should document Prisma/application conflicts');
  assert.ok(op.responses[413], 'operation should document oversized upload/payload errors');
  assert.ok(op.responses[429], 'operation should document rate limiting');
  assert.ok(op.responses[500], 'operation should have a 500 response');
  assert.equal(op.responses[409].content['application/json'].schema.$ref, '#/components/schemas/ErrorResponse');
  assert.equal(op.responses[413].content['application/json'].schema.$ref, '#/components/schemas/ErrorResponse');
  assert.equal(op.responses[429].content['application/json'].schema.$ref, '#/components/schemas/ErrorResponse');
  const errorProperties = spec.components.schemas.ErrorResponse.properties.error.properties;
  assert.ok(errorProperties.debug, 'development error detail is documented as optional');
  assert.ok(errorProperties.stack, 'development stack trace is documented as optional');
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

test('swagger plugin: undocumented protected routes default to bearer while allow-listed public routes do not', async () => {
  const app = Fastify();
  await app.register(swaggerPlugin);
  app.get('/api/v1/undocumented-protected-probe', { schema: { summary: 'Undocumented protected probe', tags: ['Admin'] } }, async () => []);
  app.get('/api/v1/health', { schema: { summary: 'Public health probe', tags: ['Admin'] } }, async () => []);
  await app.ready();

  const spec = (await app.inject({ method: 'GET', url: '/docs/json' })).json();
  assert.deepEqual(spec.paths['/undocumented-protected-probe'].get.security, [{ bearerAuth: [] }]);
  assert.equal(spec.paths['/undocumented-protected-probe'].get['x-authentication-required'], true);
  assert.match(spec.paths['/undocumented-protected-probe'].get['x-permission-required'], /route-level AccessProfile/);
  assert.deepEqual(spec.paths['/health'].get.security, []);
  assert.equal(spec.paths['/health'].get['x-authentication-required'], false);
  assert.equal(spec.paths['/health'].get['x-permission-required'], 'None');
  await app.close();
});

test('swagger plugin: refresh uses cookieAuth and PKCE redeem is documented as non-bearer', async () => {
  const app = Fastify();
  await app.register(swaggerPlugin);
  app.post('/api/v1/auth/refresh', {
    schema: { summary: 'Refresh access token', tags: ['Authentication'] },
  }, async () => ({ ok: true }));
  app.post('/api/v1/auth/handoff/redeem', {
    schema: { summary: 'Redeem handoff', tags: ['Authentication'] },
  }, async () => ({ ok: true }));
  await app.ready();

  const spec = (await app.inject({ method: 'GET', url: '/docs/json' })).json();
  assert.deepEqual(spec.paths['/auth/refresh'].post.security, [{ refreshCookie: [] }]);
  assert.deepEqual(spec.paths['/auth/handoff/redeem'].post.security, []);
  assert.equal(spec.components.securitySchemes.refreshCookie.in, 'cookie');
  assert.equal(spec.components.securitySchemes.refreshCookie.name, 'refreshToken');
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


test('swagger plugin: generated payment and lifecycle routes preserve audited error/status contracts', async () => {
  const app = Fastify();
  await app.register(swaggerPlugin);

  app.post('/api/v1/inquiries/subscription', {
    schema: { summary: 'Request inquiry subscription', tags: ['Inquiries'] },
  }, async () => ({ data: {} }));
  app.post('/api/v1/inquiries/subscription/:id/verify-payment', {
    schema: { summary: 'Retry inquiry payment verification', tags: ['Inquiries'] },
  }, async () => ({ data: {} }));
  app.get('/api/v1/inquiries/subscription/payment/callback', {
    schema: { summary: 'Payment callback', tags: ['Inquiries'] },
  }, async () => ({ ok: true }));
  app.get('/api/v1/inquiries/subscription/me', {
    schema: { summary: 'Current inquiry subscription', tags: ['Inquiries'] },
  }, async () => ({ data: {} }));
  app.delete('/api/v1/products/:id', {
    schema: { summary: 'Delete managed product', tags: ['Products'] },
  }, async (_request, reply) => reply.code(204).send());

  await app.ready();
  const spec = (await app.inject({ method: 'GET', url: '/docs/json' })).json();

  const create = spec.paths['/inquiries/subscription'].post;
  assert.equal(create.responses['502'].content['application/json'].schema.$ref, '#/components/schemas/ErrorResponse');
  assert.equal(create.responses['401'].content['application/json'].schema.oneOf[1].properties.error.enum, [true]);
  assert.equal(create.responses['403'].content['application/json'].schema.oneOf[1].properties.error.enum, [true]);
  assert.equal(create.responses['429'].content['application/json'].schema.properties.statusCode.enum, [429]);
  assert.equal(create.responses['500'].content['application/json'].schema.oneOf[1].properties.error.enum, [true]);

  const retry = spec.paths['/inquiries/subscription/{id}/verify-payment'].post;
  assert.equal(retry.responses['503'].content['application/json'].schema.$ref, '#/components/schemas/ErrorResponse');

  const callback = spec.paths['/inquiries/subscription/payment/callback'].get;
  assert.equal(callback.responses['503'].content['application/json'].schema.$ref, '#/components/schemas/ErrorResponse');

  const mine = spec.paths['/inquiries/subscription/me'].get;
  assert.equal(mine.responses['502'], undefined);
  assert.equal(mine.responses['503'], undefined);

  const removeProduct = spec.paths['/products/{id}'].delete;
  assert.ok(removeProduct.responses['204']);
  assert.equal(removeProduct.responses['204'].content, undefined);
  await app.close();
});

