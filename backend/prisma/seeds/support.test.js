const test = require('node:test');
const assert = require('node:assert/strict');
const { seedSupport, SLA } = require('./support');

function createPrismaMock() {
  let nextCategoryId = 1;
  let nextQueueId = 1;
  let nextPolicyId = 1;
  const globalPolicies = new Map();
  const categories = new Map();
  const queues = new Map();
  const calls = {
    categoryPolicyUpserts: [],
    globalFinds: [],
    globalCreates: [],
    globalUpdates: [],
  };

  return {
    calls,
    globalPolicies,
    supportCategory: {
      upsert: async ({ where, create, update }) => {
        const existing = categories.get(where.key);
        const row = existing
          ? { ...existing, ...update }
          : { id: nextCategoryId++, ...create };
        categories.set(where.key, row);
        return row;
      },
    },
    supportQueue: {
      upsert: async ({ where, create, update }) => {
        const existing = queues.get(where.key);
        const row = existing
          ? { ...existing, ...update }
          : { id: nextQueueId++, ...create };
        queues.set(where.key, row);
        return row;
      },
    },
    supportSlaPolicy: {
      upsert: async (args) => {
        calls.categoryPolicyUpserts.push(args);
        assert.notEqual(args.where.categoryId_priority.categoryId, null);
        return { id: nextPolicyId++, ...args.create, ...args.update };
      },
      findFirst: async ({ where }) => {
        calls.globalFinds.push(where);
        return globalPolicies.get(where.priority) || null;
      },
      create: async ({ data }) => {
        const row = { id: nextPolicyId++, ...data };
        calls.globalCreates.push(data);
        globalPolicies.set(data.priority, row);
        return row;
      },
      update: async ({ where, data }) => {
        calls.globalUpdates.push({ where, data });
        const existing = [...globalPolicies.values()].find((row) => row.id === where.id);
        const updated = { ...existing, ...data };
        globalPolicies.set(updated.priority, updated);
        return updated;
      },
    },
  };
}

test('seedSupport creates global SLA policies without nullable composite upsert and is idempotent', async () => {
  const prisma = createPrismaMock();

  const first = await seedSupport(prisma);
  assert.equal(first.categories, 5);
  assert.equal(first.queues, 3);
  assert.equal(first.policies, 24);
  assert.equal(prisma.calls.globalCreates.length, Object.keys(SLA).length);
  assert.equal(prisma.calls.globalUpdates.length, 0);
  assert.equal(prisma.calls.categoryPolicyUpserts.length, 20);

  const second = await seedSupport(prisma);
  assert.equal(second.policies, 24);
  assert.equal(prisma.globalPolicies.size, Object.keys(SLA).length);
  assert.equal(prisma.calls.globalCreates.length, Object.keys(SLA).length);
  assert.equal(prisma.calls.globalUpdates.length, Object.keys(SLA).length);
  assert.equal(prisma.calls.categoryPolicyUpserts.length, 40);
  assert.ok(prisma.calls.globalFinds.every((where) => where.categoryId === null));
});
