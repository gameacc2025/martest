// مسیر فایل: backend/src/modules/products/product.routes.test.js
// =============================================================
// Integration tests — Product routes (permission + schema wiring)
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
const trivialController = {};
const controllerMethods = [
  'list', 'getOne', 'getPriceHistory', 'myProducts', 'getHistory', 'getActivity', 'create', 'update', 'remove',
  'submitReview', 'approve', 'reject', 'publish', 'hide', 'archive', 'restoreDraft',
  'addPriceTier', 'updatePriceTier', 'deletePriceTier',
  'uploadImage', 'deleteImage', 'setPrimaryImage', 'sortImages',
  'uploadDocument', 'deleteDocument',
];
for (const name of controllerMethods) {
  trivialController[name] = async (request, reply) => {
    hit[name] = true;
    return reply.code(200).send({ ok: true });
  };
}
injectMock('./product.controller', trivialController);

const productRoutes = require('./product.routes');

async function buildApp() {
  const app = Fastify();
  app.decorate('authenticate', async (request, reply) => {
    const raw = request.headers['x-test-user'];
    if (!raw) {
      return reply.code(401).send({ error: true, code: 'UNAUTHORIZED', message: 'Authentication required.' });
    }
    request.user = JSON.parse(raw);
  });
  await app.register(productRoutes, { prefix: '/api/v1/products' });
  await app.ready();
  return app;
}

function userHeader(accessType, permissions) {
  return { 'x-test-user': JSON.stringify({ roles: [], permissions, accessType }) };
}

test.beforeEach(() => { Object.keys(hit).forEach((k) => delete hit[k]); });

// ── Public routes (no auth) ──────────────────────────────────

test('GET /: public, reaches list controller without auth', async () => {
  const app = await buildApp();
  const res = await app.inject({ method: 'GET', url: '/api/v1/products' });
  assert.equal(res.statusCode, 200);
  assert.equal(hit.list, true);
  await app.close();
});

test('GET /:id/price-history: public, reaches price history controller without auth', async () => {
  const app = await buildApp();
  const res = await app.inject({ method: 'GET', url: '/api/v1/products/1/price-history' });
  assert.equal(res.statusCode, 200);
  assert.equal(hit.getPriceHistory, true);
  await app.close();
});

test('GET /:id: public, reaches getOne controller without auth', async () => {
  const app = await buildApp();
  const res = await app.inject({ method: 'GET', url: '/api/v1/products/1' });
  assert.equal(res.statusCode, 200);
  assert.equal(hit.getOne, true);
  await app.close();
});

test('GET /:id: non-integer id -> 400 (params schema)', async () => {
  const app = await buildApp();
  const res = await app.inject({ method: 'GET', url: '/api/v1/products/abc' });
  assert.equal(res.statusCode, 400);
  await app.close();
});

// ── Authenticated routes: /my-products ───────────────────────

test('GET /my-products: requires authenticate', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'GET',
    url: '/api/v1/products/my-products',
    headers: userHeader('COMPANY', ['products.read']),
  });
  assert.equal(res.statusCode, 200);
  assert.equal(hit.myProducts, true);
  await app.close();
});

test('GET /my-products: without auth -> 401', async () => {
  const app = await buildApp();
  const res = await app.inject({ method: 'GET', url: '/api/v1/products/my-products' });
  assert.equal(res.statusCode, 401);
  await app.close();
});

test('GET /my-products: requires products.read', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'GET', url: '/api/v1/products/my-products',
    headers: userHeader('STAFF', []),
  });
  assert.equal(res.statusCode, 403);
  assert.equal(hit.myProducts, undefined);
  await app.close();
});

