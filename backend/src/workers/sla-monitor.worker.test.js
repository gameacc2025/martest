const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const Module = require('node:module');

const workerDir = __dirname;
const calls = { assignments: [], events: [], notifications: [] };

const prisma = {
  supportEvent: {
    findFirst: async (args) => {
      calls.events.push(args);
      return null;
    },
    create: async (args) => ({ id: calls.events.length + 1, ...args.data }),
  },
  supportAssignment: {
    findMany: async (args) => {
      calls.assignments.push(args);
      return [
        { assignedUserId: 20 },
        { assignedUserId: 20 },
        { assignedUserId: 30 },
        { assignedUserId: null },
      ];
    },
  },
  supportTicket: {
    findMany: async () => [],
  },
  $disconnect: async () => {},
};

function injectMock(relativePath, exportsObj) {
  const resolved = require.resolve(path.join(workerDir, relativePath));
  const original = require.cache[resolved];
  require.cache[resolved] = new Module(resolved);
  require.cache[resolved].exports = exportsObj;
  require.cache[resolved].loaded = true;
  test.after(() => {
    if (original) require.cache[resolved] = original;
    else delete require.cache[resolved];
  });
}

injectMock('../config/db', prisma);
injectMock('../modules/notifications/notification.dispatch.service', {
  dispatchNotification: async (...args) => {
    calls.notifications.push(args);
    return {};
  },
});
injectMock('../modules/support/support.service', {
  getSlaDetails: async () => null,
});

const worker = require('./sla-monitor.worker');

function reset() {
  calls.assignments.length = 0;
  calls.events.length = 0;
  calls.notifications.length = 0;
}

const ticket = {
  id: 51,
  ticketNumber: 'SUP-51',
  subject: 'SLA recipient test',
  status: 'OPEN',
  priority: 'HIGH',
  assignedUserId: 10,
  assignedQueueId: 5,
};

test('worker exports runOnce without starting a second background loop on import', async () => {
  assert.equal(typeof worker.runOnce, 'function');
  assert.deepEqual(await worker.runOnce(), { escalated: 0, warned: 0, breached: 0 });
});

test('SLA escalation notifies the assignee and only active assignees in the same queue', async () => {
  reset();
  await worker.escalateTicket(prisma, ticket, 'FIRST_RESPONSE_BREACHED', {});

  assert.deepEqual(calls.assignments[0].where, {
    queueId: 5,
    endedAt: null,
    assignedUserId: { not: null },
  });
  assert.deepEqual(calls.notifications[0][1], [10, 20, 30]);
  assert.equal(calls.notifications[0][0], 'SUPPORT_SLA_ESCALATED');
});

test('SLA warning uses the same queue-scoped recipient set', async () => {
  reset();
  await worker.warnTicketStakeholders(prisma, ticket, 'FIRST_RESPONSE_AT_RISK', {});

  assert.deepEqual(calls.assignments[0].where, {
    queueId: 5,
    endedAt: null,
    assignedUserId: { not: null },
  });
  assert.deepEqual(calls.notifications[0][1], [10, 20, 30]);
  assert.equal(calls.notifications[0][0], 'SUPPORT_SLA_WARNING');
});
