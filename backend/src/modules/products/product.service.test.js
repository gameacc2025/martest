// =============================================================
// Unit tests — product.service.js
//
// This is the largest service in the app (~1000 lines) and owns the
// most security-sensitive logic outside auth itself: which company
// can see/edit which product, and the DRAFT→PUBLISHED status state
// machine. Covers, in priority order:
//   1. Tenant isolation (assertCanManageProductById, via addPriceTier)
//   2. Visibility rules (getProductById, listProducts)
//   3. Status transition state machine (changeProductStatus)
//   4. createProduct / deleteProduct company scoping
//   5. Upload guard clauses (file type / missing file) — NOT the
//      actual stream-writing logic, which needs a real filesystem
//      and is out of scope for a unit test.
//
// Run with:  node --test
//
// Same require-cache injection technique as the other service tests:
// no real database needed.
// =============================================================

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const Module = require('node:module');

function injectMock(relativePath, exportsObj) {
  const resolved = require.resolve(path.join(__dirname, relativePath));
  require.cache[resolved] = new Module(resolved);
  require.cache[resolved].exports = exportsObj;
  require.cache[resolved].loaded = true;
  return resolved;
}

// ── Mock Prisma ─────────────────────────────────────────────
let fx;

function resetMocks() {
  fx = {
    product: null,           // prisma.product.findFirst(...) result
    category: { id: 1, status: 'ACTIVE' },
    subcategory: { id: 1, categoryId: 1, status: 'ACTIVE', specificationTemplate: null },
    company: { id: 1 },
    priceTiers: [],
    createdProduct: { id: 1 },
    updatedProduct: { id: 1 },
    superAdminUserIds: [],
    companyUserIds: [],
  };
}

const calls = {};
function recordCall(name, args) {
  calls[name] = calls[name] || [];
  calls[name].push(args);
}

const mockPrisma = {
  product: {
    findFirst: async (args) => { recordCall('product.findFirst', args); return fx.product; },
    findUnique: async (args) => { recordCall('product.findUnique', args); return null; }, // slug lookups: always free
    create: async (args) => { recordCall('product.create', args); return fx.createdProduct; },
    update: async (args) => { recordCall('product.update', args); return fx.updatedProduct; },
    count: async () => 0,
    findMany: async () => [],
  },
  category: { findUnique: async () => fx.category },
  subcategory: { findUnique: async () => fx.subcategory },
  company: { findFirst: async () => fx.company },
  productPriceTier: {
    findMany: async () => fx.priceTiers,
    create: async (args) => { recordCall('productPriceTier.create', args); return { id: 99, ...args.data }; },
    findFirst: async () => null,
    update: async () => ({}),
    delete: async () => ({}),
  },
  productImage: { count: async () => 0, findFirst: async () => null, findMany: async () => [] },
  productDocument: { count: async () => 0, findFirst: async () => null },
  productStatusHistory: {
    create: async (args) => { recordCall('productStatusHistory.create', args); return {}; },
    findMany: async () => [],
  },
  user: { findMany: async () => fx.superAdminUserIds.map((id) => ({ id })) },
  notification: { createMany: async (args) => { recordCall('notification.createMany', args); } },
  $transaction: async (arg) => {
    if (typeof arg === 'function') return arg(mockPrisma);
    return Promise.all(arg);
  },
};

injectMock('../../config/db', mockPrisma);
injectMock('../../utils/rbac', { SUPER_ADMIN_ROLE: 'SUPER_ADMIN' });
const service = require('./product.service');

test.beforeEach(() => resetMocks());

// ── Callers used across tests ────────────────────────────────
const superAdmin = { id: 1, roles: ['SUPER_ADMIN'], permissions: ['*'] };
const companyA = { id: 2, roles: ['COMPANY_MANAGER'], permissions: [], companyId: 10 };
const companyB = { id: 3, roles: ['COMPANY_MANAGER'], permissions: [], companyId: 20 };
const anonymous = null;