test('GET /:id/manage, /:id/history and /:id/activity require STAFF/COMPANY plus products.read', async () => {
  for (const path of ['1/manage', '1/history', '1/activity']) {
    const app = await buildApp();
    const denied = await app.inject({
      method: 'GET', url: '/api/v1/products/' + path,
      headers: userHeader('CUSTOMER', ['products.read']),
    });
    assert.equal(denied.statusCode, 403, path + ' rejects CUSTOMER');
    const noPermission = await app.inject({
      method: 'GET', url: '/api/v1/products/' + path,
      headers: userHeader('STAFF', []),
    });
    assert.equal(noPermission.statusCode, 403, path + ' requires products.read');
    const staffAllowed = await app.inject({
      method: 'GET', url: '/api/v1/products/' + path,
      headers: userHeader('STAFF', ['products.read']),
    });
    assert.equal(staffAllowed.statusCode, 200, path + ' allows authorized STAFF');
    await app.close();
  }
});

// ── POST / (create) — COMPANY|STAFF + products.create ────────

test('POST /: COMPANY with products.create -> 200', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'POST',
    url: '/api/v1/products',
    headers: userHeader('COMPANY', ['products.create']),
    payload: { title: 'Product', categoryId: 1, subcategoryId: 1 },
  });
  assert.equal(res.statusCode, 200);
  assert.equal(hit.create, true);
  await app.close();
});

test('POST /: STAFF with products.create -> 200', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'POST',
    url: '/api/v1/products',
    headers: userHeader('STAFF', ['products.create']),
    payload: { title: 'Product', categoryId: 1, subcategoryId: 1 },
  });
  assert.equal(res.statusCode, 200);
  await app.close();
});

test('POST /: CUSTOMER cannot create (MANAGE_TYPES excludes CUSTOMER)', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'POST',
    url: '/api/v1/products',
    headers: userHeader('CUSTOMER', ['products.create']),
    payload: { title: 'Product', categoryId: 1, subcategoryId: 1 },
  });
  assert.equal(res.statusCode, 403);
  await app.close();
});

test('POST /: without permission -> 403', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'POST',
    url: '/api/v1/products',
    headers: userHeader('COMPANY', []),
    payload: { title: 'Product', categoryId: 1, subcategoryId: 1 },
  });
  assert.equal(res.statusCode, 403);
  await app.close();
});

test('POST /: missing required title -> 400', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'POST',
    url: '/api/v1/products',
    headers: userHeader('COMPANY', ['products.create']),
    payload: { categoryId: 1, subcategoryId: 1 },
  });
  assert.equal(res.statusCode, 400);
  await app.close();
});

// ── PATCH /:id (update) — COMPANY|STAFF + products.update ────

test('PATCH /:id: accepts existing price tier IDs and null optional tier fields', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'PATCH',
    url: '/api/v1/products/1',
    headers: userHeader('COMPANY', ['products.update']),
    payload: {
      priceTiers: [{ id: 1, minQuantity: 1, maxQuantity: null, price: 100, unit: null }],
    },
  });
  assert.equal(res.statusCode, 200);
  assert.equal(hit.update, true);
  await app.close();
});

test('PATCH /:id: COMPANY with products.update -> 200', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'PATCH',
    url: '/api/v1/products/1',
    headers: userHeader('COMPANY', ['products.update']),
    payload: { title: 'Updated' },
  });
  assert.equal(res.statusCode, 200);
  assert.equal(hit.update, true);
  await app.close();
});

// ── DELETE /:id — COMPANY|STAFF + products.delete ────────────

test('DELETE /:id: COMPANY with products.delete -> 200', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'DELETE',
    url: '/api/v1/products/1',
    headers: userHeader('COMPANY', ['products.delete']),
  });
  assert.equal(res.statusCode, 200);
  assert.equal(hit.remove, true);
  await app.close();
});

// ── Workflow: submit-review — COMPANY|STAFF + products.submit_review

test('POST /:id/submit-review: COMPANY with products.submit_review -> 200', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'POST',
    url: '/api/v1/products/1/submit-review',
    headers: userHeader('COMPANY', ['products.submit_review']),
    payload: {},
  });
  assert.equal(res.statusCode, 200);
  assert.equal(hit.submitReview, true);
  await app.close();
});

// ── Workflow: approve — STAFF ONLY + products.approve ─────────

