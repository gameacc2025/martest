const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const Module = require('node:module');

const resolvedDb = require.resolve('../../config/db');
const originalDb = require.cache[resolvedDb];
const calls = { findMany: [], count: [], findFirst: [], sla: [] };
const prisma = {
  supportTicket: {
    findMany: async (args) => { calls.findMany.push(args); return []; },
    count: async (args) => { calls.count.push(args); return 0; },
    findFirst: async (args) => { calls.findFirst.push(args); return { id: 1, status: 'OPEN' }; },
  },
  supportSlaPolicy: {
    findFirst: async (args) => {
      calls.sla.push(args);
      if (args.where.categoryId === null) return null;
      return { firstResponseMinutes: 120, resolutionMinutes: 1440 };
    },
  },
};
require.cache[resolvedDb] = new Module(resolvedDb);
require.cache[resolvedDb].exports = prisma;
require.cache[resolvedDb].loaded = true;
const service = require('./support.service');

test.after(() => {
  if (originalDb) require.cache[resolvedDb] = originalDb;
  else delete require.cache[resolvedDb];
});

function reset() {
  calls.findMany = [];
  calls.count = [];
  calls.findFirst = [];
  calls.sla = [];
}

test('customer ticket lists are scoped to the authenticated requester', async () => {
  reset();
  await service.listTickets({ id: '12', accessType: 'CUSTOMER' }, { page: '2', limit: '10' });
  assert.deepEqual(calls.findMany[0].where, { requesterUserId: 12 });
  assert.equal(calls.findMany[0].skip, 10);
  assert.equal(calls.findMany[0].take, 10);
});

test('company ticket lists are scoped to the active company, not individual user', async () => {
  reset();
  await service.listTickets({ id: '13', accessType: 'COMPANY', companyId: '44' }, {});
  assert.deepEqual(calls.findMany[0].where, { requesterCompanyId: 44 });
});

test('staff can list all tickets while customer/company cannot escape their scope', async () => {
  reset();
  await service.listTickets({ id: '1', accessType: 'STAFF' }, {});
  assert.deepEqual(calls.findMany[0].where, {});
  await assert.rejects(
    () => service.listTickets({ id: '13', accessType: 'COMPANY' }, {}),
    (error) => error.code === 'SUPPORT_COMPANY_CONTEXT_REQUIRED' && error.statusCode === 403,
  );
});

test('ticket detail queries retain requester scoping', async () => {
  reset();
  await service.getTicket({ id: '12', accessType: 'CUSTOMER' }, '5');
  assert.deepEqual(calls.findFirst[0].where, { id: 5, requesterUserId: 12 });
});

test('internal notes are denied before any ticket lookup for non-staff users', async () => {
  reset();
  await assert.rejects(
    () => service.addMessage({ id: '12', accessType: 'CUSTOMER', permissions: ['tickets.reply'] }, '5', { body: 'private', visibility: 'INTERNAL' }),
    (error) => error.code === 'SUPPORT_INTERNAL_MESSAGE_FORBIDDEN' && error.statusCode === 403,
  );
  assert.equal(calls.findFirst.length, 0);
});


test('uncategorized tickets fall back to an active SLA policy for the same priority', async () => {
  reset();
  const startedAt = Date.now();
  const deadlines = await service.getSla(prisma, null, 'NORMAL');

  assert.equal(calls.sla.length, 2);
  assert.deepEqual(calls.sla[0].where, { categoryId: null, priority: 'NORMAL', isActive: true });
  assert.deepEqual(calls.sla[1].where, { priority: 'NORMAL', isActive: true });
  assert.ok(Math.abs(deadlines.firstResponseDueAt.getTime() - (startedAt + 120 * 60_000)) < 1000);
  assert.ok(Math.abs(deadlines.resolveDueAt.getTime() - (startedAt + 1440 * 60_000)) < 1000);
});

test('category-specific SLA policy takes precedence over the generic priority fallback', async () => {
  reset();
  const deadlines = await service.getSla(prisma, 7, 'NORMAL');

  assert.equal(calls.sla.length, 1);
  assert.deepEqual(calls.sla[0].where, { categoryId: 7, priority: 'NORMAL', isActive: true });
  assert.ok(deadlines.firstResponseDueAt instanceof Date);
});
