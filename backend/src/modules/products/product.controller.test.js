// مسیر فایل: backend/src/modules/products/product.controller.test.js
// =============================================================
// Unit tests — Product controller (HTTP layer over product.service)
//
// Run with:  node --test
//
// Focus: the myProducts SUPER_ADMIN-vs-company-scoping branch (a
// mistake here either leaks every company's products to a regular
// user, or wrongly restricts an admin to their own JWT companyId),
// the changeProductStatus action-name wiring for all seven workflow
// transitions, and status-code mapping (404 passthrough, 201 vs 200
// vs 204).
//
// Mocks injected (same technique as auth.controller.test.js):
//   - ./product.service -> mockProductService (records args, returns fixtures)
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

const mockProductService = {
  MAX_IMAGE_BYTES: 5_000_000,
  MAX_DOCUMENT_BYTES: 10_000_000,
  listProducts: async (...args) => { calls.listProducts = args; return fx.listResult ?? { items: [], total: 0 }; },
  getProductHistory: async (...args) => { calls.getProductHistory = args; return fx.history; },
  getProductActivityLog: async (...args) => { calls.getProductActivityLog = args; return fx.activity; },
  getProductById: async (...args) => { calls.getProductById = args; return fx.product; },
  createProduct: async (...args) => { calls.createProduct = args; return fx.created; },
  updateProduct: async (...args) => { calls.updateProduct = args; return fx.updated; },
  deleteProduct: async (...args) => { calls.deleteProduct = args; },
  upsertPrice: async (...args) => { calls.upsertPrice = args; return fx.price; },
  addPriceTier: async (...args) => { calls.addPriceTier = args; return fx.tier; },
  updatePriceTier: async (...args) => { calls.updatePriceTier = args; return fx.tier; },
  deletePriceTier: async (...args) => { calls.deletePriceTier = args; },
  uploadImage: async (...args) => { calls.uploadImage = args; return fx.image; },
  deleteImage: async (...args) => { calls.deleteImage = args; },
  setPrimaryImage: async (...args) => { calls.setPrimaryImage = args; return fx.image; },
  sortImages: async (...args) => { calls.sortImages = args; return fx.images; },
  uploadDocument: async (...args) => { calls.uploadDocument = args; return fx.document; },
  deleteDocument: async (...args) => { calls.deleteDocument = args; },
  changeProductStatus: async (...args) => { calls.changeProductStatus = args; return fx.statusChanged; },
};

injectMock('./product.service', mockProductService);
const controller = require('./product.controller');

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
  return { query: {}, params: {}, body: {}, user: { roles: [], permissions: [] }, ...overrides };
}

// ── list ──────────────────────────────────────────────────────

test('list: forwards pagination + filters + caller to the service', async () => {
  fx.listResult = { items: [{ id: 1 }], total: 1 };
  const reply = makeReply();
  const user = { roles: ['SUPER_ADMIN'] };
  await controller.list(makeRequest({ query: { page: '1', limit: '20', search: 'x', companyId: '3' }, user }), reply);

  const [opts] = calls.listProducts;
  assert.deepEqual(opts.filters, {
    search: 'x', companyId: '3', categoryId: undefined, status: undefined,
    minPrice: undefined, maxPrice: undefined, featured: undefined, sortBy: undefined, sortOrder: undefined,
  });
  assert.equal(opts.caller, user);
});

test('list: forwards price, featured, and sorting query filters', async () => {
  const reply = makeReply();
  await controller.list(makeRequest({
    query: { minPrice: '100', maxPrice: '500', featured: 'true', sortBy: 'title', sortOrder: 'asc' },
  }), reply);

  assert.deepEqual(calls.listProducts[0].filters, {
    search: undefined, companyId: undefined, categoryId: undefined, status: undefined,
    minPrice: '100', maxPrice: '500', featured: 'true', sortBy: 'title', sortOrder: 'asc',
  });
});

