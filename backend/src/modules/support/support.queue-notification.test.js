const test = require('node:test');
const assert = require('node:assert/strict');
const Module = require('node:module');

const dbPath = require.resolve('../../config/db');
const notificationPath = require.resolve('../notifications/notification.dispatch.service');
const auditPath = require.resolve('../audit/audit.service');
const previousDb = require.cache[dbPath];
const previousNotification = require.cache[notificationPath];
const previousAudit = require.cache[auditPath];

const auditCalls = [];
const calls = { assignmentQueries: [], userQueries: [], notifications: [] };
const ticket = {
  id: 51,
  status: 'OPEN',
  requesterUserId: 12,
  requesterCompanyId: null,
  assignedUserId: 20,
  assignedQueueId: 7,
};
const assignments = [
  { queueId: 7, assignedUserId: 31, endedAt: null },
  { queueId: 7, assignedUserId: 32, endedAt: null },
  { queueId: 7, assignedUserId: 44, endedAt: new Date('2026-11-17T10:00:00Z') },
  { queueId: 8, assignedUserId: 55, endedAt: null },
];
const activeStaff = [
  { id: 31, status: 'ACTIVE', accessProfile: { type: 'STAFF', isActive: true } },
  { id: 32, status: 'ACTIVE', accessProfile: { type: 'STAFF', isActive: true } },
  { id: 44, status: 'ACTIVE', accessProfile: { type: 'STAFF', isActive: true } },
  { id: 55, status: 'ACTIVE', accessProfile: { type: 'STAFF', isActive: true } },
];

const prisma = {
  supportTicket: {
    findFirst: async () => ({ ...ticket }),
    findUnique: async () => ({ ...ticket }),
    update: async ({ data }) => Object.assign(ticket, data),
  },
  supportMessage: {
    create: async ({ data }) => ({ id: 100, ...data }),
  },
  supportStatusHistory: {
    create: async ({ data }) => data,
  },
  supportEvent: {
    create: async ({ data }) => data,
  },
  supportAssignment: {
    findMany: async (args) => {
      calls.assignmentQueries.push(args);
      return assignments.filter((assignment) =>
        assignment.queueId === args.where.queueId &&
        assignment.endedAt === null &&
        assignment.assignedUserId != null,
      );
    },
  },
  user: {
    findMany: async (args) => {
      calls.userQueries.push(args);
      const ids = args.where.id.in;
      return activeStaff.filter((member) =>
        ids.includes(member.id) &&
        member.status === 'ACTIVE' &&
        member.accessProfile.type === 'STAFF' &&
        member.accessProfile.isActive === true,
      );
    },
  },
  $transaction: async (callback) => callback(prisma),
};

require.cache[dbPath] = new Module(dbPath);
require.cache[dbPath].exports = prisma;
require.cache[dbPath].loaded = true;
require.cache[notificationPath] = new Module(notificationPath);
require.cache[notificationPath].exports = {
  dispatchNotification: async (...args) => {
    calls.notifications.push(args);
    return { queued: args[1].length };
  },
};
require.cache[notificationPath].loaded = true;
require.cache[auditPath] = new Module(auditPath);
require.cache[auditPath].exports = {
  recordAuditLogExplicit: async (entry) => { auditCalls.push(entry); return { id: auditCalls.length }; },
};
require.cache[auditPath].loaded = true;

const service = require('./support.service');
const staff = { id: 99, accessType: 'STAFF', permissions: ['tickets.read', 'tickets.reply', 'tickets.update'] };

test.after(() => {
  if (previousDb) require.cache[dbPath] = previousDb;
  else delete require.cache[dbPath];
  if (previousNotification) require.cache[notificationPath] = previousNotification;
  else delete require.cache[notificationPath];
  if (previousAudit) require.cache[auditPath] = previousAudit;
  else delete require.cache[auditPath];
});

function resetCalls() {
  calls.assignmentQueries.length = 0;
  calls.userQueries.length = 0;
  calls.notifications.length = 0;
  auditCalls.length = 0;
  ticket.status = 'OPEN';
}

test('public ticket message notifies requester, assignee and only active staff assigned to that queue', async () => {
  resetCalls();

  await service.addMessage(staff, 51, { body: 'A public update' });

  assert.equal(calls.notifications.length, 1);
  assert.equal(calls.notifications[0][0], 'SUPPORT_MESSAGE_RECEIVED');
  assert.equal(auditCalls.length, 1);
  assert.equal(auditCalls[0].action, 'SUPPORT_MESSAGE_CREATED');
  assert.equal(auditCalls[0].entityType, 'SupportTicket');
  assert.equal(auditCalls[0].entityId, 51);
  assert.equal(auditCalls[0].actorUserId, staff.id);
  assert.equal(auditCalls[0].tx, prisma);
  assert.deepEqual(auditCalls[0].metadata, { messageId: 100, visibility: 'PUBLIC', reopened: false });
  assert.deepEqual(calls.notifications[0][1], [12, 20, 31, 32]);
  assert.deepEqual(calls.assignmentQueries[0].where, {
    queueId: 7,
    endedAt: null,
    assignedUserId: { not: null },
  });
  assert.deepEqual(calls.userQueries[0].where, {
    id: { in: [31, 32] },
    accessProfile: { type: 'STAFF', isActive: true },
    status: 'ACTIVE',
  });
});

test('ticket status notifications use the same active queue-assignment scope', async () => {
  resetCalls();

  await service.changeStatus(staff, 51, 'RESOLVED', 'Resolved after review');

  assert.equal(calls.notifications.length, 1);
  assert.equal(calls.notifications[0][0], 'SUPPORT_TICKET_STATUS_CHANGED');
  assert.equal(auditCalls.length, 1);
  assert.equal(auditCalls[0].action, 'SUPPORT_TICKET_STATUS_CHANGED');
  assert.equal(auditCalls[0].entityId, 51);
  assert.equal(auditCalls[0].tx, prisma);
  assert.deepEqual(auditCalls[0].metadata, { previousStatus: 'OPEN', nextStatus: 'RESOLVED' });
  assert.deepEqual(calls.notifications[0][1], [12, 20, 31, 32]);
  assert.deepEqual(calls.assignmentQueries[0].where, {
    queueId: 7,
    endedAt: null,
    assignedUserId: { not: null },
  });
  assert.deepEqual(calls.userQueries[0].where.id, { in: [31, 32] });
});
