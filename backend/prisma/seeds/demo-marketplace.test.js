const test = require('node:test');
const assert = require('node:assert/strict');
const { DEMO_COMPANIES, DEMO_CUSTOMERS, CATALOG, upsertDemoUser } = require('./demo-marketplace');

test('demo fixture contains ten companies across all supported company types', () => {
  assert.equal(DEMO_COMPANIES.length, 10);
  assert.deepEqual(new Set(DEMO_COMPANIES.map((company) => company.type)),
    new Set(['MANUFACTURER', 'IMPORTER', 'TELECOM_OPERATOR']));
});

test('demo fixture contains five customer accounts', () => {
  assert.equal(DEMO_CUSTOMERS.length, 5);
});

test('demo CUSTOMER fixtures receive explicit CUSTOMER AccessProfiles and customer profiles', async () => {
  const calls = { accessProfiles: [], profiles: [], userRoles: [] };
  const prisma = {
    user: { upsert: async () => ({ id: 101 }) },
    accessProfile: { upsert: async (args) => { calls.accessProfiles.push(args); } },
    profile: { upsert: async (args) => { calls.profiles.push(args); } },
    userRole: { upsert: async (args) => { calls.userRoles.push(args); } },
  };

  await upsertDemoUser(prisma, {
    phone: '09912000001',
    passwordHash: 'hash',
    role: { id: 5 },
    customer: ['مهدی', 'احمدی'],
  });

  assert.equal(calls.accessProfiles.length, 1);
  assert.deepEqual(calls.accessProfiles[0].create, {
    userId: 101, type: 'CUSTOMER', companyId: null, isActive: true,
  });
  assert.deepEqual(calls.accessProfiles[0].update, {
    type: 'CUSTOMER', companyId: null, isActive: true,
  });
  assert.deepEqual(calls.profiles[0].create, {
    userId: 101, firstName: 'مهدی', lastName: 'احمدی',
  });
});

test('demo COMPANY fixtures retain COMPANY AccessProfiles', async () => {
  const calls = [];
  const prisma = {
    user: { upsert: async () => ({ id: 202 }) },
    accessProfile: { upsert: async (args) => { calls.push(args); } },
    userRole: { upsert: async () => {} },
  };

  await upsertDemoUser(prisma, {
    phone: '09911000001',
    passwordHash: 'hash',
    role: { id: 6 },
    companyId: 77,
  });

  assert.equal(calls.length, 1);
  assert.equal(calls[0].create.type, 'COMPANY');
  assert.equal(calls[0].create.companyId, 77);
});

test('every top-level marketplace category has five product references', () => {
  assert.equal(CATALOG.length, 15);
  assert.equal(new Set(CATALOG.map((family) => family.category)).size, 15);
  for (const family of CATALOG) {
    assert.equal(family.items.length, 5, family.category);
    for (const item of family.items) {
      assert.ok(item[0] && item[1] && item[2], family.category + ' product identity');
      assert.ok(item[7] > 0, family.category + ' indicative demo price');
    }
  }
});
