// =============================================================
// App-level security tests — helmet headers + auth rate limiting
//
// Run with:  node --test
//
// Same technique as inquiry.service.test.js: we inject a mock Prisma
// client into the require cache BEFORE building the app, so no real
// database connection is needed. app.inject() drives fake HTTP
// requests through the real Fastify pipeline (real plugins, real
// routes, real @fastify/helmet + @fastify/rate-limit config from
// app.js) without opening a network socket.
// =============================================================

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const Module = require('node:module');

// ── Required env vars (app.js/env.js read these at load time) ──
process.env.NODE_ENV = process.env.NODE_ENV || 'development';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://u:p@127.0.0.1:5432/db';
process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'a'.repeat(32);
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'b'.repeat(32);

// ── Mock Prisma: no user ever exists, so login always resolves to a
//    clean 401 (INVALID_CREDENTIALS) instead of touching a real DB. ──
const mockPrisma = {
  user: { findUnique: async () => null },
  refreshToken: { deleteMany: async () => ({ count: 0 }), create: async () => ({}) },
};

const dbPath = require.resolve(path.join(__dirname, 'config/db'));
require.cache[dbPath] = new Module(dbPath);
require.cache[dbPath].exports = mockPrisma;
require.cache[dbPath].loaded = true;

const buildApp = require('./app');

let app;

test.before(async () => {
  app = await buildApp();
  await app.ready();
});

test.after(async () => {
  await app.close();
});

test('health check responds 200', async () => {
  const res = await app.inject({ method: 'GET', url: '/health' });
  assert.equal(res.statusCode, 200);
});

test('helmet security headers are present', async () => {
  const res = await app.inject({ method: 'GET', url: '/health' });
  assert.ok('x-frame-options' in res.headers, 'missing X-Frame-Options');
  assert.ok('x-content-type-options' in res.headers, 'missing X-Content-Type-Options');
});

test('repeated failed logins from the same IP get rate-limited (429)', async () => {
  const remoteAddress = '203.0.113.9'; // arbitrary external IP, NOT in the allowList
  const payload = { email: 'nobody@example.com', password: 'wrong-password' };

  const statuses = [];
  for (let i = 0; i < 12; i++) {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload,
      remoteAddress,
    });
    statuses.push(res.statusCode);
  }

  // First 10 attempts are the normal 401 (bad credentials); the login
  // route's per-route limit is 10 requests / 5 minutes, so the 11th+
  // should be rejected with 429 before ever reaching the handler.
  assert.ok(statuses.slice(0, 10).every((s) => s === 401), `expected first 10 to be 401, got: ${statuses}`);
  assert.equal(statuses[10], 429, `expected 11th attempt to be rate-limited, got: ${statuses}`);
});

test('a different IP is NOT affected by another IP\'s rate limit', async () => {
  const res = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/login',
    payload: { email: 'someone-else@example.com', password: 'wrong-password' },
    remoteAddress: '198.51.100.42',
  });
  assert.equal(res.statusCode, 401); // not 429 — rate limiting is per-IP
});