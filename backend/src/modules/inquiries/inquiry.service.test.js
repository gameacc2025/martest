// =============================================================
// Unit tests — Inquiry listing & details (listInquiries / getInquiry)
//
// Run with:  node --test
//
// These tests inject a mock Prisma client into the module cache
// before loading the service, so no database is required.
// =============================================================

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const Module = require('node:module');

// ── Mock Prisma client ───────────────────────────────────────
// We capture the arguments each call receives so tests can assert
// on the where/orderBy/skip/take that the service builds.
const calls = {
  count: [],
  findMany: [],
  findUnique: [],
};

let nextCount = 0;
let nextFindMany = [];
let nextFindUnique = null;

const mockPrisma = {
  inquiry: {
    count: async (args) => {
      calls.count.push(args);
      return nextCount;
    },
    findMany: async (args) => {
      calls.findMany.push(args);
      return nextFindMany;
    },
    findUnique: async (args) => {
      calls.findUnique.push(args);
      return nextFindUnique;
    },
  },
};

// ── Inject mocks into the require cache ──────────────────────
// The service does: require('../../config/db') and
// require('../companies/company-rule.service'). We resolve those
// paths relative to the service file and pre-populate the cache.
const serviceDir = path.join(__dirname);
const dbPath = require.resolve(path.join(serviceDir, '../../config/db'));
const companyRulePath = require.resolve(path.join(serviceDir, '../companies/company-rule.service'));

require.cache[dbPath] = new Module(dbPath);
require.cache[dbPath].exports = mockPrisma;
require.cache[dbPath].loaded = true;

require.cache[companyRulePath] = new Module(companyRulePath);
require.cache[companyRulePath].exports = {
  validateInquiryCreationCapacity: async () => {},
  validateResponseSubmissionCapacity: async () => {},
};
require.cache[companyRulePath].loaded = true;

// Now load the service (it will pick up the mocks above)
const inquiryService = require('./inquiry.service');

function resetMocks() {
  calls.count = [];
  calls.findMany = [];
  calls.findUnique = [];
  nextCount = 0;
  nextFindMany = [];
  nextFindUnique = null;
}

const superAdmin = { id: 1, roles: ['SUPER_ADMIN'], permissions: ['*'], companyId: null };
const buyer = { id: 2, roles: ['COMPANY_ADMIN'], permissions: ['inquiries.read'], companyId: 10 };
const seller = { id: 3, roles: ['COMPANY_ADMIN'], permissions: ['inquiries.read'], companyId: 20 };
const orphan = { id: 4, roles: ['USER'], permissions: ['inquiries.read'], companyId: null };

// ── listInquiries ────────────────────────────────────────────

test('listInquiries returns a paginated response shape', async () => {
  resetMocks();
  nextCount = 3;
  nextFindMany = [{ id: 1 }, { id: 2 }, { id: 3 }];

  const result = await inquiryService.listInquiries({ page: 1, limit: 20 }, buyer);

  assert.deepEqual(result.data, nextFindMany);
  assert.equal(result.meta.total, 3);
  assert.equal(result.meta.page, 1);
  assert.equal(result.meta.limit, 20);
  assert.equal(result.meta.totalPages, 1);
});

test('listInquiries scope=sent filters by the caller company', async () => {
  resetMocks();
  await inquiryService.listInquiries({ scope: 'sent' }, buyer);

  const where = calls.findMany[0].where;
  assert.ok(where.AND.some((c) => c.companyId === buyer.companyId));
});

test('listInquiries scope=received filters by owned product company', async () => {
  resetMocks();
  await inquiryService.listInquiries({ scope: 'received' }, seller);

  const where = calls.findMany[0].where;
  const hasProductFilter = where.AND.some(
    (c) => c.items && c.items.some && c.items.some.product.companyId === seller.companyId,
  );
  assert.ok(hasProductFilter);
});

test('listInquiries scope=all as SUPER_ADMIN applies no company filter', async () => {
  resetMocks();
  await inquiryService.listInquiries({ scope: 'all' }, superAdmin);

  const where = calls.findMany[0].where;
  // No AND clauses means unrestricted (aside from optional status/search)
  assert.equal(where.AND, undefined);
});

