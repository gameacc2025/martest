// مسیر فایل: backend/src/modules/roles/role.controller.test.js
// =============================================================
// Unit tests — Role controller (HTTP layer)
//
// Run with:  node --test
//
// Focus: listRoles() branches on Array.isArray(result) to decide
// success()-wrap vs pass-through (mirrors permission.controller's
// shape-branching, but inverted — here the ARRAY case gets wrapped
// and the paginated case passes through). Also covers parseInt id
// coercion on getRole/updateRole/deleteRole.
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

const mockRoleService = {
  listRoles: async (...args) => { calls.listRoles = args; return fx.listResult; },
  listAssignableRoles: async (...args) => { calls.listAssignableRoles = args; return fx.assignable ?? []; },
  getRole: async (...args) => { calls.getRole = args; return fx.role; },
  createRole: async (...args) => { calls.createRole = args; return fx.created; },
  updateRole: async (...args) => { calls.updateRole = args; return fx.updated; },
  deleteRole: async (...args) => { calls.deleteRole = args; return fx.deleted; },
};

injectMock('./role.service', mockRoleService);
const controller = require('./role.controller');

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
  return { query: {}, params: {}, body: {}, user: {}, ...overrides };
}

// ── listRoles — Array.isArray branch ─────────────────────────

test('listRoles: a plain array result is wrapped with success()', async () => {
  fx.listResult = [{ id: 1 }, { id: 2 }];
  const reply = makeReply();
  await controller.listRoles(makeRequest(), reply);
  assert.deepEqual(reply._body, { data: fx.listResult });
});

test('listRoles: a paginated {data, meta} result passes through untouched', async () => {
  fx.listResult = { data: [{ id: 1 }], meta: { total: 1 } };
  const reply = makeReply();
  await controller.listRoles(makeRequest({ query: { page: '1', limit: '20' } }), reply);
  assert.deepEqual(reply._body, fx.listResult);
});

// ── listAssignableRoles ───────────────────────────────────────

test('listAssignableRoles: forwards request.user (caller) and wraps the result', async () => {
  fx.assignable = [{ id: 1, name: 'VIEWER' }];
  const reply = makeReply();
  const user = { roles: ['COMPANY_MANAGER'] };
  await controller.listAssignableRoles(makeRequest({ user }), reply);
  assert.deepEqual(calls.listAssignableRoles, [user]);
  assert.deepEqual(reply._body, { data: fx.assignable });
});

// ── getRole / createRole / updateRole / deleteRole ────────────

test('getRole: parses params.id with parseInt', async () => {
  fx.role = { id: 5 };
  const reply = makeReply();
  await controller.getRole(makeRequest({ params: { id: '5' } }), reply);
  assert.deepEqual(calls.getRole, [5]);
});

test('createRole: replies 201', async () => {
  fx.created = { id: 1 };
  const reply = makeReply();
  await controller.createRole(makeRequest({ body: { name: 'X' } }), reply);
  assert.equal(reply._statusCode, 201);
});

test('updateRole: parses params.id and forwards body', async () => {
  fx.updated = { id: 5 };
  const reply = makeReply();
  await controller.updateRole(makeRequest({ params: { id: '5' }, body: { name: 'Y' } }), reply);
  assert.deepEqual(calls.updateRole, [5, { name: 'Y' }]);
});

test('deleteRole: parses params.id and sends 200 with the result (NOT 204)', async () => {
  fx.deleted = { id: 5 };
  const reply = makeReply();
  await controller.deleteRole(makeRequest({ params: { id: '5' } }), reply);
  assert.deepEqual(calls.deleteRole, [5]);
  assert.equal(reply._statusCode, undefined);
  assert.deepEqual(reply._body, { data: fx.deleted });
});
