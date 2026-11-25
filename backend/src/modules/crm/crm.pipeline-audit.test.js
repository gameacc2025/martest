const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const Module = require('node:module');

const calls = { audits: [], staff: [], opportunityUpdates: [], pipelineUpdates: [] };
let activeStaff = true;
let nextId = 100;
let pipeline;
let stage;
let source;

function reset() {
  calls.audits = [];
  calls.staff = [];
  calls.opportunityUpdates = [];
  calls.pipelineUpdates = [];
  activeStaff = true;
  nextId = 100;
  pipeline = { id: 3, name: 'Main', isDefault: false, isActive: true };
  stage = { id: 10, pipelineId: 3, code: 'NEW', label: 'New', sortOrder: 1, probability: 10, isWon: false, isLost: false };
  source = { id: 5, code: 'WEB', label: 'Website', isActive: true, sortOrder: 1 };
}

const prisma = {
  accessProfile: {
    findFirst: async (args) => {
      calls.staff.push(args);
      return activeStaff ? { userId: args.where.userId } : null;
    },
  },
  leadSource: {
    create: async ({ data }) => ({ id: ++nextId, ...data }),
    findUnique: async ({ where }) => where.id === source.id ? { ...source } : null,
    update: async ({ data }) => { source = { ...source, ...data }; return { ...source }; },
  },
  pipeline: {
    create: async ({ data }) => { pipeline = { id: ++nextId, ...data }; return { ...pipeline }; },
    findUnique: async ({ where }) => where.id === pipeline.id ? { ...pipeline } : null,
    updateMany: async ({ data }) => { calls.pipelineUpdates.push(data); return { count: 1 }; },
    update: async ({ data }) => { pipeline = { ...pipeline, ...data }; return { ...pipeline }; },
  },
  pipelineStage: {
    findFirst: async ({ where }) => where.id === stage.id && where.pipelineId === stage.pipelineId ? { ...stage } : null,
    create: async ({ data }) => { stage = { id: ++nextId, ...data }; return { ...stage }; },
    update: async ({ data }) => { stage = { ...stage, ...data }; return { ...stage }; },
  },
  opportunity: {
    updateMany: async () => { calls.opportunityUpdates.push(true); return { count: 4 }; },
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

test('manageSource create and update require STAFF actor and emit safe audit events', async () => {
  reset();
  const created = await service.manageSource({ code: 'web', label: 'Website' }, undefined, 7);
  assert.equal(created.code, 'WEB');
  assert.equal(calls.audits[0].action, 'CRM_SOURCE_CREATED');

  calls.audits = [];
  const updated = await service.manageSource({ isActive: false }, 5, 7);
  assert.equal(updated.isActive, false);
  assert.equal(calls.audits[0].action, 'CRM_SOURCE_UPDATED');
  assert.equal(calls.audits[0].actorUserId, 7);
});

test('createPipeline records the authenticated actor and new pipeline metadata', async () => {
  reset();
  const created = await service.createPipeline({ name: 'Enterprise', isDefault: true }, 7);
  assert.equal(created.name, 'Enterprise');
  assert.equal(calls.audits[0].action, 'CRM_PIPELINE_CREATED');
  assert.equal(calls.audits[0].actorUserId, 7);
});

test('createPipelineStage records parent and outcome flags', async () => {
  reset();
  const created = await service.createPipelineStage(3, { code: 'QUALIFIED', label: 'Qualified', probability: 50 }, 7);
  assert.equal(created.code, 'QUALIFIED');
  assert.equal(calls.audits[0].action, 'CRM_PIPELINE_STAGE_CREATED');
  assert.equal(calls.audits[0].after.pipelineId, 3);
});

test('updatePipeline audits configuration changes and default pipeline switch', async () => {
  reset();
  const updated = await service.updatePipeline(3, { isDefault: true, name: 'Primary' }, 7);
  assert.equal(updated.isDefault, true);
  assert.equal(calls.pipelineUpdates.length, 1);
  assert.equal(calls.audits[0].action, 'CRM_PIPELINE_UPDATED');
  assert.deepEqual(calls.audits[0].metadata.changedFields.sort(), ['isDefault', 'name']);
});

test('updatePipelineStage audits the stage change and number of affected opportunities', async () => {
  reset();
  const updated = await service.updatePipelineStage(3, 10, { isWon: true }, 7);
  assert.equal(updated.isWon, true);
  assert.equal(calls.opportunityUpdates.length, 1);
  assert.equal(calls.audits[0].action, 'CRM_PIPELINE_STAGE_UPDATED');
  assert.equal(calls.audits[0].metadata.affectedOpportunityCount, 4);
});

test('pipeline/source mutations reject non-STAFF actors before writes', async () => {
  reset();
  activeStaff = false;
  await assert.rejects(
    () => service.createPipeline({ name: 'Denied' }, 99),
    (error) => error.code === 'CRM_STAFF_REQUIRED',
  );
  assert.equal(calls.audits.length, 0);
});