test('listInquiries applies a status filter', async () => {
  resetMocks();
  await inquiryService.listInquiries({ scope: 'all', status: 'OPEN' }, superAdmin);

  const where = calls.findMany[0].where;
  assert.ok(where.AND.some((c) => c.status === 'OPEN'));
});

test('listInquiries rejects an invalid status', async () => {
  resetMocks();
  await assert.rejects(
    () => inquiryService.listInquiries({ scope: 'all', status: 'BOGUS' }, superAdmin),
    (err) => err.code === 'INVALID_INQUIRY_STATUS',
  );
});

test('listInquiries builds a case-insensitive search OR clause', async () => {
  resetMocks();
  await inquiryService.listInquiries({ scope: 'all', search: 'router' }, superAdmin);

  const where = calls.findMany[0].where;
  const searchClause = where.AND.find((c) => Array.isArray(c.OR));
  assert.ok(searchClause);
  assert.equal(searchClause.OR[0].title.contains, 'router');
  assert.equal(searchClause.OR[0].title.mode, 'insensitive');
});

test('listInquiries sorts by an allowed field/order', async () => {
  resetMocks();
  await inquiryService.listInquiries({ scope: 'all', sortBy: 'title', sortOrder: 'asc' }, superAdmin);
  assert.deepEqual(calls.findMany[0].orderBy, { title: 'asc' });
});

test('listInquiries falls back to createdAt desc for an invalid sort field', async () => {
  resetMocks();
  await inquiryService.listInquiries({ scope: 'all', sortBy: 'hacker', sortOrder: 'sideways' }, superAdmin);
  assert.deepEqual(calls.findMany[0].orderBy, { createdAt: 'desc' });
});

test('listInquiries computes skip/take from pagination params', async () => {
  resetMocks();
  await inquiryService.listInquiries({ scope: 'all', page: 3, limit: 10 }, superAdmin);
  assert.equal(calls.findMany[0].skip, 20);
  assert.equal(calls.findMany[0].take, 10);
});

test('listInquiries requires a company for non-admin sent scope', async () => {
  resetMocks();
  await assert.rejects(
    () => inquiryService.listInquiries({ scope: 'sent' }, orphan),
    (err) => err.code === 'COMPANY_REQUIRED',
  );
});

// ── getInquiry ───────────────────────────────────────────────

test('getInquiry rejects an invalid id', async () => {
  resetMocks();
  await assert.rejects(
    () => inquiryService.getInquiry('abc', superAdmin),
    (err) => err.code === 'VALIDATION_ERROR',
  );
});

test('getInquiry returns 404 when the inquiry is missing', async () => {
  resetMocks();
  nextFindUnique = null;
  await assert.rejects(
    () => inquiryService.getInquiry(99, superAdmin),
    (err) => err.statusCode === 404 && err.code === 'INQUIRY_NOT_FOUND',
  );
});

test('getInquiry allows the owning (buyer) company', async () => {
  resetMocks();
  nextFindUnique = { id: 5, companyId: buyer.companyId, items: [] };
  const inquiry = await inquiryService.getInquiry(5, buyer);
  assert.equal(inquiry.id, 5);
});

test('getInquiry allows a seller who owns a requested product', async () => {
  resetMocks();
  nextFindUnique = {
    id: 6,
    companyId: buyer.companyId,
    items: [{ product: { company: { id: seller.companyId } } }],
  };
  const inquiry = await inquiryService.getInquiry(6, seller);
  assert.equal(inquiry.id, 6);
});

test('getInquiry hides an inquiry from an unrelated company (404)', async () => {
  resetMocks();
  nextFindUnique = {
    id: 7,
    companyId: buyer.companyId,
    items: [{ product: { company: { id: seller.companyId } } }],
  };
  const unrelated = { id: 9, roles: ['COMPANY_ADMIN'], permissions: ['inquiries.read'], companyId: 999 };
  await assert.rejects(
    () => inquiryService.getInquiry(7, unrelated),
    (err) => err.statusCode === 404 && err.code === 'INQUIRY_NOT_FOUND',
  );
});

test('getInquiry allows SUPER_ADMIN regardless of company', async () => {
  resetMocks();
  nextFindUnique = { id: 8, companyId: 555, items: [] };
  const inquiry = await inquiryService.getInquiry(8, superAdmin);
  assert.equal(inquiry.id, 8);
});
