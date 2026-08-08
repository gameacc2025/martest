// مسیر فایل: backend/src/modules/companies/company.controller.test.js
// =============================================================
// Unit tests — Company controller (HTTP layer over company.service)
//
// Run with:  node --test
//
// Covers status-code mapping, request -> service argument wiring,
// and the 404-vs-passthrough branch in getOne (getCompanyById
// returns null instead of throwing, unlike every other service fn
// here — the controller is the one place that null check lives).
//
// Mocks injected (same technique as auth.controller.test.js):
//   - ./company.service -> mockCompanyService (records args, returns fixtures)
//   - utils/pagination, utils/success -> the REAL modules (pure)
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

const mockCompanyService = {
  listCompanies: async (...args) => { calls.listCompanies = args; return fx.listResult ?? { items: [], total: 0 }; },
  getCompanyById: async (...args) => { calls.getCompanyById = args; return fx.company; },
  createCompany: async (...args) => { calls.createCompany = args; return fx.created; },
  updateCompany: async (...args) => { calls.updateCompany = args; return fx.updated; },
  deleteCompany: async (...args) => { calls.deleteCompany = args; },
  restoreCompany: async (...args) => { calls.restoreCompany = args; return fx.restored; },
  changeStatus: async (...args) => { calls.changeStatus = args; return fx.statusChanged; },
  setVerification: async (...args) => { calls.setVerification = args; return fx.verified; },
  updateLogo: async (...args) => { calls.updateLogo = args; return fx.logoUpdated; },
  getSettings: async (...args) => { calls.getSettings = args; return fx.settings; },
  updateSettings: async (...args) => { calls.updateSettings = args; return fx.settingsUpdated; },
  getStatistics: async (...args) => { calls.getStatistics = args; return fx.stats; },
  getCompanyProducts: async (...args) => { calls.getCompanyProducts = args; return fx.productsResult ?? { items: [], total: 0 }; },
};

injectMock('./company.service', mockCompanyService);
const controller = require('./company.controller');

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

// ── list ──────────────────────────────────────────────────────

test('list: forwards pagination + filters to the service and wraps the result as a paginated response', async () => {
  fx.listResult = { items: [{ id: 1 }], total: 1 };
  const reply = makeReply();
  await controller.list(makeRequest({ query: { page: '2', limit: '10', search: 'x', type: 'MANUFACTURER' } }), reply);

  const [opts] = calls.listCompanies;
  assert.equal(opts.skip, 10);
  assert.equal(opts.take, 10);
  assert.equal(opts.search, 'x');
  assert.equal(opts.type, 'MANUFACTURER');
  assert.deepEqual(reply._body, { data: [{ id: 1 }], meta: { total: 1, page: 2, limit: 10, totalPages: 1 } });
});

// ── getOne ────────────────────────────────────────────────────

test('getOne: 404s with a structured error when the service returns null', async () => {
  fx.company = null;
  const reply = makeReply();
  await controller.getOne(makeRequest({ params: { id: '99' } }), reply);

  assert.equal(reply._statusCode, 404);
  assert.deepEqual(reply._body, { error: { code: 'NOT_FOUND', message: 'شرکت یافت نشد' } });
});

test('getOne: passes includeDeleted=true only when the query string literal is "true"', async () => {
  fx.company = { id: 1 };
  const reply = makeReply();
  await controller.getOne(makeRequest({ params: { id: '1' }, query: { includeDeleted: 'yes' } }), reply);
  assert.equal(calls.getCompanyById[1], false);

  await controller.getOne(makeRequest({ params: { id: '1' }, query: { includeDeleted: 'true' } }), reply);
  assert.equal(calls.getCompanyById[1], true);
});

test('getOne: wraps a found company in the success envelope', async () => {
  fx.company = { id: 1, name: 'Acme' };
  const reply = makeReply();
  await controller.getOne(makeRequest({ params: { id: '1' } }), reply);
  assert.deepEqual(reply._body, { data: { id: 1, name: 'Acme' } });
  assert.equal(reply._statusCode, undefined); // default 200, code() never called
});

// ── create ────────────────────────────────────────────────────

test('create: passes the body through and replies 201 with the created company', async () => {
  fx.created = { id: 5, name: 'New Co' };
  const reply = makeReply();
  await controller.create(makeRequest({ body: { name: 'New Co' } }), reply);

  assert.deepEqual(calls.createCompany[0], { name: 'New Co' });
  assert.equal(reply._statusCode, 201);
  assert.deepEqual(reply._body, { data: { id: 5, name: 'New Co' } });
});

