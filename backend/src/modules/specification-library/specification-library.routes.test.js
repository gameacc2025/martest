// مسیر فایل: backend/src/modules/specification-library/specification-library.routes.test.js
// =============================================================
// Integration tests — Specification Library routes
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
  search: async (request, reply) => {
    hit.search = true;
    return reply.code(200).send({ ok: true });
  },
  listAll: async (request, reply) => {
    hit.listAll = true;
    return reply.code(200).send({ ok: true });
  },
};
injectMock('./specification-library.controller', trivialController);

const specLibRoutes = require('./specification-library.routes');

async function buildApp() {
  const app = Fastify();
  await app.register(specLibRoutes, { prefix: '/api/v1/specification-library' });
  await app.ready();
  return app;
}

test.beforeEach(() => { Object.keys(hit).forEach((k) => delete hit[k]); });

test('GET /: reaches the search controller (public)', async () => {
  const app = await buildApp();
  const res = await app.inject({ method: 'GET', url: '/api/v1/specification-library' });
  assert.equal(res.statusCode, 200);
  assert.equal(hit.search, true);
  await app.close();
});

test('GET /all: reaches the listAll controller (public)', async () => {
  const app = await buildApp();
  const res = await app.inject({ method: 'GET', url: '/api/v1/specification-library/all' });
  assert.equal(res.statusCode, 200);
  assert.equal(hit.listAll, true);
  await app.close();
});

test('GET /: does not require authentication', async () => {
  const app = await buildApp();
  const res = await app.inject({ method: 'GET', url: '/api/v1/specification-library' });
  assert.equal(res.statusCode, 200);
  await app.close();
});
