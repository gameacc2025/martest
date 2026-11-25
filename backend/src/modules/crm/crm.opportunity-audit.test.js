const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const Module = require('node:module');

const calls = { audits: [], histories: [], updates: [], creates: [], staff: [] };
let activeStaff = true;
let opportunity;
let nextId = 50;

function reset() {
  calls.audits = [];
  calls.histories = [];
  calls.updates = [];
  calls.creates = [];
  calls.staff = [];
  activeStaff = true;
  nextId = 50;
  opportunity = {
    id: 42, accountId: 8, pipelineId: 3, stageId: 10, ownerUserId: 7,
    title: 'Renewal', amount: '1200', currency: 'IRR', status: 'OPEN',
    expectedCloseAt: null, closedAt: null,
  };
}

const prisma = {
  accessProfile: {
    findFirst: async (args) => {
      calls.staff.push(args);
      return activeStaff ? { userId: args.where.userId } : null;
    },
  },
  cRMAccount: {
    findUnique: async () => ({ id: 8 }),
  },
  pipelineStage: {
    findFirst: async ({ where }) => ({
      id: where.id, pipelineId: where.pipelineId, isWon: where.id === 12, isLost: false,
    }),
  },
  opportunity: {
    create: async ({ data }) => {
      const row = { id: ++nextId, ...data };
      calls.creates.push(data);
      opportunity = row;
      return row;
    },
    findUnique: async ({ where }) => Number(where.id) === opportunity.id ? { ...opportunity } : null,
    update: async ({ data }) => {
      calls.updates.push(data);
      opportunity = { ...opportunity, ...data };
      return { ...opportunity };
    },
  },
  opportunityStageHistory: {
    create: async ({ data }) => {
      calls.histories.push(data);
      return { id: calls.histories.length, ...data };
    },
  },
  $transaction: async (callback) => callback(prisma),
};

const serviceDir = __dirname;
function inject(relativePath, exportsObject) {
  const resolved = require.resolve(path.join(serviceDir, relativePath));
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

test('createOpportunity records the authenticated STAFF actor and safe opportunity metadata', async () => {
  reset();
  const created = await service.createOpportunity({
    accountId: 8, pipelineId: 3, stageId: 10, title: 'Renewal',
    amount: 1200, currency: 'IRR',
  }, 7);

  assert.equal(created.id, 51);
  assert.equal(calls.audits.length, 1);
  assert.equal(calls.audits[0].action, 'CRM_OPPORTUNITY_CREATED');
  assert.equal(calls.audits[0].actorUserId, 7);
  assert.equal(calls.audits[0].after.accountId, 8);
  assert.equal(calls.histories.length, 1);
});

test('changeOpportunityStage records before/after stage and status in the same transaction', async () => {
  reset();
  const updated = await service.changeOpportunityStage(42, { stageId: 12, reason: 'Won' }, 7);

  assert.equal(updated.status, 'WON');
  assert.equal(calls.histories.length, 1);
  assert.equal(calls.audits.length, 1);
  assert.equal(calls.audits[0].action, 'CRM_OPPORTUNITY_STAGE_CHANGED');
  assert.deepEqual(calls.audits[0].before, { stageId: 10, status: 'OPEN' });
  assert.deepEqual(calls.audits[0].after, { stageId: 12, status: 'WON' });
});

test('updateOpportunity records changed field names without copying title or amount into audit metadata', async () => {
  reset();
  const updated = await service.updateOpportunity(42, { title: 'New confidential title', amount: 2400, ownerUserId: 8 }, 7);

  assert.equal(updated.title, 'New confidential title');
  assert.equal(updated.ownerUserId, 8);
  assert.equal(calls.audits.length, 1);
  assert.equal(calls.audits[0].action, 'CRM_OPPORTUNITY_UPDATED');
  assert.deepEqual(calls.audits[0].metadata.changedFields.sort(), ['amount', 'ownerUserId', 'title']);
  assert.equal(JSON.stringify(calls.audits[0]).includes('New confidential title'), false);
  assert.equal(JSON.stringify(calls.audits[0]).includes('2400'), false);
});

test('updateOpportunity rejects a non-STAFF actor before changing the opportunity', async () => {
  reset();
  activeStaff = false;
  await assert.rejects(
    () => service.updateOpportunity(42, { title: 'No access' }, 99),
    (error) => error.code === 'CRM_STAFF_REQUIRED' && error.status === 400,
  );
  assert.equal(calls.updates.length, 0);
  assert.equal(calls.audits.length, 0);
});
