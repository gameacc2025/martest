// مسیر فایل: backend/src/modules/categories/category.controller.test.js
// =============================================================
// Unit tests — Category controller (HTTP layer over category.service)
//
// Run with:  node --test
//
// Focus: list() vs listForManagement() must pass opposite activeOnly
// flags (this is the exact split that replaced the dead 'BUYER' role
// check described in the source comments — a regression here would
// either leak inactive categories to the public site again, or hide
// them from the admin panel). Also covers the two-step 404 in
// listSubcategories (parent category existence is checked before
// listing its children).
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

const mockCategoryService = {
  listCategories: async (...args) => { calls.listCategories = args; return fx.categories ?? []; },
  getCategoryById: async (...args) => { calls.getCategoryById = args; return fx.category; },
  listSubcategoriesByCategory: async (...args) => { calls.listSubcategoriesByCategory = args; return fx.subcategories ?? []; },
  getSubcategoryById: async (...args) => { calls.getSubcategoryById = args; return fx.subcategory; },
  getCategoryProducts: async (...args) => { calls.getCategoryProducts = args; return fx.productsResult ?? { items: [], total: 0 }; },
  createCategory: async (...args) => { calls.createCategory = args; return fx.created; },
  updateCategory: async (...args) => { calls.updateCategory = args; return fx.updated; },
  deleteCategory: async (...args) => { calls.deleteCategory = args; },
  createSubcategory: async (...args) => { calls.createSubcategory = args; return fx.createdSub; },
  updateSubcategory: async (...args) => { calls.updateSubcategory = args; return fx.updatedSub; },
  deleteSubcategory: async (...args) => { calls.deleteSubcategory = args; },
};

injectMock('./category.service', mockCategoryService);
const controller = require('./category.controller');

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

// ── list vs listForManagement — the activeOnly split ────────────

test('list (public route): calls the service with activeOnly=true', async () => {
  const reply = makeReply();
  await controller.list(makeRequest(), reply);
  assert.deepEqual(calls.listCategories, [{ activeOnly: true }]);
});

test('listForManagement (authenticated admin route): calls the service with activeOnly=false', async () => {
  const reply = makeReply();
  await controller.listForManagement(makeRequest(), reply);
  assert.deepEqual(calls.listCategories, [{ activeOnly: false }]);
});

// ── getOne ────────────────────────────────────────────────────

test('getOne: 404s with a structured error when not found', async () => {
  fx.category = null;
  const reply = makeReply();
  await controller.getOne(makeRequest({ params: { id: '9' } }), reply);
  assert.equal(reply._statusCode, 404);
  assert.deepEqual(reply._body, { error: { code: 'NOT_FOUND', message: 'دسته‌بندی یافت نشد' } });
});

test('getOne: wraps a found category in success()', async () => {
  fx.category = { id: 1 };
  const reply = makeReply();
  await controller.getOne(makeRequest({ params: { id: '1' } }), reply);
  assert.deepEqual(calls.getCategoryById, ['1', { activeOnly: true }]);
  assert.deepEqual(reply._body, { data: fx.category });
});

// ── listSubcategories — two-step existence check ────────────────

test('listSubcategories: 404s (and never lists) when the parent category does not exist', async () => {
  fx.category = null;
  const reply = makeReply();
  await controller.listSubcategories(makeRequest({ params: { id: '9' } }), reply);
  assert.equal(reply._statusCode, 404);
  assert.equal(calls.listSubcategoriesByCategory, undefined);
});

test('listSubcategories: lists activeOnly=true subcategories once the parent is confirmed to exist', async () => {
  fx.category = { id: 1 };
  fx.subcategories = [{ id: 10 }];
  const reply = makeReply();
  await controller.listSubcategories(makeRequest({ params: { id: '1' } }), reply);
  assert.deepEqual(calls.getCategoryById, ['1', { activeOnly: true }]);
  assert.deepEqual(calls.listSubcategoriesByCategory, ['1', { activeOnly: true }]);
  assert.deepEqual(reply._body, { data: fx.subcategories });
});

// ── getSubcategory ────────────────────────────────────────────

test('getSubcategory: uses params.subId (not params.id) and 404s a Persian message when missing', async () => {
  fx.subcategory = null;
  const reply = makeReply();
  await controller.getSubcategory(makeRequest({ params: { id: '1', subId: '99' } }), reply);
  assert.deepEqual(calls.getSubcategoryById, ['99', { activeOnly: true }]);
  assert.equal(reply._statusCode, 404);
  assert.deepEqual(reply._body, { error: { code: 'NOT_FOUND', message: 'زیردسته یافت نشد' } });
});

// ── getProducts — always publishedOnly on this public route ───

test('getProducts: forwards pagination and always pins publishedOnly=true', async () => {
  fx.productsResult = { items: [{ id: 1 }], total: 1 };
  const reply = makeReply();
  await controller.getProducts(makeRequest({ params: { id: '1' }, query: { page: '1', limit: '20' } }), reply);
  assert.deepEqual(calls.getCategoryProducts, ['1', { skip: 0, take: 20, publishedOnly: true }]);
  assert.deepEqual(reply._body.data, [{ id: 1 }]);
});

// ── create / update / remove ─────────────────────────────────

test('create: replies 201 with the created category', async () => {
  fx.created = { id: 1 };
  const reply = makeReply();
  await controller.create(makeRequest({ body: { nameFa: 'X' } }), reply);
  assert.equal(reply._statusCode, 201);
  assert.deepEqual(reply._body, { data: fx.created });
});

test('update: forwards id and body', async () => {
  fx.updated = { id: 1 };
  const reply = makeReply();
  await controller.update(makeRequest({ params: { id: '1' }, body: { nameFa: 'Y' } }), reply);
  assert.deepEqual(calls.updateCategory, ['1', { nameFa: 'Y' }]);
});

test('remove: replies 204', async () => {
  const reply = makeReply();
  await controller.remove(makeRequest({ params: { id: '1' } }), reply);
  assert.equal(reply._statusCode, 204);
  assert.deepEqual(calls.deleteCategory, ['1']);
});

// ── subcategory CRUD ──────────────────────────────────────────

test('createSubcategory: replies 201', async () => {
  fx.createdSub = { id: 1 };
  const reply = makeReply();
  await controller.createSubcategory(makeRequest({ body: { categoryId: 1 } }), reply);
  assert.equal(reply._statusCode, 201);
});

test('updateSubcategory: uses params.subId, not params.id', async () => {
  fx.updatedSub = { id: 1 };
  const reply = makeReply();
  await controller.updateSubcategory(makeRequest({ params: { id: '1', subId: '5' }, body: { nameFa: 'Z' } }), reply);
  assert.deepEqual(calls.updateSubcategory, ['5', { nameFa: 'Z' }]);
});

test('removeSubcategory: uses params.subId and replies 204', async () => {
  const reply = makeReply();
  await controller.removeSubcategory(makeRequest({ params: { id: '1', subId: '5' } }), reply);
  assert.deepEqual(calls.deleteSubcategory, ['5']);
  assert.equal(reply._statusCode, 204);
});