function draftProduct(overrides = {}) {
  return { id: 1, companyId: 10, status: 'DRAFT', visibility: 'PUBLIC', title: 'X', ...overrides };
}

// ── Tenant isolation (assertCanManageProductById, exercised via addPriceTier) ──

test('tenant isolation: a company cannot manage another company\'s product (403)', async () => {
  fx.product = draftProduct({ companyId: 10 });
  await assert.rejects(
    () => service.addPriceTier(1, { minQuantity: 1, price: 100 }, companyB), // companyB.companyId = 20
    (err) => err.statusCode === 403 && err.code === 'FORBIDDEN'
  );
});

test('tenant isolation: a company CAN manage its own product', async () => {
  fx.product = draftProduct({ companyId: 10 });
  const result = await service.addPriceTier(1, { minQuantity: 1, price: 100 }, companyA);
  assert.ok(result); // did not throw
});

test('tenant isolation: SUPER_ADMIN can manage any company\'s product', async () => {
  fx.product = draftProduct({ companyId: 10 });
  const result = await service.addPriceTier(1, { minQuantity: 1, price: 100 }, superAdmin);
  assert.ok(result);
});

test('tenant isolation: a company can only edit its own DRAFT products, not e.g. PUBLISHED ones', async () => {
  fx.product = draftProduct({ companyId: 10, status: 'PUBLISHED' });
  await assert.rejects(
    () => service.addPriceTier(1, { minQuantity: 1, price: 100 }, companyA),
    (err) => err.statusCode === 403 && err.code === 'PRODUCT_NOT_EDITABLE'
  );
});

test('tenant isolation: a missing/soft-deleted product 404s regardless of caller', async () => {
  fx.product = null;
  await assert.rejects(
    () => service.addPriceTier(999, { minQuantity: 1, price: 100 }, superAdmin),
    (err) => err.statusCode === 404 && err.code === 'PRODUCT_NOT_FOUND'
  );
});

// ── getProductById visibility ─────────────────────────────────

test('getProductById: an anonymous visitor only sees PUBLISHED + PUBLIC products', async () => {
  fx.product = draftProduct({ status: 'DRAFT', visibility: 'PUBLIC' });
  assert.equal(await service.getProductById(1, anonymous), null);

  fx.product = draftProduct({ status: 'PUBLISHED', visibility: 'PRIVATE' });
  assert.equal(await service.getProductById(1, anonymous), null);

  fx.product = draftProduct({ status: 'PUBLISHED', visibility: 'PUBLIC' });
  assert.ok(await service.getProductById(1, anonymous));
});

test('getProductById: a company sees its own product regardless of status', async () => {
  fx.product = draftProduct({ companyId: 10, status: 'DRAFT' });
  assert.ok(await service.getProductById(1, companyA));
});

test('getProductById: a company is hidden from another company\'s product (looks like 404, not 403)', async () => {
  fx.product = draftProduct({ companyId: 10, status: 'PUBLISHED', visibility: 'PUBLIC' });
  assert.equal(await service.getProductById(1, companyB), null);
});

test('getProductById: SUPER_ADMIN sees any product regardless of status/visibility/owner', async () => {
  fx.product = draftProduct({ companyId: 10, status: 'DRAFT', visibility: 'PRIVATE' });
  assert.ok(await service.getProductById(1, superAdmin));
});

// ── listProducts scoping ──────────────────────────────────────

test('listProducts: anonymous callers are clamped to PUBLISHED + PUBLIC, and cannot use ?status= to bypass it', async () => {
  let capturedWhere;
  mockPrisma.product.findMany = async (args) => { capturedWhere = args.where; return []; };
  await service.listProducts({ skip: 0, take: 10, filters: { status: 'DRAFT' }, caller: anonymous });
  assert.equal(capturedWhere.status, 'PUBLISHED'); // filters.status is IGNORED for public callers
  assert.equal(capturedWhere.visibility, 'PUBLIC');
});

