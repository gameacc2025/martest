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

const calls = { staff: [], create: [], update: [], find: [] };
let activeStaff = true;
let currentLead;

function reset() {
  calls.staff = [];
  calls.create = [];
  calls.update = [];
  calls.find = [];
  activeStaff = true;
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
      return currentLead;
    },
    update: async (args) => {
      calls.update.push(args);
      currentLead = { ...currentLead, ...args.data };
      return currentLead;
    },
  },
};

injectMock('../../config/db', prisma);
injectMock('../audit/audit.utils', {
  createError: (status, code, message) => Object.assign(new Error(message), { status, code }),
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
  assert.equal(calls.create.length, 1);
  assert.equal(calls.create[0].data.ownerUserId, 7);
  assert.equal(calls.staff[0].where.type, 'STAFF');
  assert.equal(calls.staff[0].where.isActive, true);
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

test('changeLeadStatus permits a valid transition and rejects an invalid transition', async () => {
  reset();
  const result = await service.changeLeadStatus(41, 'CONTACTED');
  assert.equal(result.status, 'CONTACTED');
  assert.equal(calls.update.length, 1);
  assert.equal(calls.update[0].data.status, 'CONTACTED');

  reset();
  currentLead.status = 'QUALIFIED';
  await assert.rejects(
    () => service.changeLeadStatus(41, 'CONVERTED'),
    (error) => error.code === 'CRM_CONVERSION_REQUIRED' && error.status === 409,
  );
  assert.equal(calls.update.length, 0);
});