// ── myProducts — the admin-vs-company scoping branch ────────────

test('myProducts: a SUPER_ADMIN sees all companies — companyId filter is left undefined, not the admin\'s own JWT companyId', async () => {
  const reply = makeReply();
  const user = { roles: ['SUPER_ADMIN'], companyId: 42 };
  await controller.myProducts(makeRequest({ user }), reply);

  assert.equal(calls.listProducts[0].filters.companyId, undefined);
});

test('myProducts: a caller with the "*" wildcard permission is also treated as unscoped', async () => {
  const reply = makeReply();
  const user = { roles: [], permissions: ['*'], companyId: 42 };
  await controller.myProducts(makeRequest({ user }), reply);

  assert.equal(calls.listProducts[0].filters.companyId, undefined);
});

test('myProducts: a regular company user is scoped to their own JWT companyId', async () => {
  const reply = makeReply();
  const user = { roles: ['COMPANY_MANAGER'], accessType: 'COMPANY', permissions: ['products.read'], companyId: 7 };
  await controller.myProducts(makeRequest({ user }), reply);

  assert.equal(calls.listProducts[0].filters.companyId, 7);
});

// ── getOne — 404 passthrough ─────────────────────────────────

test('getOne: 404s with a structured error when the service returns null', async () => {
  fx.product = null;
  const reply = makeReply();
  await controller.getOne(makeRequest({ params: { id: '99' } }), reply);
  assert.equal(reply._statusCode, 404);
  assert.deepEqual(reply._body, { error: { code: 'NOT_FOUND', message: 'محصول یافت نشد' } });
});

test('getOne: passes params.id and request.user (for visibility scoping) to the service', async () => {
  fx.product = { id: 1 };
  const reply = makeReply();
  const user = { companyId: 5 };
  await controller.getOne(makeRequest({ params: { id: '1' }, user }), reply);
  assert.deepEqual(calls.getProductById, ['1', user]);
});

test('getActivity: forwards id and authenticated caller, then wraps the result', async () => {
  fx.activity = [{ id: 1, action: 'EDIT' }];
  const reply = makeReply();
  const user = { roles: [], permissions: ['products.read'], accessType: 'STAFF' };
  await controller.getActivity(makeRequest({ params: { id: '1' }, user }), reply);
  assert.deepEqual(calls.getProductActivityLog, ['1', user]);
  assert.deepEqual(reply._body, { data: fx.activity });
});

// ── create / update / remove ─────────────────────────────────

test('create: replies 201 with the created product', async () => {
  fx.created = { id: 1 };
  const reply = makeReply();
  await controller.create(makeRequest({ body: { title: 'X' } }), reply);
  assert.equal(reply._statusCode, 201);
  assert.deepEqual(reply._body, { data: { id: 1 } });
});

test('remove: replies 204 with no body', async () => {
  const reply = makeReply();
  await controller.remove(makeRequest({ params: { id: '1' } }), reply);
  assert.equal(reply._statusCode, 204);
  assert.equal(reply._body, undefined);
});

// ── price tiers ───────────────────────────────────────────────

test('addPriceTier: replies 201', async () => {
  fx.tier = { id: 1 };
  const reply = makeReply();
  await controller.addPriceTier(makeRequest({ params: { id: '1' }, body: {} }), reply);
  assert.equal(reply._statusCode, 201);
});

test('updatePriceTier: forwards productId + tierId + body, replies 200', async () => {
  fx.tier = { id: 2 };
  const reply = makeReply();
  await controller.updatePriceTier(makeRequest({ params: { id: '1', tierId: '2' }, body: { price: 100 } }), reply);
  assert.deepEqual(calls.updatePriceTier[0], '1');
  assert.deepEqual(calls.updatePriceTier[1], '2');
  assert.equal(reply._statusCode, undefined);
});

