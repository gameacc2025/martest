const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const Module = require('node:module');

const calls = { audits: [], taskCreates: [], taskUpdates: [], activityCreates: [], noteCreates: [], staff: [] };
let task;
let nextTaskId;
let nextActivityId;
let nextNoteId;

function reset() {
  calls.audits = [];
  calls.taskCreates = [];
  calls.taskUpdates = [];
  calls.activityCreates = [];
  calls.noteCreates = [];
  calls.staff = [];
  nextTaskId = 60;
  nextActivityId = 70;
  nextNoteId = 80;
  task = { id: 61, leadId: 41, accountId: null, opportunityId: null, title: 'Old task', description: 'private task description', status: 'OPEN', priority: 'NORMAL', assigneeUserId: 7, createdByUserId: 7, dueAt: null, completedAt: null };
}

const prisma = {
  accessProfile: {
    findFirst: async (args) => {
      calls.staff.push(args);
      return [7, 8].includes(args.where.userId) ? { userId: args.where.userId } : null;
    },
  },
  cRMTask: {
    findUnique: async ({ where }) => Number(where.id) === task.id ? task : null,
    create: async ({ data }) => {
      calls.taskCreates.push(data);
      task = { id: ++nextTaskId, ...data, status: 'OPEN' };
      return task;
    },
    update: async ({ data }) => {
      calls.taskUpdates.push(data);
      task = { ...task, ...data };
      return task;
    },
  },
  cRMActivity: {
    create: async ({ data }) => {
      calls.activityCreates.push(data);
      return { id: ++nextActivityId, ...data };
    },
  },
  cRMNote: {
    create: async ({ data }) => {
      calls.noteCreates.push(data);
      return { id: ++nextNoteId, ...data };
    },
  },
  $transaction: async (callback) => callback(prisma),
};

function inject(relativePath, exportsObject) {
  const resolved = require.resolve(path.join(__dirname, relativePath));
  const original = require.cache[resolved];
  require.cache[resolved] = new Module(resolved);
  require.cache[resolved].exports = exportsObject;
  require.cache[resolved].loaded = true;
  test.after(() => {
    if (original) require.cache[resolved] = original;
    else delete require.cache[resolved];
  });
}

inject('../../config/db', prisma);
inject('../audit/audit.utils', {
  createError: (status, code, message) => Object.assign(new Error(message), { status, code }),
});
inject('../audit/audit.service', {
  recordAuditLogExplicit: async (entry) => { calls.audits.push(entry); },
});

const service = require('./crm.service');
reset();

test('createTask records actor and safe parent/assignment metadata without task text', async () => {
  reset();
  const created = await service.createTask({ title: 'Prepare quote', description: 'private commercial details', leadId: 41 }, 7);
  assert.equal(created.id, 61);
  assert.equal(calls.audits.length, 1);
  assert.equal(calls.audits[0].action, 'CRM_TASK_CREATED');
  assert.equal(calls.audits[0].actorUserId, 7);
  assert.equal(calls.audits[0].after.leadId, 41);
  assert.equal(JSON.stringify(calls.audits[0]).includes('private commercial details'), false);
  assert.equal(JSON.stringify(calls.audits[0]).includes('Prepare quote'), false);
});

test('updateTask records changed fields and safe status snapshots', async () => {
  reset();
  const updated = await service.updateTask(61, { title: 'New task title', status: 'IN_PROGRESS' }, 7);
  assert.equal(updated.status, 'IN_PROGRESS');
  assert.equal(calls.audits[0].action, 'CRM_TASK_UPDATED');
  assert.deepEqual(calls.audits[0].metadata.changedFields.sort(), ['completedAt', 'status', 'title']);
  assert.equal(JSON.stringify(calls.audits[0].before).includes('Old task'), false);
  assert.equal(JSON.stringify(calls.audits[0].before).includes('private task description'), false);
});

test('assignTask validates the STAFF assignee and records old/new assignment', async () => {
  reset();
  const updated = await service.assignTask(61, 8, 7);
  assert.equal(updated.assigneeUserId, 8);
  assert.equal(calls.audits[0].action, 'CRM_TASK_ASSIGNED');
  assert.equal(calls.audits[0].actorUserId, 7);
  assert.equal(calls.audits[0].before.assigneeUserId, 7);
  assert.equal(calls.audits[0].after.assigneeUserId, 8);
});

test('completeTask records the terminal status transition', async () => {
  reset();
  const updated = await service.completeTask(61, 7);
  assert.equal(updated.status, 'COMPLETED');
  assert.equal(calls.audits[0].action, 'CRM_TASK_COMPLETED');
  assert.equal(calls.audits[0].before.status, 'OPEN');
  assert.equal(calls.audits[0].after.status, 'COMPLETED');
});

test('createActivity records parent/type metadata without subject or body', async () => {
  reset();
  const created = await service.createActivity({ subject: 'Discuss pricing', body: 'private customer details', type: 'CALL', leadId: 41 }, 7);
  assert.equal(created.id, 71);
  assert.equal(calls.audits[0].action, 'CRM_ACTIVITY_CREATED');
  assert.equal(calls.audits[0].actorUserId, 7);
  assert.equal(calls.audits[0].after.leadId, 41);
  assert.equal(JSON.stringify(calls.audits[0]).includes('Discuss pricing'), false);
  assert.equal(JSON.stringify(calls.audits[0]).includes('private customer details'), false);
});

test('createNote records visibility and parent metadata without note body', async () => {
  reset();
  const created = await service.createNote({ body: 'confidential customer details', visibility: 'PRIVATE', accountId: 31 }, 7);
  assert.equal(created.id, 81);
  assert.equal(calls.audits[0].action, 'CRM_NOTE_CREATED');
  assert.equal(calls.audits[0].actorUserId, 7);
  assert.equal(calls.audits[0].after.accountId, 31);
  assert.equal(calls.audits[0].after.visibility, 'PRIVATE');
  assert.equal(JSON.stringify(calls.audits[0]).includes('confidential customer details'), false);
});