test('POST /:id/approve: STAFF with products.approve -> 200', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'POST',
    url: '/api/v1/products/1/approve',
    headers: userHeader('STAFF', ['products.approve']),
    payload: {},
  });
  assert.equal(res.statusCode, 200);
  assert.equal(hit.approve, true);
  await app.close();
});

test('POST /:id/approve: COMPANY cannot approve (STAFF_ONLY)', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'POST',
    url: '/api/v1/products/1/approve',
    headers: userHeader('COMPANY', ['products.approve']),
    payload: {},
  });
  assert.equal(res.statusCode, 403);
  await app.close();
});

// ── Workflow: reject — STAFF ONLY + products.reject ──────────

test('POST /:id/reject: STAFF with products.reject -> 200', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'POST',
    url: '/api/v1/products/1/reject',
    headers: userHeader('STAFF', ['products.reject']),
    payload: {},
  });
  assert.equal(res.statusCode, 200);
  assert.equal(hit.reject, true);
  await app.close();
});

// ── Workflow: publish — STAFF or COMPANY + products.publish ────

test('POST /:id/publish: STAFF with products.publish -> 200', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'POST',
    url: '/api/v1/products/1/publish',
    headers: userHeader('STAFF', ['products.publish']),
    payload: {},
  });
  assert.equal(res.statusCode, 200);
  assert.equal(hit.publish, true);
  await app.close();
});

test('POST /:id/publish: COMPANY with products.publish -> 200', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'POST',
    url: '/api/v1/products/1/publish',
    headers: userHeader('COMPANY', ['products.publish']),
    payload: {},
  });
  assert.equal(res.statusCode, 200);
  assert.equal(hit.publish, true);
  await app.close();
});

test('POST /:id/publish: COMPANY without products.publish -> 403', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'POST',
    url: '/api/v1/products/1/publish',
    headers: userHeader('COMPANY', []),
    payload: {},
  });
  assert.equal(res.statusCode, 403);
  await app.close();
});

// ── Workflow: hide — STAFF ONLY + products.hide ──────────────

test('POST /:id/hide: STAFF with products.hide -> 200', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'POST',
    url: '/api/v1/products/1/hide',
    headers: userHeader('STAFF', ['products.hide']),
    payload: {},
  });
  assert.equal(res.statusCode, 200);
  assert.equal(hit.hide, true);
  await app.close();
});

// ── Workflow: archive — STAFF ONLY + products.archive ─────────

test('POST /:id/archive: STAFF with products.archive -> 200', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'POST',
    url: '/api/v1/products/1/archive',
    headers: userHeader('STAFF', ['products.archive']),
    payload: {},
  });
  assert.equal(res.statusCode, 200);
  assert.equal(hit.archive, true);
  await app.close();
});

// ── Workflow: restore-draft — STAFF ONLY + products.review ───

test('POST //restore-draft: STAFF with products.review -> 200', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'POST',
    url: '/api/v1/products/1/restore-draft',
    headers: userHeader('STAFF', ['products.review']),
    payload: {},
  });
  assert.equal(res.statusCode, 200);
  assert.equal(hit.restoreDraft, true);
  await app.close();
});

// ── Price tiers — COMPANY|STAFF + products.update ────────────

test('POST /:id/price-tiers: COMPANY with products.update -> 200', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'POST',
    url: '/api/v1/products/1/price-tiers',
    headers: userHeader('COMPANY', ['products.update']),
    payload: { minQuantity: 1, price: 1000 },
  });
  assert.equal(res.statusCode, 200);
  assert.equal(hit.addPriceTier, true);
  await app.close();
});

test('PATCH /:id/price-tiers/:tierId: COMPANY with products.update -> 200', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'PATCH',
    url: '/api/v1/products/1/price-tiers/2',
    headers: userHeader('COMPANY', ['products.update']),
    payload: { price: 2000 },
  });
  assert.equal(res.statusCode, 200);
  assert.equal(hit.updatePriceTier, true);
  await app.close();
});

