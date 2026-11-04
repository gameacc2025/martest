// مسیر فایل: backend/src/modules/admin/admin.service.test.js
// =============================================================
// Unit tests — Admin service (getStats)
//
// Run with:  node --test
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

const calls = {
  userCount: [],
  productCount: [],
  userFindMany: [],
  productFindMany: [],
  systemSettingFindUnique: [],
  systemSettingUpsert: [],
};
let fx;
function resetMocks() {
  Object.keys(calls).forEach((k) => (calls[k] = []));
  fx = {
    totalUsers: 0,
    activeUsers: 0,
    totalCompanies: 0,
    totalProducts: 0,
    pendingProducts: 0,
    totalInquiries: 0,
    totalRoles: 0,
    totalPermissions: 0,
    recentUsers: [],
    pendingProductsList: [],
    systemSetting: null, // null → getSettings falls back to the default threshold
  };
}
resetMocks();

const mockPrisma = {
  user: {
    count: async (args) => {
      calls.userCount.push(args);
      // First call (no args) = total, second call (status: ACTIVE) = active
      return calls.userCount.length === 1 ? fx.totalUsers : fx.activeUsers;
    },
    findMany: async (args) => {
      calls.userFindMany.push(args);
      return fx.recentUsers;
    },
  },
  company: { count: async () => fx.totalCompanies },
  product: {
    count: async (args) => {
      calls.productCount.push(args);
      // First call (no args) = total, second (PENDING_REVIEW) = pending
      return calls.productCount.length === 1 ? fx.totalProducts : fx.pendingProducts;
    },
    findMany: async (args) => {
      calls.productFindMany.push(args);
      return fx.pendingProductsList;
    },
  },
  inquiry: { count: async () => fx.totalInquiries },
  role: { count: async () => fx.totalRoles },
  permission: { count: async () => fx.totalPermissions },
  systemSetting: {
    findUnique: async (args) => {
      calls.systemSettingFindUnique.push(args);
      return fx.systemSetting; // null → default threshold
    },
    upsert: async (args) => {
      calls.systemSettingUpsert.push(args);
      return {};
    },
  },
};

injectMock('../../config/db', mockPrisma);

const { getStats, getSettings, updateReviewEditThreshold } = require('./admin.service');

test('getStats: assembles all counts into the counts object with correct key names', async () => {
  resetMocks();
  fx.totalUsers = 100;
  fx.activeUsers = 80;
  fx.totalCompanies = 15;
  fx.totalProducts = 300;
  fx.pendingProducts = 12;
  fx.totalInquiries = 50;
  fx.totalRoles = 6;
  fx.totalPermissions = 40;

  const result = await getStats();

  assert.deepEqual(result.counts, {
    users: 100,
    activeUsers: 80,
    companies: 15,
    products: 300,
    pendingProducts: 12,
    orders: 50, // NOTE: totalInquiries is exposed under the `orders` key
    roles: 6,
    permissions: 40,
  });
});

test('getStats: recentUsers is capped at 5, ordered by createdAt desc', async () => {
  resetMocks();
  fx.recentUsers = [{ id: 1 }];

  await getStats();

  assert.equal(calls.userFindMany[0].take, 5);
  assert.deepEqual(calls.userFindMany[0].orderBy, { createdAt: 'desc' });
});

test('getStats: pendingProducts list is filtered to PENDING_REVIEW, capped at 20', async () => {
  resetMocks();
  fx.pendingProductsList = [{ id: 1, status: 'PENDING_REVIEW' }];

  const result = await getStats();

  assert.deepEqual(calls.productFindMany[0].where, { status: 'PENDING_REVIEW' });
  assert.equal(calls.productFindMany[0].take, 20);
  assert.deepEqual(result.pendingProducts, fx.pendingProductsList);
});

test('getStats: returns an empty-but-well-formed shape when there is no data yet', async () => {
  resetMocks();

  const result = await getStats();

  assert.deepEqual(result.counts, {
    users: 0,
    activeUsers: 0,
    companies: 0,
    products: 0,
    pendingProducts: 0,
    orders: 0,
    roles: 0,
    permissions: 0,
  });
  assert.deepEqual(result.recentUsers, []);
  assert.deepEqual(result.pendingProducts, []);
});

test('getSettings: falls back to the default review threshold when no setting exists', async () => {
  resetMocks();
  fx.systemSetting = null;
  const result = await getSettings();
  assert.deepEqual(result, { productReviewEditThreshold: 5 });
});

test('getSettings: reads the configured threshold', async () => {
  resetMocks();
  fx.systemSetting = { value: '7' };
  const result = await getSettings();
  assert.deepEqual(result, { productReviewEditThreshold: 7 });
});

test('updateReviewEditThreshold: persists the value and returns the updated settings', async () => {
  resetMocks();
  fx.systemSetting = { value: '3' };
  const result = await updateReviewEditThreshold(3, 9);
  const upsert = calls.systemSettingUpsert[0];
  assert.equal(upsert.where.key, 'catalog.productReviewEditThreshold');
  assert.equal(upsert.create.value, '3');
  assert.equal(upsert.create.updatedByUserId, 9);
  assert.deepEqual(result, { productReviewEditThreshold: 3 });
});

test('updateReviewEditThreshold: rejects a non-positive value', async () => {
  resetMocks();
  await assert.rejects(
    () => updateReviewEditThreshold(0, 9),
    (err) => err.statusCode === 400 && err.code === 'INVALID_REVIEW_THRESHOLD'
  );
  await assert.rejects(
    () => updateReviewEditThreshold(2.5, 9),
    (err) => err.statusCode === 400 && err.code === 'INVALID_REVIEW_THRESHOLD'
  );
  assert.equal(calls.systemSettingUpsert.length, 0);
});