// مسیر فایل: backend/src/modules/users/user.controller.test.js
// =============================================================
// Unit tests — User controller (HTTP layer over user.service)
//
// Run with:  node --test
//
// Focus: params.id -> parseInt coercion on every route (a raw string
// id silently reaching the service would break Prisma numeric-id
// lookups), and correct field extraction from the body for the
// access-control routes (setAccess, setAccessActive, moveCompany).
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

const mockUserService = {
  listUsers: async (...args) => { calls.listUsers = args; return fx.listResult ?? { data: [], meta: {} }; },
  getUser: async (...args) => { calls.getUser = args; return fx.user; },
  createUser: async (...args) => { calls.createUser = args; return fx.created; },
  updateUser: async (...args) => { calls.updateUser = args; return fx.updated; },
  setUserAccess: async (...args) => { calls.setUserAccess = args; return fx.access; },
  deleteUser: async (...args) => { calls.deleteUser = args; return fx.deleted; },
  setAccessActive: async (...args) => { calls.setAccessActive = args; return fx.activeResult; },
  moveUserToCompany: async (...args) => { calls.moveUserToCompany = args; return fx.moved; },
};

injectMock('./user.service', mockUserService);
const controller = require('./user.controller');

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
  return { query: {}, params: {}, body: {}, user: { id: 1 }, ...overrides };
}

// ── list — sends the service result unwrapped ───────────────────

test('list: forwards query + user, sends the {data, meta} result AS-IS', async () => {
  fx.listResult = { data: [{ id: 1 }], meta: { total: 1 } };
  const reply = makeReply();
  const user = { id: 1 };
  await controller.list(makeRequest({ query: { search: 'x' }, user }), reply);
  assert.deepEqual(calls.listUsers, [{ search: 'x' }, user]);
  assert.deepEqual(reply._body, fx.listResult);
});

// ── getById — id coercion ────────────────────────────────────

test('getById: parses params.id to a number before calling the service', async () => {
  fx.user = { id: 42 };
  const reply = makeReply();
  const user = { id: 1 };
  await controller.getById(makeRequest({ params: { id: '42' }, user }), reply);
  assert.equal(calls.getUser[0], 42);
  assert.equal(typeof calls.getUser[0], 'number');
  assert.equal(calls.getUser[1], user);
});

test('getById: wraps the result in success()', async () => {
  fx.user = { id: 1, email: 'a@a.com' };
  const reply = makeReply();
  await controller.getById(makeRequest({ params: { id: '1' } }), reply);
  assert.deepEqual(reply._body, { data: fx.user });
});

// ── create ────────────────────────────────────────────────────

test('create: replies 201 with the created user, forwards body + caller', async () => {
  fx.created = { id: 5 };
  const reply = makeReply();
  const user = { id: 1 };
  await controller.create(makeRequest({ body: { email: 'x@x.com' }, user }), reply);
  assert.deepEqual(calls.createUser, [{ email: 'x@x.com' }, user]);
  assert.equal(reply._statusCode, 201);
});

// ── update ────────────────────────────────────────────────────

test('update: parses id to a number and forwards body + caller', async () => {
  fx.updated = { id: 7 };
  const reply = makeReply();
  const user = { id: 1 };
  await controller.update(makeRequest({ params: { id: '7' }, body: { email: 'y@y.com' }, user }), reply);
  assert.equal(calls.updateUser[0], 7);
  assert.deepEqual(calls.updateUser[1], { email: 'y@y.com' });
  assert.equal(calls.updateUser[2], user);
});

// ── setAccess ─────────────────────────────────────────────────

test('setAccess: parses id to a number and extracts roleId + permissionIds from the body', async () => {
  fx.access = { id: 1 };
  const reply = makeReply();
  const user = { id: 1 };
  await controller.setAccess(makeRequest({ params: { id: '3' }, body: { roleId: 9, permissionIds: [1, 2] }, user }), reply);
  assert.deepEqual(calls.setUserAccess, [3, 9, [1, 2], user]);
});

// ── remove ────────────────────────────────────────────────────

test('remove: parses id to a number, sends 200 with the service result (NOT 204)', async () => {
  fx.deleted = { id: 1, status: 'deleted' };
  const reply = makeReply();
  const user = { id: 1 };
  await controller.remove(makeRequest({ params: { id: '4' }, user }), reply);
  assert.equal(calls.deleteUser[0], 4);
  assert.equal(reply._statusCode, undefined);
  assert.deepEqual(reply._body, { data: fx.deleted });
});

// ── setAccessActive ───────────────────────────────────────────

test('setAccessActive: parses id to a number and extracts isActive from the body', async () => {
  fx.activeResult = { id: 1, isActive: false };
  const reply = makeReply();
  const user = { id: 1 };
  await controller.setAccessActive(makeRequest({ params: { id: '2' }, body: { isActive: false }, user }), reply);
  assert.deepEqual(calls.setAccessActive, [2, false, user]);
});

// ── moveCompany ───────────────────────────────────────────────

test('moveCompany: parses id to a number and extracts companyId from the body', async () => {
  fx.moved = { id: 1, companyId: 9 };
  const reply = makeReply();
  const user = { id: 1 };
  await controller.moveCompany(makeRequest({ params: { id: '2' }, body: { companyId: 9 }, user }), reply);
  assert.deepEqual(calls.moveUserToCompany, [2, 9, user]);
});
