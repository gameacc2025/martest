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
}

const calls = { staff: [], create: [], update: [], find: [], audit: [], moved: { activities: [], tasks: [], notes: [] } };
let activeStaff = true;
let currentLead;
let currentTargetLead;
let convertedAccount;
let nextAccountId = 900;

function reset() {
  calls.staff = [];
  calls.create = [];
  calls.update = [];
  calls.find = [];
  calls.audit = [];
  calls.moved = { activities: [], tasks: [], notes: [] };
  activeStaff = true;
  convertedAccount = null;
  nextAccountId = 900;
  currentTargetLead = {
    id: 42,
    status: 'CONTACTED',
    leadNumber: 'CRM-TEST-42',
    displayName: 'Target Lead',
    companyName: 'Target Co',
    email: null,
    phone: '+15551111111',
    score: 20,
    sourceId: null,
    ownerUserId: 7,
    convertedAccountId: null,
    convertedAt: null,
    disqualifiedReason: null,
    createdAt: new Date('2026-01-02T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    source: null,
    owner: { id: 7, email: 'staff@example.test' },
  };
  currentLead = {
    id: 41,
    status: 'NEW',
    leadNumber: 'CRM-TEST-41',
    displayName: 'Existing Lead',
    companyName: null,
    email: null,
    phone: null,
    score: 10,
    sourceId: null,
    ownerUserId: 7,
    convertedAccountId: null,
    convertedAt: null,
    disqualifiedReason: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    source: null,
    owner: { id: 7, email: 'staff@example.test' },
  };
}
reset();

const prisma = {
  accessProfile: {
    findFirst: async (args) => {
      calls.staff.push(args);
      return activeStaff ? { userId: args.where.userId } : null;
    },
  },
  lead: {
    create: async (args) => {
      calls.create.push(args);
      return {
        ...currentLead,
        ...args.data,
        id: 42,
        status: 'NEW',
        source: null,
        owner: { id: args.data.ownerUserId, email: 'staff@example.test' },
      };
    },
    findUnique: async (args) => {
      calls.find.push(args);
      return Number(args.where.id) === currentTargetLead.id ? currentTargetLead : currentLead;
    },
    update: async (args) => {
      calls.update.push(args);
      if (Number(args.where.id) === currentTargetLead.id) {
        currentTargetLead = { ...currentTargetLead, ...args.data };
        return currentTargetLead;
      }
      currentLead = { ...currentLead, ...args.data };
      return currentLead;
    },
    updateMany: async (args) => {
      calls.update.push(args);
      const statusCondition = args.where.status;
      const statusMatches = typeof statusCondition === 'string'
        ? currentLead.status === statusCondition
        : Array.isArray(statusCondition?.notIn) && !statusCondition.notIn.includes(currentLead.status);
      if (Number(args.where.id) !== currentLead.id || !statusMatches || (args.where.convertedAccountId === null && currentLead.convertedAccountId != null)) return { count: 0 };
      currentLead = { ...currentLead, ...args.data };
      return { count: 1 };
    },
  },
  leadStatusHistory: {
    create: async (args) => {
      calls.create.push(args);
      return { ...args.data, id: Date.now() };
    },
  },
  cRMFieldAudit: {
    createMany: async (args) => {
      calls.create.push(args);
      return { count: args.data.length };
    },
    create: async (args) => {
      calls.create.push(args);
      return { id: 1, ...args.data };
    },
  },
  cRMActivity: {
    updateMany: async (args) => { calls.moved.activities.push(args); return { count: 1 }; },
  },
  cRMTask: {
    updateMany: async (args) => { calls.moved.tasks.push(args); return { count: 1 }; },
  },
  cRMNote: {
    updateMany: async (args) => { calls.moved.notes.push(args); return { count: 1 }; },
  },
  cRMAccount: {
    findUnique: async ({ where }) => convertedAccount?.id === where.id ? convertedAccount : null,
    create: async ({ data }) => {
      convertedAccount = { id: ++nextAccountId, ...data, contacts: [{ id: 1, ...data.contacts.create }] };
      return convertedAccount;
    },
  },
  auditLog: {
    create: async (args) => {
      calls.audit.push(args);
      return { id: calls.audit.length, ...args.data };
    },
  },
  $transaction: async (fn) => fn(prisma),
};

injectMock('../../config/db', prisma);
injectMock('../audit/audit.utils', {
  createError: (status, code, message) => Object.assign(new Error(message), { status, code }),
});
injectMock('../audit/audit.service', {
  recordAuditLogExplicit: async (entry) => { calls.audit.push({ data: { action: entry.action, metadata: { before: entry.before, after: entry.after, extra: entry.metadata } } }); },
});
const service = require('./crm.service');

test('createLead normalizes contact fields and assigns the authenticated active STAFF owner', async () => {
  reset();
  const result = await service.createLead({
    displayName: '  Telecom Lead  ',
    companyName: '  Example Co ',
    email: ' SALES@EXAMPLE.TEST ',
    phone: ' 09120000000 ',
    score: 75,
  }, 7);

  assert.equal(result.id, 42);
  assert.equal(result.displayName, 'Telecom Lead');
  assert.equal(result.companyName, 'Example Co');
  assert.equal(result.email, 'sales@example.test');
  assert.equal(result.phone, '09120000000');
  assert.equal(result.score, 75);
  // createLead now creates 1 lead + multiple CRMFieldAudit entries
  // Filter to find the lead creation call
  const leadCreateCalls = calls.create.filter(c => c.data && c.data.ownerUserId !== undefined);
  assert.equal(leadCreateCalls.length, 1);
  assert.equal(leadCreateCalls[0].data.ownerUserId, 7);
  assert.equal(calls.staff[0].where.type, 'STAFF');
  assert.equal(calls.staff[0].where.isActive, true);
  // Verify CRMFieldAudit.createMany was called
  const auditCalls = calls.create.filter(c => c.data && Array.isArray(c.data));
  assert.ok(auditCalls.length > 0, 'CRMFieldAudit.createMany should have been called');
  assert.equal(calls.audit.length, 1);
  assert.equal(calls.audit[0].data.action, 'CRM_LEAD_CREATED');
});

test('createLead rejects invalid scores and inactive/non-STAFF owners', async () => {
  reset();
  await assert.rejects(
    () => service.createLead({ displayName: 'Lead', score: 101 }, 7),
    (error) => error.code === 'CRM_INVALID_SCORE' && error.status === 400,
  );
  assert.equal(calls.create.length, 0);

  reset();
  activeStaff = false;
  await assert.rejects(
    () => service.createLead({ displayName: 'Lead' }, 7),
    (error) => error.code === 'CRM_STAFF_REQUIRED' && error.status === 400,
  );
  assert.equal(calls.create.length, 0);
});

test('updateLead refuses terminal leads before issuing a database update', async () => {
  reset();
  currentLead.status = 'CONVERTED';
  await assert.rejects(
    () => service.updateLead(41, { displayName: 'Changed' }),
    (error) => error.code === 'CRM_LEAD_TERMINAL' && error.status === 409,
  );
  assert.equal(calls.update.length, 0);
});

test('updateLead creates CRMFieldAudit records for changed fields', async () => {
  reset();
  const result = await service.updateLead(41, { displayName: 'Updated Lead', score: 85 }, 7);
  assert.equal(result.displayName, 'Updated Lead');
  assert.equal(result.score, 85);
  assert.equal(calls.update.length, 1);
  // Check that CRMFieldAudit.createMany was called
  const auditCalls = calls.create.filter(c => c.data && Array.isArray(c.data));
  assert.ok(auditCalls.length > 0, 'CRMFieldAudit.createMany should have been called');
  const auditData = auditCalls[0].data;
  assert.ok(auditData.some(a => a.fieldName === 'displayName' && a.entityType === 'Lead'));
  assert.ok(auditData.some(a => a.fieldName === 'score' && a.entityType === 'Lead'));
  assert.equal(calls.audit.length, 1);
  assert.equal(calls.audit[0].data.action, 'CRM_LEAD_UPDATED');
  assert.deepEqual(calls.audit[0].data.metadata.extra.changedFields.sort(), ['displayName', 'score']);
});

test('updateLead does not create audit entries when no fields change', async () => {
  reset();
  // Update with same values
  await service.updateLead(41, { displayName: 'Existing Lead', score: 10 }, 7);
  const auditCalls = calls.create.filter(c => c.data && Array.isArray(c.data));
  // Filter out leadStatusHistory calls (which have single object data, not array)
  const fieldAuditCalls = auditCalls.filter(c => c.data.every?.(d => d.entityType === 'Lead'));
  assert.equal(fieldAuditCalls.length, 0, 'No field audit entries should be created when values are unchanged');
  assert.equal(calls.audit.length, 0, 'No global audit event should be created when values are unchanged');
});

test('assignLead records a central audit event with old and new owner IDs', async () => {
  reset();
  const result = await service.assignLead(41, 8, 7);
  assert.equal(result.ownerUserId, 8);
  assert.equal(calls.audit.length, 1);
  assert.equal(calls.audit[0].data.action, 'CRM_LEAD_ASSIGNED');
  assert.equal(calls.audit[0].data.metadata.before.ownerUserId, 7);
  assert.equal(calls.audit[0].data.metadata.after.ownerUserId, 8);
});

test('changeLeadStatus permits a valid transition and rejects an invalid transition', async () => {
  reset();
  const result = await service.changeLeadStatus(41, 'CONTACTED', null, 7);
  assert.equal(result.status, 'CONTACTED');
  assert.equal(calls.update.length, 1);
  assert.equal(calls.update[0].data.status, 'CONTACTED');
  assert.equal(calls.audit.length, 1);
  assert.equal(calls.audit[0].data.action, 'CRM_LEAD_STATUS_CHANGED');

  reset();
  currentLead.status = 'QUALIFIED';
  await assert.rejects(
    () => service.changeLeadStatus(41, 'CONVERTED', null, 7),
    (error) => error.code === 'CRM_CONVERSION_REQUIRED' && error.status === 409,
  );
  assert.equal(calls.update.length, 0);
});


test('convertLead creates one account/contact and replays idempotently after conversion', async () => {
  reset();
  currentLead.status = 'QUALIFIED';
  currentLead.companyName = 'Example Telecom';
  currentLead.email = 'buyer@example.test';
  currentLead.phone = '+15550000000';

  const first = await service.convertLead(41, 7);
  assert.equal(first.alreadyConverted, false);
  assert.equal(first.account.id, 901);
  assert.equal(first.account.displayName, 'Example Telecom');
  assert.equal(first.account.contacts.length, 1);
  assert.equal(first.account.contacts[0].email, 'buyer@example.test');
  assert.equal(currentLead.status, 'CONVERTED');
  assert.equal(currentLead.convertedAccountId, 901);
  assert.equal(calls.audit.length, 1);

  const second = await service.convertLead(41, 7);
  assert.equal(second.alreadyConverted, true);
  assert.equal(second.account.id, 901);
  assert.equal(nextAccountId, 901, 'replay must not create a second account');
});

test('convertLead rejects unqualified leads before creating an account', async () => {
  reset();
  await assert.rejects(
    () => service.convertLead(41, 7),
    (error) => error.code === 'CRM_LEAD_NOT_QUALIFIED' && error.status === 409,
  );
  assert.equal(convertedAccount, null);
});


test('mergeLeads moves child records, preserves target values, fills gaps and audits the merge', async () => {
  reset();
  currentLead.email = 'source@example.test';
  currentLead.phone = '+15552222222';
  currentLead.companyName = 'Source Co';
  currentLead.sourceId = 12;
  currentLead.score = 80;

  const result = await service.mergeLeads(41, 42, 'duplicate import record', 7);

  assert.equal(result.duplicateLeadId, 41);
  assert.equal(result.mergedLead.id, 42);
  assert.equal(result.movedRelations, true);
  assert.equal(currentLead.status, 'DUPLICATE');
  assert.match(currentLead.disqualifiedReason, /MERGED_INTO:42/);

  assert.equal(currentTargetLead.email, 'source@example.test');
  assert.equal(currentTargetLead.phone, '+15551111111', 'existing target phone must win');
  assert.equal(currentTargetLead.companyName, 'Target Co', 'existing target company name must win');
  assert.equal(currentTargetLead.sourceId, 12);
  assert.equal(currentTargetLead.score, 80);

  assert.equal(calls.moved.activities.length, 1);
  assert.equal(calls.moved.tasks.length, 1);
  assert.equal(calls.moved.notes.length, 1);
  for (const relation of Object.values(calls.moved)) {
    assert.deepEqual(relation[0].where, { leadId: 41 });
    assert.deepEqual(relation[0].data, { leadId: 42 });
  }

  const fieldAudits = calls.create.filter(entry => Array.isArray(entry.data)).flatMap(entry => entry.data);
  assert.deepEqual(fieldAudits.map(entry => entry.fieldName).sort(), ['email', 'score', 'sourceId']);
  assert.equal(calls.audit.length, 1);
  assert.equal(calls.audit[0].data.action, 'CRM_LEAD_MERGED');
  assert.equal(calls.audit[0].data.metadata.extra.sourceLeadId, 41);
  assert.equal(calls.audit[0].data.metadata.extra.targetLeadId, 42);
  assert.deepEqual(calls.audit[0].data.metadata.extra.changedFields.sort(), ['email', 'score', 'sourceId']);
  assert.equal(calls.audit[0].data.metadata.extra.reason, undefined, 'free-form merge reason must not enter central AuditLog metadata');
});

test('mergeLeads rejects self-merge and missing reasons before opening a transaction', async () => {
  reset();
  await assert.rejects(
    () => service.mergeLeads(41, 41, 'same record', 7),
    (error) => error.code === 'CRM_MERGE_SAME_LEAD' && error.status === 400,
  );
  await assert.rejects(
    () => service.mergeLeads(41, 42, '   ', 7),
    (error) => error.code === 'CRM_MERGE_REASON_REQUIRED' && error.status === 400,
  );
  assert.equal(calls.update.length, 0);
  assert.equal(calls.audit.length, 0);
});