test('listProducts: a company user is forced to their own companyId, ignoring any filters.companyId', async () => {
  let capturedWhere;
  mockPrisma.product.findMany = async (args) => { capturedWhere = args.where; return []; };
  await service.listProducts({ skip: 0, take: 10, filters: { companyId: 999 }, caller: companyA });
  assert.equal(capturedWhere.companyId, 10); // caller's own company, not the requested 999
});

test('listProducts: SUPER_ADMIN can filter by any companyId and any status', async () => {
  let capturedWhere;
  mockPrisma.product.findMany = async (args) => { capturedWhere = args.where; return []; };
  await service.listProducts({ skip: 0, take: 10, filters: { companyId: 999, status: 'DRAFT' }, caller: superAdmin });
  assert.equal(capturedWhere.companyId, 999);
  assert.equal(capturedWhere.status, 'DRAFT');
});

// ── changeProductStatus: state machine ────────────────────────

test('changeProductStatus: DRAFT --submitReview--> PENDING_REVIEW succeeds when ready', async () => {
  fx.product = draftProduct({ status: 'DRAFT' });
  mockPrisma.product.findFirst = async (args) => {
    // validateProductReadyForReview does its own findFirst with `include` —
    // return a fully "ready" product for that call, and the plain product
    // for the initial existence check.
    if (args.include) {
      return {
        ...fx.product,
        title: 'Valid title', description: 'desc', categoryId: 1, subcategoryId: 1,
        images: [{ id: 1 }], prices: [{ id: 1 }],
        subcategory: { specificationTemplate: null },
      };
    }
    return fx.product;
  };
  const result = await service.changeProductStatus(1, 'submitReview', companyA);
  assert.ok(result);
});

test('changeProductStatus: submitReview fails if the product isn\'t ready (missing images/prices)', async () => {
  fx.product = draftProduct({ status: 'DRAFT' });
  mockPrisma.product.findFirst = async (args) => {
    if (args.include) {
      return {
        ...fx.product,
        title: '', description: '', categoryId: null, subcategoryId: null,
        images: [], prices: [],
        subcategory: { specificationTemplate: null },
      };
    }
    return fx.product;
  };
  await assert.rejects(
    () => service.changeProductStatus(1, 'submitReview', companyA),
    (err) => err.statusCode === 400 && err.code === 'PRODUCT_REVIEW_VALIDATION_FAILED' && err.details.length > 0
  );
});

test('changeProductStatus: an invalid transition (e.g. DRAFT -> publish) is rejected', async () => {
  fx.product = draftProduct({ status: 'DRAFT' });
  await assert.rejects(
    () => service.changeProductStatus(1, 'publish', superAdmin),
    (err) => err.statusCode === 400 && err.code === 'INVALID_STATUS_TRANSITION'
  );
});

test('changeProductStatus: reject requires a non-empty comment', async () => {
  fx.product = draftProduct({ status: 'PENDING_REVIEW' });
  await assert.rejects(
    () => service.changeProductStatus(1, 'reject', superAdmin, '   '),
    (err) => err.statusCode === 400 && err.code === 'REJECTION_REASON_REQUIRED'
  );
});

test('changeProductStatus: PENDING_REVIEW --reject--> REJECTED succeeds with a reason', async () => {
  fx.product = draftProduct({ status: 'PENDING_REVIEW' });
  const result = await service.changeProductStatus(1, 'reject', superAdmin, 'Missing certificate');
  assert.ok(result);
  const historyCall = calls['productStatusHistory.create'].at(-1);
  assert.equal(historyCall.data.newStatus, 'REJECTED');
  assert.equal(historyCall.data.comment, 'Missing certificate');
});

test('changeProductStatus: PUBLISHED --archive--> ARCHIVED succeeds (archive is allowed from almost any state)', async () => {
  fx.product = draftProduct({ status: 'PUBLISHED' });
  const result = await service.changeProductStatus(1, 'archive', superAdmin);
  assert.ok(result);
});

