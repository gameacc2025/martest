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
const fs = require('node:fs');
const { Readable } = require('node:stream');
const Module = require('node:module');

function injectMock(relativePath, exportsObj) {
  const resolved = require.resolve(path.join(__dirname, relativePath));
  const original = require.cache[resolved];
  require.cache[resolved] = new Module(resolved);
  require.cache[resolved].exports = exportsObj;
  require.cache[resolved].loaded = true;
  // require.cache is process-global — in newer Node versions test files
  // share a process by default, so leaving this in place would corrupt
  // whichever test file runs next and needs the real module (this file's
  // stubbed utils/rbac is exactly what broke utils/rbac.test.js).
  test.after(() => {
    if (original) require.cache[resolved] = original;
    else delete require.cache[resolved];
  });
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
    existingTier: null,      // prisma.productPriceTier.findFirst result
    createdProduct: { id: 1 },
    updatedProduct: { id: 1 },
    superAdminUserIds: [],
    companyUserIds: [],
    systemSetting: null,   // null → getReviewEditThreshold falls back to default 5
    slugQueue: [],         // sequential product.findUnique (slug collision) answers
    image: null,           // prisma.productImage.findFirst result
    imageQueue: [],        // sequential productImage.findFirst answers
    imageCount: 0,
    images: [],
    document: null,
    documentCount: 0,
    imageCreateError: null,
    documentCreateError: null,
  };
  // The call log must be cleared too: it used to accumulate across tests,
  // which made count-based assertions (e.g. "no product.update happened")
  // depend on execution order and fail depending on what earlier tests did.
  Object.keys(calls).forEach((key) => {
    calls[key].length = 0;
  });
}

const calls = {};
function recordCall(name, args) {
  calls[name] = calls[name] || [];
  calls[name].push(args);
}