// ── update ────────────────────────────────────────────────────

test('update: forwards params.id, body, and request.user (caller) to the service', async () => {
  fx.updated = { id: 1 };
  const reply = makeReply();
  const user = { roles: ['SUPER_ADMIN'], companyId: null };
  await controller.update(makeRequest({ params: { id: '1' }, body: { name: 'X' }, user }), reply);

  assert.equal(calls.updateCompany[0], '1');
  assert.deepEqual(calls.updateCompany[1], { name: 'X' });
  assert.equal(calls.updateCompany[2], user);
});

// ── remove ────────────────────────────────────────────────────

test('remove: replies 204 with no body', async () => {
  const reply = makeReply();
  await controller.remove(makeRequest({ params: { id: '1' } }), reply);
  assert.equal(reply._statusCode, 204);
  assert.equal(reply._body, undefined);
  assert.equal(calls.deleteCompany[0], '1');
});

// ── restore / changeStatus / toggleVerify / updateLogo ─────────

test('restore: forwards id and wraps the result', async () => {
  fx.restored = { id: 1, deletedAt: null };
  const reply = makeReply();
  await controller.restore(makeRequest({ params: { id: '1' } }), reply);
  assert.equal(calls.restoreCompany[0], '1');
  assert.deepEqual(reply._body, { data: fx.restored });
});

test('changeStatus: extracts status from the body', async () => {
  fx.statusChanged = { id: 1, status: 'SUSPENDED' };
  const reply = makeReply();
  await controller.changeStatus(makeRequest({ params: { id: '1' }, body: { status: 'SUSPENDED' } }), reply);
  assert.equal(calls.changeStatus[0], '1');
  assert.equal(calls.changeStatus[1], 'SUSPENDED');
});

test('toggleVerify: extracts isVerified from the body', async () => {
  fx.verified = { id: 1, isVerified: true };
  const reply = makeReply();
  await controller.toggleVerify(makeRequest({ params: { id: '1' }, body: { isVerified: true } }), reply);
  assert.equal(calls.setVerification[0], '1');
  assert.equal(calls.setVerification[1], true);
});

test('updateLogo: extracts logo from the body', async () => {
  fx.logoUpdated = { id: 1, logo: 'a.png' };
  const reply = makeReply();
  await controller.updateLogo(makeRequest({ params: { id: '1' }, body: { logo: 'a.png' } }), reply);
  assert.equal(calls.updateLogo[0], '1');
  assert.equal(calls.updateLogo[1], 'a.png');
});

// ── getSettings / updateSettings / getStatistics ────────────────

test('getSettings: forwards id and wraps the result', async () => {
  fx.settings = { inquiryLimit: null, limits: [] };
  const reply = makeReply();
  await controller.getSettings(makeRequest({ params: { id: '1' } }), reply);
  assert.equal(calls.getSettings[0], '1');
  assert.deepEqual(reply._body, { data: fx.settings });
});

test('updateSettings: forwards id and body', async () => {
  fx.settingsUpdated = { limits: [] };
  const reply = makeReply();
  await controller.updateSettings(makeRequest({ params: { id: '1' }, body: { limits: {} } }), reply);
  assert.equal(calls.updateSettings[0], '1');
  assert.deepEqual(calls.updateSettings[1], { limits: {} });
});

test('getStatistics: forwards id and wraps the result', async () => {
  fx.stats = { counts: {} };
  const reply = makeReply();
  await controller.getStatistics(makeRequest({ params: { id: '1' } }), reply);
  assert.equal(calls.getStatistics[0], '1');
  assert.deepEqual(reply._body, { data: fx.stats });
});

// ── getProducts ───────────────────────────────────────────────

test('getProducts: forwards pagination + status/search and wraps as a paginated response', async () => {
  fx.productsResult = { items: [{ id: 1 }], total: 1 };
  const reply = makeReply();
  await controller.getProducts(makeRequest({ params: { id: '3' }, query: { page: '1', limit: '20', status: 'PUBLISHED' } }), reply);

  assert.equal(calls.getCompanyProducts[0], '3');
  assert.deepEqual(calls.getCompanyProducts[1], { skip: 0, take: 20, status: 'PUBLISHED', search: undefined });
  assert.deepEqual(reply._body, { data: [{ id: 1 }], meta: { total: 1, page: 1, limit: 20, totalPages: 1 } });
});