test('DELETE /:id/price-tiers/:tierId: COMPANY with products.update -> 200', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'DELETE',
    url: '/api/v1/products/1/price-tiers/2',
    headers: userHeader('COMPANY', ['products.update']),
  });
  assert.equal(res.statusCode, 200);
  assert.equal(hit.deletePriceTier, true);
  await app.close();
});

// ── Images — product_images.* permissions ────────────────────

test('POST /:id/images: COMPANY with product_images.create -> 200', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'POST',
    url: '/api/v1/products/1/images',
    headers: userHeader('COMPANY', ['product_images.create']),
  });
  assert.equal(res.statusCode, 200);
  assert.equal(hit.uploadImage, true);
  await app.close();
});

test('DELETE /:id/images/:imageId: COMPANY with product_images.delete -> 200', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'DELETE',
    url: '/api/v1/products/1/images/2',
    headers: userHeader('COMPANY', ['product_images.delete']),
  });
  assert.equal(res.statusCode, 200);
  assert.equal(hit.deleteImage, true);
  await app.close();
});

test('PATCH /:id/images/sort: COMPANY with product_images.update -> 200', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'PATCH',
    url: '/api/v1/products/1/images/sort',
    headers: userHeader('COMPANY', ['product_images.update']),
    payload: { images: [{ id: 1, sortOrder: 0 }] },
  });
  assert.equal(res.statusCode, 200);
  assert.equal(hit.sortImages, true);
  await app.close();
});

// ── Documents — product_documents.* permissions ──────────────

test('POST /:id/documents: COMPANY with product_documents.create -> 200', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'POST',
    url: '/api/v1/products/1/documents',
    headers: userHeader('COMPANY', ['product_documents.create']),
  });
  assert.equal(res.statusCode, 200);
  assert.equal(hit.uploadDocument, true);
  await app.close();
});

test('DELETE /:id/documents/:documentId: COMPANY with product_documents.delete -> 200', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'DELETE',
    url: '/api/v1/products/1/documents/2',
    headers: userHeader('COMPANY', ['product_documents.delete']),
  });
  assert.equal(res.statusCode, 200);
  assert.equal(hit.deleteDocument, true);
  await app.close();
});

// ── SUPER_ADMIN bypass ───────────────────────────────────────

test('SUPER_ADMIN bypasses all product permission checks', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'POST',
    url: '/api/v1/products',
    headers: { 'x-test-user': JSON.stringify({ roles: ['SUPER_ADMIN'], permissions: ['*'], accessType: 'STAFF' }) },
    payload: { title: 'Product', categoryId: 1, subcategoryId: 1 },
  });
  assert.equal(res.statusCode, 200);
  assert.equal(hit.create, true);
  await app.close();
});


test('COMPANY and CUSTOMER contexts cannot invoke STAFF-only product moderation with wildcard permissions', async () => {
  const app = await buildApp();
  const staffOnlyActions = ['approve', 'reject', 'hide', 'archive', 'restore-draft'];
  const contexts = [
    {
      name: 'COMPANY',
      user: { accessType: 'COMPANY', companyId: 10, roles: ['SUPER_ADMIN'], permissions: ['*'] },
    },
    {
      name: 'CUSTOMER',
      user: { accessType: 'CUSTOMER', companyId: 10, roles: ['SUPER_ADMIN'], permissions: ['*'] },
    },
  ];

  for (const context of contexts) {
    const headers = { 'x-test-user': JSON.stringify(context.user) };
    for (const action of staffOnlyActions) {
      const res = await app.inject({
        method: 'POST',
        url: `/api/v1/products/1/${action}`,
        headers,
        payload: {},
      });
      assert.equal(res.statusCode, 403, `${context.name} must not perform ${action}`);
      const controllerName = action === 'restore-draft' ? 'restoreDraft' : action;
      assert.equal(hit[controllerName], undefined, `${context.name} must not reach ${controllerName} controller`);
    }
  }

  await app.close();
});