test('changeProductStatus: a company user cannot submitReview on another company\'s product', async () => {
  fx.product = draftProduct({ companyId: 10, status: 'DRAFT' });
  await assert.rejects(
    () => service.changeProductStatus(1, 'submitReview', companyB),
    (err) => err.statusCode === 403
  );
});

// ── createProduct: company scoping ────────────────────────────

test('createProduct: SUPER_ADMIN must specify a companyId explicitly (no implicit own-company fallback unless caller has one)', async () => {
  await assert.rejects(
    () => service.createProduct({ title: 'New', categoryId: 1, subcategoryId: 1 }, superAdmin),
    (err) => err.statusCode === 400 && err.code === 'COMPANY_REQUIRED'
  );
});

test('createProduct: a company user cannot spoof a companyId that isn\'t their own (rejected, not silently overridden)', async () => {
  await assert.rejects(
    () => service.createProduct({ title: 'New', categoryId: 1, subcategoryId: 1, companyId: 999 }, companyA),
    (err) => err.statusCode === 403 && err.code === 'FORBIDDEN'
  );
});

test('createProduct: a company user creates products under their own company when no companyId is sent', async () => {
  await service.createProduct({ title: 'New', categoryId: 1, subcategoryId: 1 }, companyA);
  const createArgs = calls['product.create'].at(-1);
  assert.equal(createArgs.data.companyId, 10);
});

test('createProduct: rejects a missing title before touching the database', async () => {
  await assert.rejects(
    () => service.createProduct({ categoryId: 1, subcategoryId: 1 }, companyA),
    (err) => err.statusCode === 400 && err.code === 'TITLE_REQUIRED'
  );
});

// ── deleteProduct: soft delete + tenant isolation ─────────────

test('deleteProduct: soft-deletes (sets deletedAt) rather than removing the row', async () => {
  fx.product = draftProduct({ companyId: 10 });
  await service.deleteProduct(1, companyA);
  const updateArgs = calls['product.update'].at(-1);
  assert.ok(updateArgs.data.deletedAt instanceof Date);
  assert.equal(updateArgs.data.status, 'ARCHIVED');
});

test('deleteProduct: a company cannot delete another company\'s product', async () => {
  fx.product = draftProduct({ companyId: 10 });
  await assert.rejects(
    () => service.deleteProduct(1, companyB),
    (err) => err.statusCode === 403
  );
});

// ── Upload guard clauses (file type / presence — not stream I/O) ─

test('uploadImage: rejects when no file was provided', async () => {
  fx.product = draftProduct({ companyId: 10 });
  await assert.rejects(
    () => service.uploadImage(1, undefined, companyA),
    (err) => err.statusCode === 400 && err.code === 'FILE_REQUIRED'
  );
});

test('uploadImage: rejects an unsupported mimetype/extension before any file I/O', async () => {
  fx.product = draftProduct({ companyId: 10 });
  const fakeFile = { filename: 'malware.exe', mimetype: 'application/x-msdownload', fields: {} };
  await assert.rejects(
    () => service.uploadImage(1, fakeFile, companyA),
    (err) => err.statusCode === 400 && err.code === 'INVALID_IMAGE_TYPE'
  );
});

test('uploadImage: still enforces tenant isolation before even checking the file', async () => {
  fx.product = draftProduct({ companyId: 10 });
  const fakeFile = { filename: 'photo.jpg', mimetype: 'image/jpeg', fields: {} };
  await assert.rejects(
    () => service.uploadImage(1, fakeFile, companyB), // wrong company
    (err) => err.statusCode === 403
  );
});

test('uploadDocument: rejects a non-PDF file', async () => {
  fx.product = draftProduct({ companyId: 10 });
  const fakeFile = { filename: 'spec.docx', mimetype: 'application/msword', fields: {} };
  await assert.rejects(
    () => service.uploadDocument(1, fakeFile, companyA),
    (err) => err.statusCode === 400 && err.code === 'INVALID_DOCUMENT_TYPE'
  );
});