const mockPrisma = {
  product: {
    findFirst: async (args) => { recordCall('product.findFirst', args); return fx.product; },
    findUnique: async (args) => {
      recordCall('product.findUnique', args);
      if (fx.slugQueue.length) return fx.slugQueue.shift();
      return null; // slug lookups: free unless a test queues a collision
    },
    create: async (args) => { recordCall('product.create', args); return fx.createdProduct; },
    update: async (args) => { recordCall('product.update', args); return fx.updatedProduct; },
    count: async () => 0,
    findMany: async () => [],
  },
  category: { findUnique: async () => fx.category },
  subcategory: { findUnique: async () => fx.subcategory },
  company: { findFirst: async () => fx.company },
  productPriceTier: {
    findMany: async (args) => { recordCall('productPriceTier.findMany', args); return fx.priceTiers; },
    create: async (args) => { recordCall('productPriceTier.create', args); return { id: 99, ...args.data }; },
    findFirst: async () => fx.existingTier,
    update: async (args) => { recordCall('productPriceTier.update', args); return { id: args.where?.id, ...args.data }; },
    delete: async (args) => { recordCall('productPriceTier.delete', args); return { id: args.where?.id }; },
  },
  productImage: {
    count: async (args) => { recordCall('productImage.count', args); return fx.imageCount; },
    findFirst: async (args) => {
      recordCall('productImage.findFirst', args);
      if (fx.imageQueue.length) return fx.imageQueue.shift();
      return fx.image;
    },
    findMany: async () => fx.images,
    create: async (args) => {
      if (fx.imageCreateError) {
        const error = fx.imageCreateError;
        fx.imageCreateError = null;
        throw error;
      }
      recordCall('productImage.create', args);
      return { id: 10, ...args.data };
    },
    update: async (args) => { recordCall('productImage.update', args); return { id: args.where?.id, ...args.data }; },
    updateMany: async (args) => { recordCall('productImage.updateMany', args); return { count: 1 }; },
    delete: async (args) => { recordCall('productImage.delete', args); return {}; },
  },
  productDocument: {
    count: async (args) => { recordCall('productDocument.count', args); return fx.documentCount; },
    findFirst: async () => fx.document,
    create: async (args) => {
      if (fx.documentCreateError) {
        const error = fx.documentCreateError;
        fx.documentCreateError = null;
        throw error;
      }
      recordCall('productDocument.create', args);
      return { id: 11, ...args.data };
    },
    delete: async (args) => { recordCall('productDocument.delete', args); return {}; },
  },
  productStatusHistory: {
    create: async (args) => { recordCall('productStatusHistory.create', args); return {}; },
    findMany: async (args) => { recordCall('productStatusHistory.findMany', args); return []; },
  },
  user: { findMany: async () => fx.superAdminUserIds.map((id) => ({ id })) },
  notification: { createMany: async (args) => { recordCall('notification.createMany', args); } },
  systemSetting: {
    // null (fx.systemSetting) → fall back to the default threshold.
    findUnique: async () => fx.systemSetting,
  },
  productActivityLog: {
    create: async (args) => { recordCall('productActivityLog.create', args); return { id: 1 }; },
    findMany: async (args) => { recordCall('productActivityLog.findMany', args); return []; },
  },
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
const companyA = { id: 2, roles: ['COMPANY_MANAGER'], accessType: 'COMPANY', permissions: ['products.read'], companyId: 10 };
const companyB = { id: 3, roles: ['COMPANY_MANAGER'], accessType: 'COMPANY', permissions: ['products.read'], companyId: 20 };
const staffModerator = { id: 5, roles: ['PRODUCT_MODERATOR'], accessType: 'STAFF', permissions: ['products.read'], companyId: 999 };
const anonymous = null;

function draftProduct(overrides = {}) {
  return { id: 1, companyId: 10, status: 'DRAFT', visibility: 'PUBLIC', title: 'X', ...overrides };
}

// A multipart file as @fastify/multipart hands it to the service:
// { filename, mimetype, fields: { name: { value } }, file: Readable }.
function makeFile({ filename = 'doc.pdf', mimetype = 'application/pdf', content = 'hello', fields = {} } = {}) {
  return { filename, mimetype, fields, file: Readable.from([Buffer.from(content)]) };
}

function largeStream(megabytes) {
  let sent = 0;
  return Readable.from((function* generate() {
    while (sent < megabytes) {
      sent += 1;
      yield Buffer.alloc(1024 * 1024);
    }
  })());
}

const imageDir = path.join(process.cwd(), 'uploads', 'products', 'images');
const documentDir = path.join(process.cwd(), 'uploads', 'products', 'documents');

// A subcategory whose template drives specification validation.
function templateSubcategory(fields, overrides = {}) {
  return {
    id: 1,
    categoryId: 1,
    status: 'ACTIVE',
    specificationTemplate: { isActive: true, fields },
    ...overrides,
  };
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

test('tenant isolation: a company CAN manage its own post-approval (PUBLISHED) product — review threshold decides re-review', async () => {
  fx.product = draftProduct({ companyId: 10, status: 'PUBLISHED', editsSinceApproval: 0 });
  const result = await service.addPriceTier(1, { minQuantity: 1, price: 100 }, companyA);
  assert.ok(result); // did not throw: post-approval products are editable
});

test('tenant isolation: a company CANNOT edit a product that is pending review or archived', async () => {
  for (const status of ['PENDING_REVIEW', 'ARCHIVED']) {
    fx.product = draftProduct({ companyId: 10, status });
    await assert.rejects(
      () => service.addPriceTier(1, { minQuantity: 1, price: 100 }, companyA),
      (err) => err.statusCode === 403 && err.code === 'PRODUCT_NOT_EDITABLE'
    );
  }
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

test('getProductById: STAFF with products.read can load pending/private products across companies', async () => {
  fx.product = draftProduct({ companyId: 10, status: 'PENDING_REVIEW', visibility: 'PRIVATE' });
  assert.ok(await service.getProductById(1, staffModerator));
});

test('getProductById: STAFF without products.read is forbidden from management detail', async () => {
  fx.product = draftProduct({ status: 'PENDING_REVIEW', visibility: 'PRIVATE' });
  await assert.rejects(
    () => service.getProductById(1, { ...staffModerator, permissions: [] }),
    (err) => err.statusCode === 403 && err.code === 'FORBIDDEN'
  );
});

test('listProducts: authorized STAFF management sees pending products across companies', async () => {
  let capturedWhere;
  mockPrisma.product.findMany = async (args) => { capturedWhere = args.where; return []; };
  await service.listProducts({ skip: 0, take: 10, filters: { status: 'PENDING_REVIEW' }, caller: staffModerator });
  assert.equal(capturedWhere.status, 'PENDING_REVIEW');
  assert.equal(capturedWhere.visibility, undefined);
  assert.equal(capturedWhere.companyId, undefined);
});

test('listProducts: even STAFF sessions on the public route remain clamped to PUBLISHED + PUBLIC', async () => {
  let capturedWhere;
  mockPrisma.product.findMany = async (args) => { capturedWhere = args.where; return []; };
  await service.listProducts({
    skip: 0, take: 10, filters: { status: 'PENDING_REVIEW' }, caller: staffModerator, publicOnly: true,
  });
  assert.equal(capturedWhere.status, 'PUBLISHED');
  assert.equal(capturedWhere.visibility, 'PUBLIC');
});

// ── listProducts scoping ──────────────────────────────────────

test('listProducts: anonymous callers are clamped to PUBLISHED + PUBLIC, and cannot use ?status= to bypass it', async () => {
  let capturedWhere;
  mockPrisma.product.findMany = async (args) => { capturedWhere = args.where; return []; };
  await service.listProducts({ skip: 0, take: 10, filters: { status: 'DRAFT' }, caller: anonymous });
  assert.equal(capturedWhere.status, 'PUBLISHED'); // filters.status is IGNORED for public callers
  assert.equal(capturedWhere.visibility, 'PUBLIC');
});

test('listProducts: applies price range, featured flag, and allowlisted sorting without weakening public visibility', async () => {
  let capturedWhere;
  let capturedOrderBy;
  mockPrisma.product.findMany = async (args) => {
    capturedWhere = args.where;
    capturedOrderBy = args.orderBy;
    return [];
  };
  mockPrisma.product.count = async (args) => { recordCall('product.count', args); return 0; };

  await service.listProducts({
    skip: 0,
    take: 10,
    filters: { minPrice: '100', maxPrice: '500', featured: 'true', sortBy: 'title', sortOrder: 'asc', status: 'DRAFT' },
    caller: anonymous,
  });

  assert.equal(capturedWhere.status, 'PUBLISHED');
  assert.equal(capturedWhere.visibility, 'PUBLIC');
  assert.equal(capturedWhere.isFeatured, true);
  assert.deepEqual(capturedWhere.prices, { some: { price: { gte: 100, lte: 500 } } });
  assert.deepEqual(capturedOrderBy, { title: 'asc' });
});

test('listProducts: rejects invalid price ranges and unsupported sort fields', async () => {
  await assert.rejects(
    () => service.listProducts({ skip: 0, take: 10, filters: { minPrice: 900, maxPrice: 100 }, caller: anonymous }),
    (err) => err.statusCode === 400 && err.code === 'INVALID_PRICE_RANGE'
  );
  await assert.rejects(
    () => service.listProducts({ skip: 0, take: 10, filters: { sortBy: 'password' }, caller: anonymous }),
    (err) => err.statusCode === 400 && err.code === 'INVALID_SORT_FIELD'
  );
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

test('changeProductStatus: company can publish its own product after STAFF approval', async () => {
  fx.product = draftProduct({ companyId: 10, status: 'APPROVED' });

  await service.changeProductStatus(1, 'publish', companyA);

  const updateArgs = calls['product.update'].at(-1);
  assert.equal(updateArgs.data.status, 'PUBLISHED');
});

test('changeProductStatus: company cannot publish a HIDDEN product without renewed STAFF approval', async () => {
  fx.product = draftProduct({ companyId: 10, status: 'HIDDEN' });

  await assert.rejects(
    () => service.changeProductStatus(1, 'publish', companyA),
    (err) => err.statusCode === 403 && err.code === 'PRODUCT_REQUIRES_STAFF_APPROVAL'
  );
  assert.equal((calls['product.update'] || []).length, 0, 'product status must not change');
});

test('changeProductStatus: STAFF can republish a previously approved HIDDEN product', async () => {
  fx.product = draftProduct({ companyId: 10, status: 'HIDDEN' });

  await service.changeProductStatus(1, 'publish', superAdmin);

  const updateArgs = calls['product.update'].at(-1);
  assert.equal(updateArgs.data.status, 'PUBLISHED');
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

// ── Review-edit threshold (post-approval edits) ────────────────
// updateProduct is exercised here. In the mock, category/subcategory always
// resolve and slug lookups always return a free slug, so only the policy
// logic (status / editsSinceApproval / activity / notifications) is asserted.

function publishedProduct(overrides = {}) {
  return draftProduct({
    companyId: 10,
    status: 'PUBLISHED',
    categoryId: 1,
    subcategoryId: 1,
    editsSinceApproval: 0,
    ...overrides,
  });
}

test('updateProduct: below threshold — PUBLISHED edit keeps status and increments editsSinceApproval', async () => {
  fx.product = publishedProduct({ editsSinceApproval: 2, title: 'Old' });
  await service.updateProduct(1, { title: 'New' }, companyA);
  const updateArgs = calls['product.update'].at(-1);
  // Status field is not touched (still PUBLISHED); only the counter is bumped.
  assert.equal(updateArgs.data.status, undefined);
  assert.equal(updateArgs.data.editsSinceApproval, 3);
});

test('updateProduct: at threshold — PUBLISHED edit goes back to PENDING_REVIEW, counter resets, super admins notified', async () => {
  fx.product = publishedProduct({ editsSinceApproval: 4, title: 'Old' });
  fx.superAdminUserIds = [10, 11];
  await service.updateProduct(1, { description: 'New desc' }, companyA);

  const updateArgs = calls['product.update'].at(-1);
  assert.equal(updateArgs.data.status, 'PENDING_REVIEW');
  assert.equal(updateArgs.data.editsSinceApproval, 0);

  // Status history records the auto re-review.
  const historyCall = calls['productStatusHistory.create'].at(-1);
  assert.equal(historyCall.data.previousStatus, 'PUBLISHED');
  assert.equal(historyCall.data.newStatus, 'PENDING_REVIEW');

  // Every edit is written to the immutable activity trail.
  const activity = calls['productActivityLog.create'].at(-1);
  assert.equal(activity.data.action, 'EDIT');
  assert.equal(activity.data.productId, 1);

  // Staff are notified that the product needs re-review.
  const notify = calls['notification.createMany'].at(-1);
  assert.deepEqual(notify.data.map((item) => item.userId), [10, 11]);
});

test('updateProduct: a company user with a customized threshold crosses earlier', async () => {
  fx.systemSetting = { value: '2' };
  fx.product = publishedProduct({ editsSinceApproval: 1 });
  await service.updateProduct(1, { title: 'New' }, companyA);
  const updateArgs = calls['product.update'].at(-1);
  assert.equal(updateArgs.data.status, 'PENDING_REVIEW');
  assert.equal(updateArgs.data.editsSinceApproval, 0);
});

test('updateProduct: admin edits never bump editsSinceApproval and never auto re-review', async () => {
  fx.product = publishedProduct({ editsSinceApproval: 3 });
  await service.updateProduct(1, { title: 'New' }, superAdmin);
  const updateArgs = calls['product.update'].at(-1);
  assert.equal(updateArgs.data.status, undefined);
  assert.equal(updateArgs.data.editsSinceApproval, undefined);
});

test('updateProduct: company cannot edit PENDING_REVIEW / ARCHIVED post-approval or not', async () => {
  for (const status of ['PENDING_REVIEW', 'ARCHIVED']) {
    fx.product = publishedProduct({ status });
    await assert.rejects(
      () => service.updateProduct(1, { title: 'New' }, companyA),
      (err) => err.statusCode === 403 && err.code === 'PRODUCT_NOT_EDITABLE'
    );
  }
});

test('getReviewEditThreshold: reads the configured value and falls back to the default', async () => {
  fx.systemSetting = { value: '7' };
  assert.equal(await service.getReviewEditThreshold(), 7);
  fx.systemSetting = { value: 'bogus' };
  assert.equal(await service.getReviewEditThreshold(), 5);
  fx.systemSetting = null;
  assert.equal(await service.getReviewEditThreshold(), 5);
});

test('changeProductStatus: approve resets editsSinceApproval to 0', async () => {
  fx.product = draftProduct({ status: 'PENDING_REVIEW', editsSinceApproval: 3 });
  await service.changeProductStatus(1, 'approve', superAdmin);
  const updateArgs = calls['product.update'].at(-1);
  assert.equal(updateArgs.data.status, 'APPROVED');
  assert.equal(updateArgs.data.editsSinceApproval, 0);
});

test('changeProductStatus: every transition writes an activity log row', async () => {
  fx.product = draftProduct({ status: 'PUBLISHED' });
  await service.changeProductStatus(1, 'archive', superAdmin);
  const activity = calls['productActivityLog.create'].at(-1);
  assert.equal(activity.data.action, 'ARCHIVE');
  assert.equal(activity.data.detail, 'Status PUBLISHED → ARCHIVED');
});

test('createProduct: logs a CREATE activity row for the new product', async () => {
  fx.createdProduct = { id: 15 };
  await service.createProduct({ title: 'New', categoryId: 1, subcategoryId: 1 }, companyA);
  const activity = calls['productActivityLog.create'].at(-1);
  assert.equal(activity.data.action, 'CREATE');
  assert.equal(activity.data.productId, 15);
});

// ── Input guards / argument normalization ────────────────────

test('createProduct: a non-numeric categoryId is rejected', async () => {
  await assert.rejects(
    () => service.createProduct({ title: 'New', categoryId: 'abc', subcategoryId: 1 }, companyA),
    (err) => err.statusCode === 400 && err.code === 'VALIDATION_ERROR'
  );
});

test('createProduct: a caller without a company cannot create a product', async () => {
  await assert.rejects(
    () => service.createProduct({ title: 'New', categoryId: 1, subcategoryId: 1 }, { id: 9, roles: [], permissions: [] }),
    (err) => err.statusCode === 400 && err.code === 'COMPANY_REQUIRED'
  );
});

test('createProduct: specifications must be a plain object', async () => {
  await assert.rejects(
    () => service.createProduct({ title: 'New', categoryId: 1, subcategoryId: 1, specifications: 'nope' }, companyA),
    (err) => err.code === 'INVALID_SPECIFICATIONS'
  );
});

test('createProduct: an unknown category is rejected', async () => {
  fx.category = null;
  await assert.rejects(
    () => service.createProduct({ title: 'New', categoryId: 1, subcategoryId: 1 }, companyA),
    (err) => err.code === 'CATEGORY_NOT_FOUND'
  );
});

test('createProduct: an inactive category is rejected', async () => {
  fx.category = { id: 1, status: 'DISABLED' };
  await assert.rejects(
    () => service.createProduct({ title: 'New', categoryId: 1, subcategoryId: 1 }, companyA),
    (err) => err.code === 'CATEGORY_INACTIVE'
  );
});

test('createProduct: an unknown subcategory is rejected', async () => {
  fx.subcategory = null;
  await assert.rejects(
    () => service.createProduct({ title: 'New', categoryId: 1, subcategoryId: 1 }, companyA),
    (err) => err.code === 'SUBCATEGORY_NOT_FOUND'
  );
});

test('createProduct: an inactive subcategory is rejected', async () => {
  fx.subcategory = { id: 1, categoryId: 1, status: 'DISABLED', specificationTemplate: null };
  await assert.rejects(
    () => service.createProduct({ title: 'New', categoryId: 1, subcategoryId: 1 }, companyA),
    (err) => err.code === 'SUBCATEGORY_INACTIVE'
  );
});

test('createProduct: a subcategory from another category is rejected', async () => {
  fx.subcategory = { id: 1, categoryId: 2, status: 'ACTIVE', specificationTemplate: null };
  await assert.rejects(
    () => service.createProduct({ title: 'New', categoryId: 1, subcategoryId: 1 }, companyA),
    (err) => err.code === 'SUBCATEGORY_CATEGORY_MISMATCH'
  );
});

test('createProduct: a missing company row is rejected', async () => {
  fx.company = null;
  await assert.rejects(
    () => service.createProduct({ title: 'New', categoryId: 1, subcategoryId: 1 }, companyA),
    (err) => err.code === 'COMPANY_NOT_FOUND'
  );
});

test('createProduct: a taken slug is suffixed until it is free', async () => {
  fx.slugQueue = [{ id: 77 }, null];
  await service.createProduct({ title: 'Cool Product', categoryId: 1, subcategoryId: 1 }, companyA);
  const args = calls['product.create'].at(-1);
  assert.equal(args.data.slug, 'cool-product-2');
});

test('createProduct: price tiers are normalized and stored on create', async () => {
  await service.createProduct({
    title: 'New',
    categoryId: 1,
    subcategoryId: 1,
    priceTiers: [{ minQuantity: 1, maxQuantity: 10, price: 100, unit: 'IRR' }],
  }, companyA);
  const args = calls['product.create'].at(-1);
  assert.equal(args.data.prices.create[0].minQuantity, 1);
  assert.equal(args.data.prices.create[0].maxQuantity, 10);
  assert.equal(args.data.prices.create[0].price, 100);
});

test('createProduct: overlapping price tiers are rejected', async () => {
  await assert.rejects(
    () => service.createProduct({
      title: 'New',
      categoryId: 1,
      subcategoryId: 1,
      priceTiers: [
        { minQuantity: 1, maxQuantity: 10, price: 100 },
        { minQuantity: 5, maxQuantity: 20, price: 90 },
      ],
    }, companyA),
    (err) => err.code === 'PRICE_TIER_OVERLAP'
  );
});

// ── Price tier validation (normalizePriceTier) ───────────────

test('addPriceTier: a negative price is rejected', async () => {
  fx.product = draftProduct({ companyId: 10 });
  await assert.rejects(
    () => service.addPriceTier(1, { minQuantity: 1, price: -5 }, companyA),
    (err) => err.code === 'INVALID_PRICE'
  );
});

test('addPriceTier: maxQuantity below minQuantity is rejected', async () => {
  fx.product = draftProduct({ companyId: 10 });
  await assert.rejects(
    () => service.addPriceTier(1, { minQuantity: 10, maxQuantity: 5, price: 100 }, companyA),
    (err) => err.code === 'INVALID_PRICE_TIER_RANGE'
  );
});

test('addPriceTier: a malformed validFrom is rejected', async () => {
  fx.product = draftProduct({ companyId: 10 });
  await assert.rejects(
    () => service.addPriceTier(1, { minQuantity: 1, price: 100, validFrom: 'not-a-date' }, companyA),
    (err) => err.code === 'INVALID_PRICE_TIER_DATES'
  );
});

test('addPriceTier: a malformed validTo is rejected', async () => {
  fx.product = draftProduct({ companyId: 10 });
  await assert.rejects(
    () => service.addPriceTier(1, { minQuantity: 1, price: 100, validTo: 'not-a-date' }, companyA),
    (err) => err.code === 'INVALID_PRICE_TIER_DATES'
  );
});

test('addPriceTier: validTo before validFrom is rejected', async () => {
  fx.product = draftProduct({ companyId: 10 });
  await assert.rejects(
    () => service.addPriceTier(1, {
      minQuantity: 1,
      price: 100,
      validFrom: '2030-01-01',
      validTo: '2029-01-01',
    }, companyA),
    (err) => err.code === 'INVALID_PRICE_TIER_DATES'
  );
});

test('addPriceTier: a non-positive minQuantity is rejected', async () => {
  fx.product = draftProduct({ companyId: 10 });
  await assert.rejects(
    () => service.addPriceTier(1, { minQuantity: 0, price: 100 }, companyA),
    (err) => err.code === 'VALIDATION_ERROR'
  );
});

test('addPriceTier: a quantity range overlapping an existing tier is rejected', async () => {
  fx.product = draftProduct({ companyId: 10 });
  fx.priceTiers = [{ id: 1, minQuantity: 1, maxQuantity: null }];
  await assert.rejects(
    () => service.addPriceTier(1, { minQuantity: 1, price: 100 }, companyA),
    (err) => err.code === 'PRICE_TIER_OVERLAP'
  );
});

test('addPriceTier: crossing the review threshold pushes the product back to review', async () => {
  fx.product = draftProduct({ companyId: 10, status: 'PUBLISHED', editsSinceApproval: 4 });
  fx.superAdminUserIds = [10];
  await service.addPriceTier(1, { minQuantity: 1, price: 100 }, companyA);

  const productUpdate = calls['product.update'].at(-1);
  assert.equal(productUpdate.data.status, 'PENDING_REVIEW');
  assert.equal(productUpdate.data.editsSinceApproval, 0);
  assert.ok(calls['notification.createMany'].length > 0);
});

// ── updatePriceTier / deletePriceTier / upsertPrice ──────────

test('updatePriceTier: a missing tier is 404', async () => {
  fx.product = draftProduct({ companyId: 10 });
  fx.existingTier = null;
  await assert.rejects(
    () => service.updatePriceTier(1, 5, { minQuantity: 1, price: 100 }, companyA),
    (err) => err.statusCode === 404 && err.code === 'PRICE_TIER_NOT_FOUND'
  );
});

test('updatePriceTier: rewrites the tier and records what changed', async () => {
  fx.product = draftProduct({ companyId: 10, categoryId: 1, subcategoryId: 1 });
  fx.existingTier = { id: 5, minQuantity: 1, maxQuantity: null, price: 100, unit: 'IRR' };
  await service.updatePriceTier(1, 5, { price: 150 }, companyA);

  const args = calls['productPriceTier.update'].at(-1);
  assert.equal(args.where.id, 5);
  assert.equal(args.data.price, 150);

  const history = calls['productStatusHistory.create'].at(-1);
  assert.match(history.data.comment, /قیمت: 100 → 150/);
  assert.equal(calls['productActivityLog.create'].at(-1).data.action, 'PRICE_TIER_UPDATE');
});

test('updatePriceTier: an unchanged tier writes no status history', async () => {
  fx.product = draftProduct({ companyId: 10, categoryId: 1, subcategoryId: 1 });
  fx.existingTier = { id: 5, minQuantity: 1, maxQuantity: null, price: 100, unit: 'IRR' };
  const historyBefore = (calls['productStatusHistory.create'] || []).length;
  await service.updatePriceTier(1, 5, { price: 100, minQuantity: 1, maxQuantity: null }, companyA);
  assert.equal((calls['productStatusHistory.create'] || []).length, historyBefore);
});

test('updatePriceTier: an overlapping range is rejected', async () => {
  fx.product = draftProduct({ companyId: 10 });
  fx.existingTier = { id: 5, minQuantity: 1, maxQuantity: 10, price: 100 };
  fx.priceTiers = [{ id: 6, minQuantity: 1, maxQuantity: 5 }];
  await assert.rejects(
    () => service.updatePriceTier(1, 5, { minQuantity: 1, maxQuantity: 10, price: 100 }, companyA),
    (err) => err.code === 'PRICE_TIER_OVERLAP'
  );
});

test('updatePriceTier: crossing the review threshold also updates the product row', async () => {
  fx.product = draftProduct({ companyId: 10, status: 'PUBLISHED', editsSinceApproval: 4 });
  fx.existingTier = { id: 5, minQuantity: 1, maxQuantity: null, price: 100, unit: 'IRR' };
  fx.superAdminUserIds = [10];
  await service.updatePriceTier(1, 5, { price: 150 }, companyA);

  const productUpdate = calls['product.update'].at(-1);
  assert.equal(productUpdate.where.id, 1);
  assert.equal(productUpdate.data.status, 'PENDING_REVIEW');
  assert.equal(productUpdate.data.editsSinceApproval, 0);
});

test('deletePriceTier: a missing tier is 404', async () => {
  fx.product = draftProduct({ companyId: 10 });
  fx.existingTier = null;
  await assert.rejects(
    () => service.deletePriceTier(1, 5, companyA),
    (err) => err.statusCode === 404 && err.code === 'PRICE_TIER_NOT_FOUND'
  );
});

test('deletePriceTier: deletes the tier and logs the removal', async () => {
  fx.product = draftProduct({ companyId: 10 });
  fx.existingTier = { id: 5, minQuantity: 1, price: 100 };
  await service.deletePriceTier(1, 5, companyA);
  assert.equal(calls['productPriceTier.delete'].at(-1).where.id, 5);
  assert.equal(calls['productActivityLog.create'].at(-1).data.action, 'PRICE_TIER_DELETE');
});

test('upsertPrice: delegates to addPriceTier', async () => {
  fx.product = draftProduct({ companyId: 10 });
  await service.upsertPrice(1, { minQuantity: 1, price: 100 }, companyA);
  assert.equal(calls['productPriceTier.create'].at(-1).data.minQuantity, 1);
});

// ── Specification validation ─────────────────────────────────

const valueFields = [
  { id: 1, key: 'weight', name: 'Weight', type: 'NUMBER', isRequired: true },
  { id: 2, key: 'color', name: 'Color', type: 'SELECT', isRequired: false, options: [{ value: 'red' }, { key: 'blue' }, { label: 'green' }, { name: 'cyan' }, 'plain'] },
  { id: 3, key: 'tags', name: 'Tags', type: 'MULTI_SELECT', isRequired: false, options: [{ value: 'a' }] },
  { id: 4, key: 'inStock', name: 'In stock', type: 'BOOLEAN', isRequired: false },
  { id: 5, key: 'releasedAt', name: 'Released', type: 'DATE', isRequired: false },
  { id: 6, key: 'note', name: 'Note', type: 'TEXT', isRequired: false },
  { id: 7, key: 'mystery', name: 'Mystery', type: 'WEIRD', isRequired: false },
];

// Template used by the `attributes` tests: nothing required, so a payload
// containing only `attributes` is valid on its own.
const attributeFields = [
  { id: 1, key: 'note', name: 'Note', type: 'TEXT', isRequired: false },
];

function createWithSpecs(specifications) {
  return service.createProduct({ title: 'New', categoryId: 1, subcategoryId: 1, specifications }, companyA);
}

test('specifications: every supported field type accepts a valid value', async () => {
  fx.subcategory = templateSubcategory(valueFields);
  await createWithSpecs({
    standard: {
      weight: 3.5,
      color: 'red',
      tags: ['a'],
      inStock: true,
      releasedAt: '2024-05-01',
      note: 'ok',
      mystery: { anything: true }, // unknown types fall through as valid
    },
  });
  assert.ok(calls['product.create'].length > 0);
});

test('specifications: a NUMBER field rejects text, SELECT rejects unknown options', async () => {
  fx.subcategory = templateSubcategory(valueFields);
  await assert.rejects(
    () => createWithSpecs({ standard: { weight: 'heavy' } }),
    (err) => err.code === 'INVALID_SPECIFICATIONS'
  );
  await assert.rejects(
    () => createWithSpecs({ standard: { weight: 1, color: 'purple' } }),
    (err) => err.code === 'INVALID_SPECIFICATIONS'
  );
  await assert.rejects(
    () => createWithSpecs({ standard: { weight: 1, color: 42 } }),
    (err) => err.code === 'INVALID_SPECIFICATIONS'
  );
});

test('specifications: BOOLEAN / DATE / TEXT / MULTI_SELECT reject the wrong shape', async () => {
  fx.subcategory = templateSubcategory(valueFields);
  await assert.rejects(() => createWithSpecs({ standard: { weight: 1, inStock: 'yes' } }), (err) => err.code === 'INVALID_SPECIFICATIONS');
  await assert.rejects(() => createWithSpecs({ standard: { weight: 1, releasedAt: 'yesterday' } }), (err) => err.code === 'INVALID_SPECIFICATIONS');
  await assert.rejects(() => createWithSpecs({ standard: { weight: 1, tags: 'a' } }), (err) => err.code === 'INVALID_SPECIFICATIONS');
  await assert.rejects(() => createWithSpecs({ standard: { weight: 1, tags: ['zzz'] } }), (err) => err.code === 'INVALID_SPECIFICATIONS');
});

test('specifications: a missing required field fails validation', async () => {
  fx.subcategory = templateSubcategory(valueFields);
  await assert.rejects(
    () => createWithSpecs({ standard: { note: 'x' } }),
    (err) => err.code === 'INVALID_SPECIFICATIONS'
  );
});

test('specifications: a SELECT with a non-array option list allows nothing', async () => {
  fx.subcategory = templateSubcategory([
    { id: 1, key: 'mode', name: 'Mode', type: 'SELECT', isRequired: false, options: 'nope' },
  ]);
  await assert.rejects(
    () => createWithSpecs({ standard: { mode: 'fast' } }),
    (err) => err.code === 'INVALID_SPECIFICATIONS'
  );
});

test('specifications: only standard/attributes keys are allowed at the top level', async () => {
  fx.subcategory = templateSubcategory(valueFields);
  await assert.rejects(
    () => createWithSpecs({ extra: {} }),
    (err) => err.code === 'INVALID_SPECIFICATIONS' && /Unknown specification key/.test(err.message)
  );
  await assert.rejects(
    () => createWithSpecs({ standard: 'not-an-object' }),
    (err) => err.code === 'INVALID_SPECIFICATIONS'
  );
});

test('specifications: an unknown standard key is rejected', async () => {
  fx.subcategory = templateSubcategory(valueFields);
  await assert.rejects(
    () => createWithSpecs({ standard: { weight: 1, colour: 'red' } }),
    (err) => err.code === 'INVALID_SPECIFICATIONS' && /Unknown standard specification key/.test(err.message)
  );
});

test('specifications: with no template any standard key is unknown', async () => {
  fx.subcategory = templateSubcategory([], { specificationTemplate: { isActive: false, fields: [] } });
  await assert.rejects(
    () => createWithSpecs({ standard: { weight: 1 } }),
    (err) => err.code === 'INVALID_SPECIFICATIONS'
  );
  // …but an empty `standard` is fine.
  await createWithSpecs({ standard: {} });
});

test('specifications: reserved core fields in the template are skipped, not required', async () => {
  fx.subcategory = templateSubcategory([
    { id: 1, key: 'brand', name: 'Brand', type: 'TEXT', isRequired: true },
    { id: 2, key: 'model', name: 'Model', type: 'TEXT', isRequired: true },
    { id: 3, key: 'note', name: 'Note', type: 'TEXT', isRequired: false },
  ]);
  await createWithSpecs({ standard: {} });
  assert.ok(calls['product.create'].length > 0);
});

test('specifications: attributes must be an array of valid entries', async () => {
  fx.subcategory = templateSubcategory(attributeFields);
  await assert.rejects(
    () => createWithSpecs({ attributes: 'nope' }),
    (err) => err.code === 'INVALID_SPECIFICATIONS'
  );
  await assert.rejects(
    () => createWithSpecs({ attributes: ['x'] }),
    (err) => err.code === 'INVALID_SPECIFICATIONS' && /Each attribute must be an object/.test(err.message)
  );
  await assert.rejects(
    () => createWithSpecs({ attributes: Array.from({ length: 21 }, (_, i) => ({ fieldId: null, title: `t${i}`, value: 'v' })) }),
    (err) => err.code === 'INVALID_SPECIFICATIONS' && /Too many attributes/.test(err.message)
  );
});

test('specifications: attribute fieldId must be null or a template field', async () => {
  fx.subcategory = templateSubcategory(attributeFields);
  await assert.rejects(
    () => createWithSpecs({ attributes: [{ fieldId: 0, title: 't', value: 'v' }] }),
    (err) => /positive integer or null/.test(err.message)
  );
  await assert.rejects(
    () => createWithSpecs({ attributes: [{ fieldId: 999, title: 't', value: 'v' }] }),
    (err) => /does not exist in this subcategory template/.test(err.message)
  );
  await createWithSpecs({ attributes: [{ fieldId: 1, title: 't', value: 'v' }] });
  await createWithSpecs({ attributes: [{ fieldId: null, title: 'fresh', value: 'v' }] });
});

test('specifications: attribute titles are required, bounded and not reserved', async () => {
  fx.subcategory = templateSubcategory(attributeFields);
  await assert.rejects(
    () => createWithSpecs({ attributes: [{ fieldId: null, title: '   ', value: 'v' }] }),
    (err) => /title is required/.test(err.message)
  );
  await assert.rejects(
    () => createWithSpecs({ attributes: [{ fieldId: null, title: 'x'.repeat(101), value: 'v' }] }),
    (err) => /at most 100 characters/.test(err.message)
  );
  // Reserved product-core titles (latin, Persian, and ZWNJ-joined spellings).
  for (const title of ['Brand', ' برند ', 'زیر\u200cدسته']) {
    await assert.rejects(
      () => createWithSpecs({ attributes: [{ fieldId: null, title, value: 'v' }] }),
      (err) => err.code === 'RESERVED_SPECIFICATION_TITLE'
    );
  }
});

test('specifications: attribute values must be non-empty scalars within the length cap', async () => {
  fx.subcategory = templateSubcategory(attributeFields);
  await assert.rejects(
    () => createWithSpecs({ attributes: [{ fieldId: null, title: 'ok', value: {} }] }),
    (err) => /must be a non-empty text, number, or boolean/.test(err.message)
  );
  await assert.rejects(
    () => createWithSpecs({ attributes: [{ fieldId: null, title: 'ok', value: '' }] }),
    (err) => /must be a non-empty text, number, or boolean/.test(err.message)
  );
  await assert.rejects(
    () => createWithSpecs({ attributes: [{ fieldId: null, title: 'ok', value: 'x'.repeat(501) }] }),
    (err) => /too long/.test(err.message)
  );
  await createWithSpecs({ attributes: [{ fieldId: null, title: 'ok', value: 42 }] });
  await createWithSpecs({ attributes: [{ fieldId: null, title: 'ok', value: true }] });
});

test('specifications: duplicate attribute titles are rejected case-insensitively', async () => {
  fx.subcategory = templateSubcategory(attributeFields);
  await assert.rejects(
    () => createWithSpecs({
      attributes: [
        { fieldId: null, title: 'Range', value: 'a' },
        { fieldId: null, title: 'range', value: 'b' },
      ],
    }),
    (err) => /Duplicate attribute title/.test(err.message)
  );
});

// ── updateProduct paths ──────────────────────────────────────

function editableProduct(overrides = {}) {
  return draftProduct({ companyId: 10, categoryId: 1, subcategoryId: 1, specifications: {}, ...overrides });
}

test('updateProduct: a missing product is 404', async () => {
  fx.product = null;
  await assert.rejects(
    () => service.updateProduct(1, { title: 'New' }, companyA),
    (err) => err.statusCode === 404 && err.code === 'PRODUCT_NOT_FOUND'
  );
});

test('updateProduct: a blank title is rejected', async () => {
  fx.product = editableProduct();
  await assert.rejects(
    () => service.updateProduct(1, { title: '   ' }, companyA),
    (err) => err.code === 'TITLE_REQUIRED'
  );
});

test('updateProduct: SUPER_ADMIN may transfer the product to another company', async () => {
  fx.product = editableProduct();
  await service.updateProduct(1, { companyId: 55 }, superAdmin);
  assert.equal(calls['product.update'].at(-1).data.companyId, 55);
});

test('updateProduct: replaces changed price tiers atomically and records the price audit', async () => {
  fx.product = editableProduct({ status: 'DRAFT' });
  fx.priceTiers = [{ id: 1, productId: 1, minQuantity: 1, maxQuantity: null, price: 100, unit: null }];

  await service.updateProduct(1, {
    title: 'Updated',
    priceTiers: [
      { minQuantity: 1, price: 125 },
      { minQuantity: 10, price: 100, unit: 'box' },
    ],
  }, companyA);

  assert.equal(calls['productPriceTier.delete'].at(-1).where.id, 1);
  const created = calls['productPriceTier.create'];
  assert.equal(created.length, 2);
  assert.equal(created[0].data.price, 125);
  assert.equal(created[1].data.minQuantity, 10);
  assert.equal(created[1].data.productId, 1);
  assert.equal(calls['productActivityLog.create'].some((call) => call.data.action === 'PRICE_TIER_UPDATE'), true);
  assert.equal(calls['productStatusHistory.create'].some((call) => call.data.comment === 'تغییر ردیف‌های قیمت محصول'), true);
});

test('updateProduct: price tier reconciliation still completes when the edit threshold is crossed', async () => {
  fx.product = publishedProduct({ editsSinceApproval: 4 });
  fx.priceTiers = [{
    id: 7, productId: 1, minQuantity: 1, maxQuantity: null, price: '100', unit: null,
    validFrom: new Date('2020-01-01T00:00:00.000Z'), validTo: null,
  }];
  fx.superAdminUserIds = [99];

  await service.updateProduct(1, {
    title: 'Updated',
    priceTiers: [{ id: 7, minQuantity: 1, price: 125 }],
  }, companyA);

  const productUpdate = calls['product.update'].at(-1);
  assert.equal(productUpdate.data.status, 'PENDING_REVIEW');
  assert.equal(productUpdate.data.editsSinceApproval, 0);
  assert.equal(calls['productPriceTier.update'].at(-1).data.price, 125);
  assert.equal(calls['notification.createMany'].length > 0, true);
});

test('updateProduct: updates an existing price tier by ID and preserves validity metadata', async () => {
  const validFrom = new Date('2020-01-01T00:00:00.000Z');
  fx.product = editableProduct({ status: 'DRAFT' });
  fx.priceTiers = [{
    id: 7, productId: 1, minQuantity: 1, maxQuantity: 10, price: '100', unit: 'box',
    validFrom, validTo: null,
  }];

  await service.updateProduct(1, {
    title: 'Updated',
    priceTiers: [{ id: 7, minQuantity: 1, maxQuantity: 10, price: 125, unit: 'box' }],
  }, companyA);

  const update = calls['productPriceTier.update'].at(-1);
  assert.equal(update.where.id, 7);
  assert.equal(update.data.price, 125);
  assert.equal(update.data.validFrom.getTime(), validFrom.getTime());
  assert.equal(update.data.validTo, null);
  assert.equal((calls['productPriceTier.delete'] || []).length, 0);
  assert.equal((calls['productPriceTier.create'] || []).length, 0);
});

test('updateProduct: does not recreate unchanged price tiers', async () => {
  fx.product = editableProduct({ status: 'DRAFT' });
  fx.priceTiers = [{
    id: 1, productId: 1, minQuantity: 1, maxQuantity: null, price: '100', unit: null,
    validFrom: new Date('2020-01-01T00:00:00.000Z'), validTo: null,
  }];

  await service.updateProduct(1, {
    title: 'Updated',
    priceTiers: [{ id: 1, minQuantity: 1, price: 100 }],
  }, companyA);

  assert.equal((calls['productPriceTier.delete'] || []).length, 0);
  assert.equal((calls['productPriceTier.create'] || []).length, 0);
  assert.equal((calls['productPriceTier.update'] || []).length, 0);
});

test('updateProduct: a company user may not transfer the product', async () => {
  fx.product = editableProduct();
  await assert.rejects(
    () => service.updateProduct(1, { companyId: 999 }, companyA),
    (err) => err.statusCode === 403 && err.code === 'FORBIDDEN'
  );
});

test('updateProduct: an admin status override is written to the status history', async () => {
  fx.product = editableProduct({ status: 'APPROVED' });
  await service.updateProduct(1, { status: 'HIDDEN', changeReason: 'temporarily hidden' }, superAdmin);

  const history = calls['productStatusHistory.create'].at(-1);
  assert.equal(history.data.previousStatus, 'APPROVED');
  assert.equal(history.data.newStatus, 'HIDDEN');
  assert.equal(history.data.comment, 'temporarily hidden');
});

test('updateProduct: changing the category re-validates the stored specifications', async () => {
  fx.product = editableProduct({ specifications: { bogus: 1 } });
  await assert.rejects(
    () => service.updateProduct(1, { categoryId: 1 }, companyA),
    (err) => err.code === 'INVALID_SPECIFICATIONS'
  );
});

test('updateProduct: a non-numeric subcategoryId is rejected', async () => {
  fx.product = editableProduct();
  await assert.rejects(
    () => service.updateProduct(1, { subcategoryId: 'x' }, companyA),
    (err) => err.code === 'VALIDATION_ERROR'
  );
});

test('deleteProduct: a missing product is 404', async () => {
  fx.product = null;
  await assert.rejects(
    () => service.deleteProduct(1, companyA),
    (err) => err.statusCode === 404 && err.code === 'PRODUCT_NOT_FOUND'
  );
});

// ── listProducts filters ─────────────────────────────────────

test('listProducts: a search term becomes a case-insensitive OR over title/description/sku', async () => {
  let capturedWhere;
  mockPrisma.product.findMany = async (args) => { capturedWhere = args.where; return []; };
  await service.listProducts({ skip: 0, take: 10, filters: { search: 'router', categoryId: 3 }, caller: companyA });
  assert.equal(capturedWhere.OR[0].title.contains, 'router');
  assert.equal(capturedWhere.OR[2].sku.contains, 'router');
  assert.equal(capturedWhere.categoryId, 3);
});

// ── changeProductStatus edge cases ───────────────────────────

test('changeProductStatus: a missing product is 404', async () => {
  fx.product = null;
  await assert.rejects(
    () => service.changeProductStatus(999, 'archive', superAdmin),
    (err) => err.statusCode === 404 && err.code === 'PRODUCT_NOT_FOUND'
  );
});

test('changeProductStatus: no recipients means no notification row is written', async () => {
  fx.product = draftProduct({ status: 'PENDING_REVIEW' });
  fx.superAdminUserIds = [];
  const notificationsBefore = (calls['notification.createMany'] || []).length;
  await service.changeProductStatus(1, 'approve', superAdmin);
  assert.equal((calls['notification.createMany'] || []).length, notificationsBefore);
});

test('changeProductStatus: submitReview notifies staff (super admins)', async () => {
  fx.product = draftProduct({ status: 'DRAFT' });
  fx.superAdminUserIds = [10, 11];
  mockPrisma.product.findFirst = async (args) => {
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
  await service.changeProductStatus(1, 'submitReview', companyA);
  assert.deepEqual(calls['notification.createMany'].at(-1).data.map((n) => n.userId), [10, 11]);
  // restore the default findFirst for later tests
  mockPrisma.product.findFirst = async (args) => { recordCall('product.findFirst', args); return fx.product; };
});

test('changeProductStatus: a review blocked by bad specifications reports the spec error', async () => {
  fx.product = draftProduct({ status: 'DRAFT' });
  mockPrisma.product.findFirst = async (args) => {
    if (args.include) {
      return {
        ...fx.product,
        title: 'Valid title', description: 'desc', categoryId: 1, subcategoryId: 1,
        images: [{ id: 1 }], prices: [{ id: 1 }],
        specifications: { bogus: 1 },
        subcategory: templateSubcategory(valueFields),
      };
    }
    return fx.product;
  };
  await assert.rejects(
    () => service.changeProductStatus(1, 'submitReview', companyA),
    (err) => err.code === 'PRODUCT_REVIEW_VALIDATION_FAILED'
      && err.details.some((d) => /Unknown specification key/.test(d))
  );
  mockPrisma.product.findFirst = async (args) => { recordCall('product.findFirst', args); return fx.product; };
});

// ── Image / document management ──────────────────────────────

test('uploadImage: stores the first image and makes it primary', async () => {
  fx.product = draftProduct({ companyId: 10 });
  fx.imageCount = 0;
  const file = makeFile({
    filename: 'photo.jpg',
    mimetype: 'image/jpeg',
    fields: { altText: { value: 'front' }, isPrimary: { value: 'true' }, sortOrder: { value: '2' } },
  });

  const image = await service.uploadImage(1, file, companyA);
  assert.equal(image.altText, 'front');
  assert.equal(image.isPrimary, true);
  assert.equal(image.sortOrder, 2);
  assert.ok(image.url.startsWith('/uploads/products/images/'));

  const storedPath = path.join(process.cwd(), image.url.replace(/^\//, ''));
  assert.ok(fs.existsSync(storedPath));
  fs.rmSync(storedPath, { force: true });
  assert.equal(calls['productActivityLog.create'].at(-1).data.action, 'IMAGE_UPLOAD');
});

test('uploadImage: a non-primary upload on an image-bearing product', async () => {
  fx.product = draftProduct({ companyId: 10 });
  fx.imageCount = 3;
  const file = makeFile({ filename: 'photo.png', mimetype: 'image/png', fields: {} });
  const image = await service.uploadImage(1, file, companyA);
  assert.equal(image.isPrimary, false);
  assert.equal(image.sortOrder, 3);
  fs.rmSync(path.join(process.cwd(), image.url.replace(/^\//, '')), { force: true });
});

test('uploadImage: an invalid isPrimary flag is rejected before any I/O', async () => {
  fx.product = draftProduct({ companyId: 10 });
  const file = makeFile({ filename: 'photo.jpg', mimetype: 'image/jpeg', fields: { isPrimary: { value: 'maybe' } } });
  await assert.rejects(
    () => service.uploadImage(1, file, companyA),
    (err) => err.code === 'INVALID_BOOLEAN'
  );
});

test('uploadImage: an invalid sortOrder is rejected before any I/O', async () => {
  fx.product = draftProduct({ companyId: 10 });
  const file = makeFile({ filename: 'photo.jpg', mimetype: 'image/jpeg', fields: { sortOrder: { value: '-1' } } });
  await assert.rejects(
    () => service.uploadImage(1, file, companyA),
    (err) => err.code === 'INVALID_SORT_ORDER'
  );
});

test('uploadImage: an oversized image is rejected and cleaned up', async () => {
  fx.product = draftProduct({ companyId: 10 });
  fs.mkdirSync(imageDir, { recursive: true });
  const before = fs.readdirSync(imageDir).sort();
  const file = { filename: 'big.jpg', mimetype: 'image/jpeg', fields: {}, file: largeStream(6) };

  await assert.rejects(
    () => service.uploadImage(1, file, companyA),
    (err) => err.code === 'FILE_TOO_LARGE' && err.statusCode === 413
  );
  assert.deepEqual(fs.readdirSync(imageDir).sort(), before);
});

test('uploadImage: a failed row insert removes the stored file', async () => {
  fx.product = draftProduct({ companyId: 10 });
  fx.imageCreateError = new Error('db down');
  fs.mkdirSync(imageDir, { recursive: true });
  const before = fs.readdirSync(imageDir).sort();
  const file = makeFile({ filename: 'photo.jpg', mimetype: 'image/jpeg' });

  await assert.rejects(
    () => service.uploadImage(1, file, companyA),
    (err) => err.message === 'db down'
  );
  assert.deepEqual(fs.readdirSync(imageDir).sort(), before);
});

test('deleteImage: a missing image is 404', async () => {
  fx.product = draftProduct({ companyId: 10 });
  fx.image = null;
  await assert.rejects(
    () => service.deleteImage(1, 33, companyA),
    (err) => err.statusCode === 404 && err.code === 'IMAGE_NOT_FOUND'
  );
});

test('deleteImage: deletes the row and the file', async () => {
  fx.product = draftProduct({ companyId: 10 });
  fx.image = { id: 33, url: '/uploads/products/images/old.jpg', isPrimary: false };
  await service.deleteImage(1, 33, companyA);
  assert.equal(calls['productImage.delete'].at(-1).where.id, 33);
  assert.equal(calls['productActivityLog.create'].at(-1).data.action, 'IMAGE_DELETE');
});

test('deleteImage: deleting the primary image promotes the next one', async () => {
  fx.product = draftProduct({ companyId: 10 });
  fx.imageQueue = [
    { id: 33, url: '/uploads/products/images/old.jpg', isPrimary: true },
    { id: 34, url: '/uploads/products/images/next.jpg' },
  ];
  await service.deleteImage(1, 33, companyA);
  const promotion = calls['productImage.update'].at(-1);
  assert.equal(promotion.where.id, 34);
  assert.equal(promotion.data.isPrimary, true);
});

test('setPrimaryImage: a missing image is 404', async () => {
  fx.product = draftProduct({ companyId: 10 });
  fx.image = null;
  await assert.rejects(
    () => service.setPrimaryImage(1, 33, companyA),
    (err) => err.statusCode === 404 && err.code === 'IMAGE_NOT_FOUND'
  );
});

test('setPrimaryImage: clears the old primary and sets the new one', async () => {
  fx.product = draftProduct({ companyId: 10 });
  fx.image = { id: 33, url: '/uploads/products/images/new.jpg' };
  await service.setPrimaryImage(1, 33, companyA);
  assert.equal(calls['productImage.updateMany'].at(-1).data.isPrimary, false);
  assert.equal(calls['productImage.update'].at(-1).data.isPrimary, true);
});

test('sortImages: duplicate ids are rejected', async () => {
  fx.product = draftProduct({ companyId: 10 });
  await assert.rejects(
    () => service.sortImages(1, [{ id: 1, sortOrder: 0 }, { id: 1, sortOrder: 1 }], companyA),
    (err) => err.code === 'DUPLICATE_IMAGE_SORT'
  );
});

test('sortImages: images from another product are rejected', async () => {
  fx.product = draftProduct({ companyId: 10 });
  fx.imageCount = 1;
  await assert.rejects(
    () => service.sortImages(1, [{ id: 1, sortOrder: 0 }, { id: 2, sortOrder: 1 }], companyA),
    (err) => err.code === 'INVALID_IMAGE_SORT'
  );
});

test('sortImages: reorders the images and logs the change', async () => {
  fx.product = draftProduct({ companyId: 10 });
  fx.imageCount = 2;
  fx.images = [{ id: 2, sortOrder: 1 }];
  const result = await service.sortImages(1, [{ id: 1, sortOrder: 1 }, { id: 2, sortOrder: 0 }], companyA);
  assert.deepEqual(result, fx.images);
  assert.equal(calls['productActivityLog.create'].at(-1).data.action, 'IMAGE_SORT');
});

test('uploadDocument: stores a typed document', async () => {
  fx.product = draftProduct({ companyId: 10 });
  fx.documentCount = 0;
  const file = makeFile({
    filename: 'spec-sheet.pdf',
    mimetype: 'application/pdf',
    fields: { type: { value: 'datasheet' } },
  });

  const document = await service.uploadDocument(1, file, companyA);
  assert.equal(document.type, 'DATASHEET');
  assert.equal(document.title, 'spec-sheet.pdf'); // no title field → filename
  assert.ok(document.url.startsWith('/uploads/products/documents/'));
  fs.rmSync(path.join(process.cwd(), document.url.replace(/^\//, '')), { force: true });
  assert.equal(calls['productActivityLog.create'].at(-1).data.action, 'DOCUMENT_UPLOAD');
});

test('uploadDocument: rejects an unknown document type', async () => {
  fx.product = draftProduct({ companyId: 10 });
  const file = makeFile({ filename: 'spec.pdf', mimetype: 'application/pdf', fields: { type: { value: 'brochure' } } });
  await assert.rejects(
    () => service.uploadDocument(1, file, companyA),
    (err) => err.code === 'INVALID_DOCUMENT_TYPE' && /DATASHEET/.test(err.message)
  );
});

test('uploadDocument: a failed row insert removes the stored file', async () => {
  fx.product = draftProduct({ companyId: 10 });
  fx.documentCreateError = new Error('db down');
  fs.mkdirSync(documentDir, { recursive: true });
  const before = fs.readdirSync(documentDir).sort();
  const file = makeFile({ filename: 'spec.pdf', mimetype: 'application/pdf', fields: { type: { value: 'MANUAL' } } });

  await assert.rejects(
    () => service.uploadDocument(1, file, companyA),
    (err) => err.message === 'db down'
  );
  assert.deepEqual(fs.readdirSync(documentDir).sort(), before);
});

test('deleteDocument: a missing document is 404', async () => {
  fx.product = draftProduct({ companyId: 10 });
  fx.document = null;
  await assert.rejects(
    () => service.deleteDocument(1, 44, companyA),
    (err) => err.statusCode === 404 && err.code === 'DOCUMENT_NOT_FOUND'
  );
});

test('deleteDocument: deletes the row and the file', async () => {
  fx.product = draftProduct({ companyId: 10 });
  fx.document = { id: 44, title: 'Datasheet', url: '/uploads/products/documents/old.pdf' };
  await service.deleteDocument(1, 44, companyA);
  assert.equal(calls['productDocument.delete'].at(-1).where.id, 44);
  assert.equal(calls['productActivityLog.create'].at(-1).data.action, 'DOCUMENT_DELETE');
});

// ── History / activity trail ─────────────────────────────────

test('getProductHistory: a missing product is 404', async () => {
  fx.product = null;
  await assert.rejects(
    () => service.getProductHistory(999),
    (err) => err.statusCode === 404 && err.code === 'PRODUCT_NOT_FOUND'
  );
});

test('getProductHistory: requires products.read for a management caller', async () => {
  fx.product = draftProduct();
  await assert.rejects(
    () => service.getProductHistory(1, { ...companyA, permissions: [] }),
    (err) => err.statusCode === 403 && err.code === 'FORBIDDEN'
  );
});

test('getProductHistory: company can read its own status timeline', async () => {
  fx.product = draftProduct({ companyId: 10 });
  assert.deepEqual(await service.getProductHistory(1, companyA), []);
});

test('getProductHistory: another company receives 404 and no audit query', async () => {
  fx.product = draftProduct({ companyId: 10 });
  await assert.rejects(
    () => service.getProductHistory(1, companyB),
    (err) => err.statusCode === 404 && err.code === 'PRODUCT_NOT_FOUND'
  );
  assert.equal((calls['productStatusHistory.findMany'] || []).length, 0);
});

test('getProductHistory: STAFF moderator with products.read can read cross-company history', async () => {
  fx.product = draftProduct({ companyId: 10 });
  assert.deepEqual(await service.getProductHistory(1, staffModerator), []);
});

test('getProductActivityLog: a missing product is 404', async () => {
  fx.product = null;
  await assert.rejects(
    () => service.getProductActivityLog(999),
    (err) => err.statusCode === 404 && err.code === 'PRODUCT_NOT_FOUND'
  );
});

test('getProductActivityLog: requires products.read for a management caller', async () => {
  fx.product = draftProduct();
  await assert.rejects(
    () => service.getProductActivityLog(1, { ...companyA, permissions: [] }),
    (err) => err.statusCode === 403 && err.code === 'FORBIDDEN'
  );
});

test('getProductActivityLog: company can read its own activity rows', async () => {
  fx.product = draftProduct({ companyId: 10 });
  assert.deepEqual(await service.getProductActivityLog(1, companyA), []);
});

test('getProductActivityLog: another company receives 404 and no audit query', async () => {
  fx.product = draftProduct({ companyId: 10 });
  await assert.rejects(
    () => service.getProductActivityLog(1, companyB),
    (err) => err.statusCode === 404 && err.code === 'PRODUCT_NOT_FOUND'
  );
  assert.equal((calls['productActivityLog.findMany'] || []).length, 0);
});

test('getProductActivityLog: STAFF moderator with products.read can read cross-company activity', async () => {
  fx.product = draftProduct({ companyId: 10 });
  assert.deepEqual(await service.getProductActivityLog(1, staffModerator), []);
});