const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const Module = require('node:module');

const serviceDir = __dirname;
const calls = [];
let rows = [];
let nextId = 10;

function matches(row, where = {}) {
  return Object.entries(where).every(([key, value]) => row[key] === value);
}
function reset() {
  calls.length = 0;
  rows = [
    { id: 1, userId: 7, label: 'خانه', recipientName: 'کاربر', recipientPhone: '09120000000', province: 'تهران', city: 'تهران', addressLine: 'خیابان نمونه، پلاک ۱', postalCode: null, isDefault: true, createdAt: new Date('2026-01-01'), updatedAt: new Date('2026-01-01') },
    { id: 2, userId: 7, label: 'کار', recipientName: 'کاربر', recipientPhone: '09120000000', province: 'تهران', city: 'تهران', addressLine: 'خیابان کار، پلاک ۲', postalCode: null, isDefault: false, createdAt: new Date('2026-01-02'), updatedAt: new Date('2026-01-02') },
    { id: 3, userId: 8, label: 'شخصی', recipientName: 'شخص دیگر', recipientPhone: '09121111111', province: 'البرز', city: 'کرج', addressLine: 'خیابان دیگر، پلاک ۳', postalCode: null, isDefault: true, createdAt: new Date('2026-01-03'), updatedAt: new Date('2026-01-03') },
  ];
  nextId = 10;
}
function applySelect(row, select) {
  if (!select) return { ...row };
  return Object.fromEntries(Object.keys(select).filter((key) => select[key]).map((key) => [key, row[key]]));
}
const tx = {
  address: {
    findMany: async ({ where = {}, orderBy, select } = {}) => {
      calls.push(['findMany', where, orderBy]);
      let result = rows.filter((row) => matches(row, where));
      if (orderBy) {
        const sorts = Array.isArray(orderBy) ? orderBy : [orderBy];
        result = [...result].sort((a, b) => {
          for (const sort of sorts) {
            const [field, direction] = Object.entries(sort)[0];
            if (a[field] === b[field]) continue;
            const comparison = a[field] > b[field] ? 1 : -1;
            return direction === 'desc' ? -comparison : comparison;
          }
          return 0;
        });
      }
      return result.map((row) => applySelect(row, select));
    },
    findFirst: async ({ where = {}, orderBy } = {}) => {
      calls.push(['findFirst', where]);
      let result = rows.filter((row) => matches(row, where));
      if (orderBy) {
        const [field, direction] = Object.entries(orderBy)[0];
        result = result.sort((a, b) => direction === 'desc' ? b[field] - a[field] : a[field] - b[field]);
      }
      return result[0] ? { ...result[0] } : null;
    },
    count: async ({ where = {} } = {}) => rows.filter((row) => matches(row, where)).length,
    create: async ({ data, select }) => {
      const row = { id: nextId++, ...data, createdAt: new Date(), updatedAt: new Date() };
      rows.push(row);
      return applySelect(row, select);
    },
    updateMany: async ({ where = {}, data }) => {
      let count = 0;
      rows = rows.map((row) => {
        if (!matches(row, where)) return row;
        count++;
        return { ...row, ...data, updatedAt: new Date() };
      });
      return { count };
    },
    update: async ({ where, data, select }) => {
      const index = rows.findIndex((row) => matches(row, where));
      if (index < 0) throw new Error('not found');
      rows[index] = { ...rows[index], ...data, updatedAt: new Date() };
      return applySelect(rows[index], select);
    },
    delete: async ({ where }) => {
      const index = rows.findIndex((row) => matches(row, where));
      if (index < 0) throw new Error('not found');
      const [deleted] = rows.splice(index, 1);
      return deleted;
    },
  },
};
const mockPrisma = { ...tx, $transaction: async (callback) => callback(tx) };
const dbPath = require.resolve(path.join(serviceDir, '../../config/db'));
const originalDb = require.cache[dbPath];
require.cache[dbPath] = new Module(dbPath);
require.cache[dbPath].exports = mockPrisma;
require.cache[dbPath].loaded = true;
test.after(() => {
  if (originalDb) require.cache[dbPath] = originalDb;
  else delete require.cache[dbPath];
});

const service = require('./address.service');
test.beforeEach(reset);

test('listAddresses scopes every result to the authenticated user', async () => {
  const result = await service.listAddresses(7);
  assert.deepEqual(result.map((row) => row.id), [1, 2]);
  assert.ok(calls.some(([name, where]) => name === 'findMany' && where.userId === 7));
});

test('first address becomes default even when caller does not request it', async () => {
  rows = rows.filter((row) => row.userId !== 7);
  const result = await service.createAddress(7, {
    recipientName: 'نرگس', recipientPhone: '09123333333', province: 'فارس',
    city: 'شیراز', addressLine: 'خیابان بهار، پلاک ۴', isDefault: false,
  });
  assert.equal(result.isDefault, true);
  assert.equal(rows.filter((row) => row.userId === 7 && row.isDefault).length, 1);
});

test('setting a default address never changes another user’s default', async () => {
  await service.setDefaultAddress(7, 2);
  assert.equal(rows.find((row) => row.id === 1).isDefault, false);
  assert.equal(rows.find((row) => row.id === 2).isDefault, true);
  assert.equal(rows.find((row) => row.id === 3).isDefault, true);
});

test('unchecking the current default promotes another owned address', async () => {
  await service.updateAddress(7, 1, { isDefault: false });
  assert.equal(rows.find((row) => row.id === 1).isDefault, false);
  assert.equal(rows.find((row) => row.id === 2).isDefault, true);
  assert.equal(rows.find((row) => row.id === 3).isDefault, true);
});

test('the only address cannot be left without a default', async () => {
  rows = rows.filter((row) => row.userId !== 7 || row.id === 1);
  const result = await service.updateAddress(7, 1, { isDefault: false });
  assert.equal(result.isDefault, true);
  assert.equal(rows.filter((row) => row.userId === 7 && row.isDefault).length, 1);
});

test('address IDs belonging to another user are indistinguishable from missing IDs', async () => {
  await assert.rejects(() => service.getAddress(7, 3), (error) => {
    assert.equal(error.statusCode, 404);
    assert.equal(error.code, 'ADDRESS_NOT_FOUND');
    return true;
  });
  await assert.rejects(() => service.updateAddress(7, 3, { city: 'تبریز' }), (error) => error.code === 'ADDRESS_NOT_FOUND');
  await assert.rejects(() => service.deleteAddress(7, 3), (error) => error.code === 'ADDRESS_NOT_FOUND');
});

test('deleting the default promotes the most recently created remaining address', async () => {
  await service.deleteAddress(7, 1);
  assert.equal(rows.find((row) => row.id === 2).isDefault, true);
  assert.equal(rows.find((row) => row.id === 3).isDefault, true);
});