test('deletePriceTier: replies 204', async () => {
  const reply = makeReply();
  await controller.deletePriceTier(makeRequest({ params: { id: '1', tierId: '2' } }), reply);
  assert.equal(reply._statusCode, 204);
});

// ── images / documents ───────────────────────────────────────

test('deleteImage: forwards productId + imageId, replies 204', async () => {
  const reply = makeReply();
  await controller.deleteImage(makeRequest({ params: { id: '1', imageId: '9' } }), reply);
  assert.deepEqual(calls.deleteImage.slice(0, 2), ['1', '9']);
  assert.equal(reply._statusCode, 204);
});

test('sortImages: forwards body.images as the sort order array', async () => {
  const reply = makeReply();
  await controller.sortImages(makeRequest({ params: { id: '1' }, body: { images: [3, 1, 2] } }), reply);
  assert.deepEqual(calls.sortImages[1], [3, 1, 2]);
});

test('deleteDocument: forwards productId + documentId, replies 204', async () => {
  const reply = makeReply();
  await controller.deleteDocument(makeRequest({ params: { id: '1', documentId: '5' } }), reply);
  assert.deepEqual(calls.deleteDocument.slice(0, 2), ['1', '5']);
  assert.equal(reply._statusCode, 204);
});

// ── multipart uploads — request.file() wiring ──────────────────

test('uploadImage: calls request.file() with the service\'s MAX_IMAGE_BYTES limit and forwards the resolved file', async () => {
  fx.image = { id: 1, url: 'a.png' };
  const reply = makeReply();
  const fakeFile = { filename: 'a.png' };
  let fileCallArgs;
  const request = makeRequest({
    params: { id: '1' },
    file: async (opts) => { fileCallArgs = opts; return fakeFile; },
  });

  await controller.uploadImage(request, reply);

  assert.deepEqual(fileCallArgs, { limits: { fileSize: mockProductService.MAX_IMAGE_BYTES } });
  assert.deepEqual(calls.uploadImage, ['1', fakeFile, request.user]);
  assert.equal(reply._statusCode, 201);
});

test('uploadDocument: calls request.file() with the service\'s MAX_DOCUMENT_BYTES limit', async () => {
  fx.document = { id: 1 };
  const reply = makeReply();
  const fakeFile = { filename: 'spec.pdf' };
  let fileCallArgs;
  const request = makeRequest({
    params: { id: '1' },
    file: async (opts) => { fileCallArgs = opts; return fakeFile; },
  });

  await controller.uploadDocument(request, reply);

  assert.deepEqual(fileCallArgs, { limits: { fileSize: mockProductService.MAX_DOCUMENT_BYTES } });
  assert.equal(reply._statusCode, 201);
});

// ── status-transition actions — each wires the right action name ─

const transitions = [
  ['submitReview', 'submitReview'],
  ['approve', 'approve'],
  ['reject', 'reject'],
  ['publish', 'publish'],
  ['hide', 'hide'],
  ['archive', 'archive'],
  ['restoreDraft', 'restoreDraft'],
];

for (const [fnName, actionName] of transitions) {
  test(`${fnName}: calls changeProductStatus with action="${actionName}" and forwards the optional comment`, async () => {
    fx.statusChanged = { id: 1, status: 'X' };
    const reply = makeReply();
    const user = { roles: ['SUPER_ADMIN'] };
    await controller[fnName](makeRequest({ params: { id: '1' }, body: { comment: 'ok' }, user }), reply);

    assert.deepEqual(calls.changeProductStatus, ['1', actionName, user, 'ok']);
    assert.deepEqual(reply._body, { data: fx.statusChanged });
  });
}

test('approve: tolerates a missing body (comment defaults to undefined, not a throw)', async () => {
  const reply = makeReply();
  await controller.approve(makeRequest({ params: { id: '1' }, body: undefined }), reply);
  assert.equal(calls.changeProductStatus[3], undefined);
});
