// مسیر فایل: backend/src/modules/permissions/permission.controller.test.js
// =============================================================
// Unit tests — Permission controller (HTTP layer)
//
// Run with:  node --test
//
// Focus: list() has to branch on the SHAPE of what the service
// returns (paginated {data,meta} vs {all,grouped} vs a plain array)
// and choose whether to wrap with success() or send as-is — exactly
// the kind of "looks right until the shape changes upstream" logic
// that benefits from a pinning test.
// =============================================================

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
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

const calls = {};
let fx;
function resetMocks() {
  Object.keys(calls).forEach((k) => delete calls[k]);
  fx = {};
}

const mockPermissionService = {
  listPermissions: async (...args) => { calls.listPermissions = args; return fx.listResult; },
  getPermission: async (...args) => { calls.getPermission = args; return fx.permission; },
  createPermission: async (...args) => { calls.createPermission = args; return fx.created; },
  updatePermission: async (...args) => { calls.updatePermission = args; return fx.updated; },
  deletePermission: async (...args) => { calls.deletePermission = args; return fx.deleted; },
};

injectMock('./permission.service', mockPermissionService);
const controller = require('./permission.controller');

test.beforeEach(() => resetMocks());

function makeReply() {
  const reply = {
    _statusCode: undefined,
    _body: undefined,
    code(c) { this._statusCode = c; return this; },
    send(b) { this._body = b; return this; },
  };
  return reply;
}

function makeRequest(overrides = {}) {
  return { query: {}, params: {}, body: {}, ...overrides };
}

// ── list — three possible result shapes ──────────────────────

test('list: a paginated {data, meta} result is sent AS-IS, not double-wrapped', async () => {
  fx.listResult = { data: [{ id: 1 }], meta: { total: 1, page: 1 } };
  const reply = makeReply();
  await controller.list(makeRequest({ query: { page: '1', limit: '20' } }), reply);
  assert.deepEqual(reply._body, fx.listResult);
});

test('list: a {all, grouped} result is wrapped with success()', async () => {
  fx.listResult = { all: [{ id: 1 }], grouped: { products: [{ id: 1 }] } };
  const reply = makeReply();
  await controller.list(makeRequest({ query: { grouped: 'true' } }), reply);
  assert.deepEqual(reply._body, { data: fx.listResult });
});

test('list: a plain array result is wrapped with success()', async () => {
  fx.listResult = [{ id: 1 }, { id: 2 }];
  const reply = makeReply();
  await controller.list(makeRequest(), reply);
  assert.deepEqual(reply._body, { data: fx.listResult });
});

test('list: forwards the raw query to the service', async () => {
  fx.listResult = [];
  const reply = makeReply();
  await controller.list(makeRequest({ query: { search: 'x' } }), reply);
  assert.deepEqual(calls.listPermissions, [{ search: 'x' }]);
});

// ── getById / create / update / remove ───────────────────────

test('getById: forwards params.id and wraps in success()', async () => {
  fx.permission = { id: 1 };
  const reply = makeReply();
  await controller.getById(makeRequest({ params: { id: '5' } }), reply);
  assert.deepEqual(calls.getPermission, ['5']);
  assert.deepEqual(reply._body, { data: fx.permission });
});

test('create: replies 201', async () => {
  fx.created = { id: 1 };
  const reply = makeReply();
  await controller.create(makeRequest({ body: { key: 'x.read' } }), reply);
  assert.equal(reply._statusCode, 201);
  assert.deepEqual(reply._body, { data: fx.created });
});

test('update: forwards id and body', async () => {
  fx.updated = { id: 1 };
  const reply = makeReply();
  await controller.update(makeRequest({ params: { id: '1' }, body: { description: 'x' } }), reply);
  assert.deepEqual(calls.updatePermission, ['1', { description: 'x' }]);
});

test('remove: sends 200 with the service result (NOT 204)', async () => {
  fx.deleted = { id: 1 };
  const reply = makeReply();
  await controller.remove(makeRequest({ params: { id: '1' } }), reply);
  assert.equal(reply._statusCode, undefined);
  assert.deepEqual(reply._body, { data: fx.deleted });
});
