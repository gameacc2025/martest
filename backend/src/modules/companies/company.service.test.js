// مسیر فایل: backend/src/modules/companies/company.service.test.js
// =============================================================
// Unit tests — Company service (CRUD, status/verification, soft
// delete/restore, settings + limits, statistics, scoped products)
//
// Run with:  node --test
//
// This module had ZERO test coverage before, despite owning
// multi-tenant authorization (updateCompany's SUPER_ADMIN vs
// own-company checks), the PENDING->ACTIVE activation transaction
// (which flips AccessProfile.isActive and seeds default limits),
// and soft-delete/restore invariants. It was also touched by the
// User->Profile/AccessProfile migration (see BACKEND_AUDIT_REPORT.md),
// which is exactly the kind of change that silently breaks here.
//
// Mocks injected (same technique as category.service.test.js):
//   - config/db -> mockPrisma (records calls, returns fixtures)
//   - utils/rbac -> the REAL module (SUPER_ADMIN_ROLE is a pure constant)
// =============================================================

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const Module = require('node:module');

const serviceDir = __dirname;

function injectMock(relativePath, exportsObj) {
  const resolved = require.resolve(path.join(serviceDir, relativePath));
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

// ── Mock Prisma client ───────────────────────────────────────
const calls = {
  companyFindMany: [],
  companyCount: [],
  companyFindFirst: [],
  companyFindUnique: [],
  companyCreate: [],
  companyUpdate: [],
  companyLimitUpsert: [],
  companyLimitFindMany: [],
  companyInquiryLimitUpsert: [],
  productCount: [],
  productFindMany: [],
  inquiryCount: [],
  inquiryFindMany: [],
  userCount: [],
  userUpdateMany: [],
  accessProfileUpdateMany: [],
  transaction: [],
};

let fx;
function resetMocks() {
  Object.keys(calls).forEach((k) => (calls[k] = []));
  fx = {
    company: null, // prisma.company.findUnique
    companyFirst: null, // prisma.company.findFirst (getCompanyById)
    companies: [],
    companiesTotal: 0,
    updatedCompany: { id: 1 },
    createdCompany: { id: 1 },
    companyLimits: [],
    productCount: 0,
    products: [],
    inquiryCount: 0,
    inquiries: [],
    userCount: 0,
  };
}
resetMocks();

const mockPrisma = {
  company: {
    findMany: async (args) => {
      calls.companyFindMany.push(args);
      return fx.companies;
    },
    count: async (args) => {
      calls.companyCount.push(args);
      return fx.companiesTotal;
    },
    findFirst: async (args) => {
      calls.companyFindFirst.push(args);
      return fx.companyFirst;
    },
    findUnique: async (args) => {
      calls.companyFindUnique.push(args);
      return fx.company;
    },
    create: async (args) => {
      calls.companyCreate.push(args);
      return fx.createdCompany;
    },
    update: async (args) => {
      calls.companyUpdate.push(args);
      return fx.updatedCompany;
    },
  },
  companyLimit: {
    upsert: async (args) => {
      calls.companyLimitUpsert.push(args);
      return {};
    },
    findMany: async (args) => {
      calls.companyLimitFindMany.push(args);
      return fx.companyLimits;
    },
  },
  companyInquiryLimit: {
    upsert: async (args) => {
      calls.companyInquiryLimitUpsert.push(args);
      return {};
    },
  },
  product: {
    count: async (args) => {
      calls.productCount.push(args);
      return fx.productCount;
    },
    findMany: async (args) => {
      calls.productFindMany.push(args);
      return fx.products;
    },
  },
  inquiry: {
    count: async (args) => {
      calls.inquiryCount.push(args);
      return fx.inquiryCount;
    },
    findMany: async (args) => {
      calls.inquiryFindMany.push(args);
      return fx.inquiries;
    },
  },
  user: {
    count: async (args) => {
      calls.userCount.push(args);
      return fx.userCount;
    },
    updateMany: async (args) => {
      calls.userUpdateMany.push(args);
      return { count: 0 };
    },
  },
  accessProfile: {
    updateMany: async (args) => {
      calls.accessProfileUpdateMany.push(args);
      return { count: 0 };
    },
  },
  $transaction: async (arg) => {
    calls.transaction.push(arg);
    if (Array.isArray(arg)) return Promise.all(arg);
    return arg(mockPrisma);
  },
};

injectMock('../../config/db', mockPrisma);

const {
  listCompanies,
  getCompanyById,
  createCompany,
  updateCompany,
  deleteCompany,
  restoreCompany,
  changeStatus,
  setVerification,
  updateLogo,
  getSettings,
  updateSettings,
  getStatistics,
  getCompanyProducts,
} = require('./company.service');

const SUPER_ADMIN = { roles: ['SUPER_ADMIN'], companyId: null };
const OWN_COMPANY_MANAGER = (companyId) => ({ roles: ['COMPANY_MANAGER'], companyId });

// ── listCompanies / buildWhereClause / buildOrderBy ──────────

test('listCompanies: excludes soft-deleted companies by default', async () => {
  resetMocks();
  await listCompanies({});
  assert.deepEqual(calls.companyFindMany[0].where, { deletedAt: null });
});

test('listCompanies: includeDeleted="true" removes the deletedAt filter', async () => {
  resetMocks();
  await listCompanies({ includeDeleted: 'true' });
  assert.equal('deletedAt' in calls.companyFindMany[0].where, false);
});

test('listCompanies: search builds an OR across name/email/address/description (case-insensitive)', async () => {
  resetMocks();
  await listCompanies({ search: 'iran' });
  const { OR } = calls.companyFindMany[0].where;
  assert.equal(OR.length, 4);
  for (const clause of OR) {
    const field = Object.keys(clause)[0];
    assert.deepEqual(clause[field], { contains: 'iran', mode: 'insensitive' });
  }
});

test('listCompanies: type/status/isVerified filters are applied when provided', async () => {
  resetMocks();
  await listCompanies({ type: 'MANUFACTURER', status: 'ACTIVE', isVerified: 'true' });
  assert.deepEqual(calls.companyFindMany[0].where, {
    deletedAt: null,
    type: 'MANUFACTURER',
    status: 'ACTIVE',
    isVerified: true,
  });
});

test('listCompanies: isVerified="false" is distinguished from "not provided"', async () => {
  resetMocks();
  await listCompanies({ isVerified: 'false' });
  assert.equal(calls.companyFindMany[0].where.isVerified, false);
});

test('listCompanies: default sort is createdAt desc', async () => {
  resetMocks();
  await listCompanies({});
  assert.deepEqual(calls.companyFindMany[0].orderBy, { createdAt: 'desc' });
});

test('listCompanies: sort="name:asc" maps to a whitelisted field', async () => {
  resetMocks();
  await listCompanies({ sort: 'name:asc' });
  assert.deepEqual(calls.companyFindMany[0].orderBy, { name: 'asc' });
});

test('listCompanies: a genuinely unknown sort field falls back to createdAt', async () => {
  resetMocks();
  await listCompanies({ sort: 'totallyUnknownField:asc' });
  assert.deepEqual(calls.companyFindMany[0].orderBy, { createdAt: 'asc' });
});

// Regression test for a real bug found via testing: `SORT_FIELDS[field] ||
// 'createdAt'` used plain-object property lookup, so field="__proto__" read
// the inherited Object.prototype (truthy) instead of falling through to
// undefined -> 'createdAt', bypassing the whitelist. Fixed by using
// Object.prototype.hasOwnProperty.call(SORT_FIELDS, field) instead.
test('listCompanies: sort="__proto__" does NOT bypass the whitelist (regression test)', async () => {
  resetMocks();
  await listCompanies({ sort: '__proto__:asc' });
  assert.deepEqual(calls.companyFindMany[0].orderBy, { createdAt: 'asc' });
});

test('listCompanies: skip/take are forwarded and excluded from the filters', async () => {
  resetMocks();
  await listCompanies({ skip: 10, take: 20 });
  assert.equal(calls.companyFindMany[0].skip, 10);
  assert.equal(calls.companyFindMany[0].take, 20);
});

test('listCompanies: returns { items, total }', async () => {
  resetMocks();
  fx.companies = [{ id: 1 }];
  fx.companiesTotal = 1;
  const result = await listCompanies({});
  assert.deepEqual(result, { items: fx.companies, total: 1 });
});

// ── getCompanyById ────────────────────────────────────────────

test('getCompanyById: excludes soft-deleted companies by default', async () => {
  resetMocks();
  await getCompanyById(5);
  assert.deepEqual(calls.companyFindFirst[0].where, { id: 5, deletedAt: null });
});

test('getCompanyById: includeDeleted=true skips the deletedAt filter', async () => {
  resetMocks();
  await getCompanyById(5, true);
  assert.deepEqual(calls.companyFindFirst[0].where, { id: 5 });
});

test('getCompanyById: coerces a string id to a number', async () => {
  resetMocks();
  await getCompanyById('42');
  assert.equal(calls.companyFindFirst[0].where.id, 42);
});

test('getCompanyById: returns null when not found (no crash flattening accessProfiles)', async () => {
  resetMocks();
  fx.companyFirst = null;
  const result = await getCompanyById(1);
  assert.equal(result, null);
});

test('getCompanyById: flattens accessProfiles into a friendly users[] array, pulling names from Profile', async () => {
  resetMocks();
  fx.companyFirst = {
    id: 1,
    name: 'Acme',
    accessProfiles: [
      {
        id: 10,
        type: 'COMPANY',
        isActive: true,
        user: {
          id: 100,
          email: 'a@x.com',
          status: 'ACTIVE',
          createdAt: 'now',
          profile: { firstName: 'Ali', lastName: 'Rezaei', avatar: 'a.png' },
        },
      },
    ],
  };

  const result = await getCompanyById(1);
  assert.equal('accessProfiles' in result, false);
  assert.deepEqual(result.users, [
    {
      id: 100,
      email: 'a@x.com',
      status: 'ACTIVE',
      createdAt: 'now',
      type: 'COMPANY',
      isActive: true,
      firstName: 'Ali',
      lastName: 'Rezaei',
      avatar: 'a.png',
    },
  ]);
});

test('getCompanyById: tolerates a user with no Profile row (nulls, not a throw)', async () => {
  resetMocks();
  fx.companyFirst = {
    id: 1,
    accessProfiles: [
      { id: 10, type: 'STAFF', isActive: true, user: { id: 100, email: 'x@x.com', status: 'ACTIVE', createdAt: 'now', profile: null } },
    ],
  };

  const result = await getCompanyById(1);
  assert.equal(result.users[0].firstName, null);
  assert.equal(result.users[0].lastName, null);
  assert.equal(result.users[0].avatar, null);
});

// ── createCompany ─────────────────────────────────────────────

test('createCompany: strips relation-shaped fields not owned directly by Company', async () => {
  resetMocks();
  await createCompany({
    name: 'Acme',
    settings: { foo: 1 },
    limits: undefined,
    features: ['x'],
    allowedCategories: [1, 2],
    companyUsers: [{}],
    users: [{}],
    inquiryLimit: undefined,
  });

  const data = calls.companyCreate[0].data;
  assert.equal(data.name, 'Acme');
  for (const key of ['settings', 'features', 'allowedCategories', 'companyUsers', 'users']) {
    assert.equal(key in data, false);
  }
});

test('createCompany: nested-creates inquiryLimit and limits when provided', async () => {
  resetMocks();
  await createCompany({
    name: 'Acme',
    inquiryLimit: { maxOpenInquiries: 5 },
    limits: { 'rfq.max_open': 5 },
  });

  const data = calls.companyCreate[0].data;
  assert.deepEqual(data.inquiryLimit, { create: { maxOpenInquiries: 5 } });
  assert.deepEqual(data.limits, { create: [{ key: 'rfq.max_open', value: 5 }] });
});

test('createCompany: omits inquiryLimit/limits nested-create when not provided', async () => {
  resetMocks();
  await createCompany({ name: 'Acme' });
  const data = calls.companyCreate[0].data;
  assert.equal(data.inquiryLimit, undefined);
  assert.equal(data.limits, undefined);
});

// ── updateCompany — multi-tenant authorization ──────────────────

test('updateCompany: 404s when the company does not exist', async () => {
  resetMocks();
  fx.company = null;
  await assert.rejects(() => updateCompany(1, {}, SUPER_ADMIN), (err) => {
    assert.equal(err.statusCode, 404);
    return true;
  });
});

test('updateCompany: 404s (not 400) when the company is soft-deleted, even for SUPER_ADMIN', async () => {
  resetMocks();
  fx.company = { id: 1, deletedAt: new Date() };
  await assert.rejects(() => updateCompany(1, {}, SUPER_ADMIN), (err) => {
    assert.equal(err.statusCode, 404);
    return true;
  });
});

test('updateCompany: 403s a non-SUPER_ADMIN caller editing a company that is not their own', async () => {
  resetMocks();
  fx.company = { id: 1, deletedAt: null };
  await assert.rejects(
    () => updateCompany(1, { name: 'X' }, OWN_COMPANY_MANAGER(2)),
    (err) => {
      assert.equal(err.statusCode, 403);
      return true;
    }
  );
  assert.equal(calls.companyUpdate.length, 0);
});

test('updateCompany: allows a non-SUPER_ADMIN caller to edit their own company', async () => {
  resetMocks();
  fx.company = { id: 1, deletedAt: null };
  await updateCompany(1, { name: 'X' }, OWN_COMPANY_MANAGER(1));
  assert.equal(calls.companyUpdate.length, 1);
});

test('updateCompany: strips status/isVerified/type from a non-SUPER_ADMIN update (privilege escalation guard)', async () => {
  resetMocks();
  fx.company = { id: 1, deletedAt: null };
  await updateCompany(1, { name: 'X', status: 'ACTIVE', isVerified: true, type: 'MANUFACTURER' }, OWN_COMPANY_MANAGER(1));

  const data = calls.companyUpdate[0].data;
  assert.equal(data.name, 'X');
  assert.equal('status' in data, false);
  assert.equal('isVerified' in data, false);
  assert.equal('type' in data, false);
});

test('updateCompany: SUPER_ADMIN may set status/isVerified/type', async () => {
  resetMocks();
  fx.company = { id: 1, deletedAt: null };
  await updateCompany(1, { status: 'SUSPENDED', isVerified: true, type: 'MANUFACTURER' }, SUPER_ADMIN);

  const data = calls.companyUpdate[0].data;
  assert.equal(data.status, 'SUSPENDED');
  assert.equal(data.isVerified, true);
  assert.equal(data.type, 'MANUFACTURER');
});

test('updateCompany: when limits are provided, upserts them inside the same transaction and re-fetches', async () => {
  resetMocks();
  fx.company = { id: 1, deletedAt: null };
  await updateCompany(1, { limits: { 'rfq.max_open': 10 } }, SUPER_ADMIN);

  assert.equal(calls.companyLimitUpsert.length, 1);
  // re-fetched via tx.company.findUnique after the limit upsert
  assert.equal(calls.companyFindUnique.length >= 1, true);
});

test('updateCompany: without limits, does not touch companyLimit and returns the plain update result', async () => {
  resetMocks();
  fx.company = { id: 1, deletedAt: null };
  fx.updatedCompany = { id: 1, name: 'X' };
  const result = await updateCompany(1, { name: 'X' }, SUPER_ADMIN);

  assert.equal(calls.companyLimitUpsert.length, 0);
  assert.deepEqual(result, { id: 1, name: 'X' });
});

// ── deleteCompany / restoreCompany ───────────────────────────

test('deleteCompany: 404s when not found', async () => {
  resetMocks();
  fx.company = null;
  await assert.rejects(() => deleteCompany(1), (err) => {
    assert.equal(err.statusCode, 404);
    return true;
  });
});

test('deleteCompany: 400s when already soft-deleted (idempotency guard)', async () => {
  resetMocks();
  fx.company = { id: 1, deletedAt: new Date() };
  await assert.rejects(() => deleteCompany(1), (err) => {
    assert.equal(err.statusCode, 400);
    return true;
  });
  assert.equal(calls.companyUpdate.length, 0);
});

test('deleteCompany: sets deletedAt and forces status to INACTIVE', async () => {
  resetMocks();
  fx.company = { id: 1, deletedAt: null };
  await deleteCompany(1);

  const data = calls.companyUpdate[0].data;
  assert.ok(data.deletedAt instanceof Date);
  assert.equal(data.status, 'INACTIVE');
});

test('restoreCompany: 404s when not found', async () => {
  resetMocks();
  fx.company = null;
  await assert.rejects(() => restoreCompany(1), (err) => {
    assert.equal(err.statusCode, 404);
    return true;
  });
});

test('restoreCompany: 400s when the company is not actually deleted', async () => {
  resetMocks();
  fx.company = { id: 1, deletedAt: null };
  await assert.rejects(() => restoreCompany(1), (err) => {
    assert.equal(err.statusCode, 400);
    return true;
  });
});

test('restoreCompany: clears deletedAt and resets status to ACTIVE', async () => {
  resetMocks();
  fx.company = { id: 1, deletedAt: new Date() };
  await restoreCompany(1);
  assert.deepEqual(calls.companyUpdate[0].data, { deletedAt: null, status: 'ACTIVE' });
});

// ── changeStatus — the PENDING->ACTIVE activation transaction ──

test('changeStatus: 404s when the company does not exist', async () => {
  resetMocks();
  fx.company = null;
  await assert.rejects(() => changeStatus(1, 'ACTIVE'), (err) => {
    assert.equal(err.statusCode, 404);
    return true;
  });
});

test('changeStatus: 400s for a soft-deleted company', async () => {
  resetMocks();
  fx.company = { id: 1, deletedAt: new Date(), status: 'ACTIVE' };
  await assert.rejects(() => changeStatus(1, 'INACTIVE'), (err) => {
    assert.equal(err.statusCode, 400);
    return true;
  });
});

test('changeStatus: 400s an invalid status value (whitelist)', async () => {
  resetMocks();
  fx.company = { id: 1, deletedAt: null, status: 'ACTIVE' };
  await assert.rejects(() => changeStatus(1, 'DELETED'), (err) => {
    assert.equal(err.statusCode, 400);
    return true;
  });
});

test('changeStatus: plain transition (not PENDING->ACTIVE) is a single update, no transaction', async () => {
  resetMocks();
  fx.company = { id: 1, deletedAt: null, status: 'ACTIVE' };
  await changeStatus(1, 'SUSPENDED');

  assert.equal(calls.transaction.length, 0);
  assert.deepEqual(calls.companyUpdate[0].data, { status: 'SUSPENDED' });
});

test('changeStatus: ACTIVE from a non-PENDING status is also a plain update (no side effects)', async () => {
  resetMocks();
  fx.company = { id: 1, deletedAt: null, status: 'SUSPENDED' };
  await changeStatus(1, 'ACTIVE');

  assert.equal(calls.transaction.length, 0);
  assert.equal(calls.userUpdateMany.length, 0);
  assert.equal(calls.accessProfileUpdateMany.length, 0);
});

test('changeStatus: PENDING->ACTIVE runs inside a transaction and activates PENDING users scoped by AccessProfile.companyId', async () => {
  resetMocks();
  fx.company = { id: 7, deletedAt: null, status: 'PENDING' };
  await changeStatus(7, 'ACTIVE');

  assert.equal(calls.transaction.length, 1);
  assert.deepEqual(calls.userUpdateMany[0].where, { accessProfile: { companyId: 7 }, status: 'PENDING' });
  assert.deepEqual(calls.userUpdateMany[0].data, { status: 'ACTIVE' });
});

test('changeStatus: PENDING->ACTIVE flips only currently-inactive AccessProfiles to active (does not touch already-active ones)', async () => {
  resetMocks();
  fx.company = { id: 7, deletedAt: null, status: 'PENDING' };
  await changeStatus(7, 'ACTIVE');

  assert.deepEqual(calls.accessProfileUpdateMany[0].where, { companyId: 7, isActive: false });
  assert.deepEqual(calls.accessProfileUpdateMany[0].data, { isActive: true });
});

test('changeStatus: PENDING->ACTIVE seeds default CompanyInquiryLimit and CompanyLimit rows without overwriting existing ones (upsert, update: {})', async () => {
  resetMocks();
  fx.company = { id: 7, deletedAt: null, status: 'PENDING' };
  await changeStatus(7, 'ACTIVE');

  assert.equal(calls.companyInquiryLimitUpsert.length, 1);
  assert.deepEqual(calls.companyInquiryLimitUpsert[0].update, {});
  assert.deepEqual(calls.companyInquiryLimitUpsert[0].create, {
    companyId: 7, maxOpenInquiries: 5, maxActiveResponses: 20,
  });

  assert.equal(calls.companyLimitUpsert.length, 4);
  for (const call of calls.companyLimitUpsert) {
    assert.deepEqual(call.update, {});
  }
  assert.deepEqual(
    calls.companyLimitUpsert.map((c) => c.create.key).sort(),
    ['rfq.max_open', 'rfq_response.max_active', 'rfq_response.max_daily', 'rfq_response.max_monthly'].sort()
  );
});

// ── setVerification / updateLogo ─────────────────────────────

test('setVerification: 404s when not found', async () => {
  resetMocks();
  fx.company = null;
  await assert.rejects(() => setVerification(1, true), (err) => {
    assert.equal(err.statusCode, 404);
    return true;
  });
});

test('setVerification: coerces truthy/falsy input to a strict boolean', async () => {
  resetMocks();
  fx.company = { id: 1 };
  await setVerification(1, 'yes');
  assert.equal(calls.companyUpdate[0].data.isVerified, true);

  resetMocks();
  fx.company = { id: 1 };
  await setVerification(1, 0);
  assert.equal(calls.companyUpdate[0].data.isVerified, false);
});

test('updateLogo: 404s when not found', async () => {
  resetMocks();
  fx.company = null;
  await assert.rejects(() => updateLogo(1, 'logo.png'), (err) => {
    assert.equal(err.statusCode, 404);
    return true;
  });
});

test('updateLogo: updates the logo field', async () => {
  resetMocks();
  fx.company = { id: 1 };
  await updateLogo(1, 'logo.png');
  assert.deepEqual(calls.companyUpdate[0].data, { logo: 'logo.png' });
});

// ── getSettings / updateSettings ─────────────────────────────

test('getSettings: 404s when not found', async () => {
  resetMocks();
  fx.company = null;
  await assert.rejects(() => getSettings(1), (err) => {
    assert.equal(err.statusCode, 404);
    return true;
  });
});

test('getSettings: returns only inquiryLimit + limits', async () => {
  resetMocks();
  fx.company = { id: 1, inquiryLimit: { maxOpenInquiries: 5 }, limits: [{ key: 'a', value: 1 }], name: 'Acme' };
  const result = await getSettings(1);
  assert.deepEqual(result, { inquiryLimit: { maxOpenInquiries: 5 }, limits: [{ key: 'a', value: 1 }] });
});

test('updateSettings: 404s when not found', async () => {
  resetMocks();
  fx.company = null;
  await assert.rejects(() => updateSettings(1, {}), (err) => {
    assert.equal(err.statusCode, 404);
    return true;
  });
});

test('updateSettings: maps legacy maxOpenInquiries/maxActiveResponses fields onto the new limit keys', async () => {
  resetMocks();
  fx.company = { id: 1 };
  await updateSettings(1, { maxOpenInquiries: 8, maxActiveResponses: 30 });

  const keys = calls.companyLimitUpsert.map((c) => c.create.key).sort();
  assert.deepEqual(keys, ['rfq.max_open', 'rfq_response.max_active'].sort());
});

test('updateSettings: rejects a negative or non-integer limit value', async () => {
  resetMocks();
  fx.company = { id: 1 };
  await assert.rejects(() => updateSettings(1, { limits: { 'rfq.max_open': -1 } }), (err) => {
    assert.equal(err.statusCode, 400);
    assert.equal(err.code, 'INVALID_COMPANY_LIMIT_VALUE');
    return true;
  });
});

test('updateSettings: runs inside a transaction', async () => {
  resetMocks();
  fx.company = { id: 1 };
  await updateSettings(1, { limits: { 'rfq.max_open': 5 } });
  assert.equal(calls.transaction.length, 1);
});

// ── getStatistics ─────────────────────────────────────────────

test('getStatistics: 404s when not found', async () => {
  resetMocks();
  fx.company = null;
  await assert.rejects(() => getStatistics(1), (err) => {
    assert.equal(err.statusCode, 404);
    return true;
  });
});

test('getStatistics: scopes user counts through AccessProfile.companyId, not a User.companyId column', async () => {
  resetMocks();
  fx.company = { id: 9 };
  await getStatistics(9);

  assert.deepEqual(calls.userCount[0].where, { accessProfile: { companyId: 9 } });
  assert.deepEqual(calls.userCount[1].where, { accessProfile: { companyId: 9 }, status: 'ACTIVE' });
});

test('getStatistics: assembles counts + recentProducts + recentOrders', async () => {
  resetMocks();
  fx.company = { id: 9 };
  fx.productCount = 3;
  fx.inquiryCount = 2;
  fx.userCount = 4;
  fx.products = [{ id: 1 }];
  fx.inquiries = [{ id: 2 }];

  const result = await getStatistics(9);
  assert.deepEqual(result.counts, {
    products: 3, publishedProducts: 3, orders: 2, pendingOrders: 2, users: 4, activeUsers: 4,
  });
  assert.deepEqual(result.recentProducts, [{ id: 1 }]);
  assert.deepEqual(result.recentOrders, [{ id: 2 }]);
});

// ── getCompanyProducts ────────────────────────────────────────

test('getCompanyProducts: scopes by companyId', async () => {
  resetMocks();
  await getCompanyProducts(3, {});
  assert.deepEqual(calls.productFindMany[0].where, { companyId: 3 });
});

test('getCompanyProducts: status and search are additive filters', async () => {
  resetMocks();
  await getCompanyProducts(3, { status: 'PUBLISHED', search: 'router' });

  const where = calls.productFindMany[0].where;
  assert.equal(where.companyId, 3);
  assert.equal(where.status, 'PUBLISHED');
  assert.deepEqual(where.OR, [
    { title: { contains: 'router', mode: 'insensitive' } },
    { sku: { contains: 'router', mode: 'insensitive' } },
  ]);
});

test('getCompanyProducts: returns { items, total }', async () => {
  resetMocks();
  fx.products = [{ id: 1 }];
  fx.productCount = 1;
  const result = await getCompanyProducts(3, {});
  assert.deepEqual(result, { items: fx.products, total: 1 });
});
