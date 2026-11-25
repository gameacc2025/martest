const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const Module = require('node:module');

const calls = { audits: [], accountCreates: [], accountUpdates: [], contactCreates: [], contactUpdates: [], staff: [] };
let account;
let contact;
let nextAccountId;
let nextContactId;

function reset() {
  calls.audits = [];
  calls.accountCreates = [];
  calls.accountUpdates = [];
  calls.contactCreates = [];
  calls.contactUpdates = [];
  calls.staff = [];
  nextAccountId = 30;
  nextContactId = 50;
  account = { id: 31, displayName: 'Old Account', accountType: 'PROSPECT', lifecycle: 'ACTIVE', source: 'referral', notes: 'private account note', ownerUserId: 7, contacts: [] };
  contact = { id: 51, accountId: 31, name: 'Old Contact', title: 'Buyer', email: 'private@example.test', phone: '+15550000000', notes: 'private contact note', isPrimary: false };
}

const prisma = {
  accessProfile: {
    findFirst: async (args) => {
      calls.staff.push(args);
      return [7, 8].includes(args.where.userId) ? { userId: args.where.userId } : null;
    },
  },
  cRMAccount: {
    findUnique: async ({ where }) => Number(where.id) === account.id ? account : null,
    create: async ({ data }) => {
      calls.accountCreates.push(data);
      account = { id: ++nextAccountId, ...data, contacts: [] };
      return account;
    },
    update: async ({ data }) => {
      calls.accountUpdates.push(data);
      account = { ...account, ...data };
      return account;
    },
  },
  cRMContact: {
    findUnique: async ({ where }) => Number(where.id) === contact.id ? contact : null,
    create: async ({ data }) => {
      calls.contactCreates.push(data);
      contact = { id: ++nextContactId, ...data };
      return contact;
    },
    update: async ({ data }) => {
      calls.contactUpdates.push(data);
      contact = { ...contact, ...data };
      return contact;
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

test('createAccount writes an actor-attributed AuditLog in the same transaction without copying notes', async () => {
  reset();
  const created = await service.createAccount({ displayName: 'New Account', notes: 'private note' }, 7);
  assert.equal(created.id, 31);
  assert.equal(calls.audits.length, 1);
  assert.equal(calls.audits[0].action, 'CRM_ACCOUNT_CREATED');
  assert.equal(calls.audits[0].actorUserId, 7);
  assert.equal(calls.audits[0].entityId, 31);
  assert.equal(calls.audits[0].after.ownerUserId, 7);
  assert.equal(JSON.stringify(calls.audits[0]).includes('private note'), false);
});

test('updateAccount audits changed field names and safe snapshots without account notes', async () => {
  reset();
  const updated = await service.updateAccount(31, { displayName: 'New Account', notes: 'updated private note' }, 7);
  assert.equal(updated.displayName, 'New Account');
  assert.equal(calls.audits.length, 1);
  assert.equal(calls.audits[0].action, 'CRM_ACCOUNT_UPDATED');
  assert.equal(calls.audits[0].actorUserId, 7);
  assert.deepEqual(calls.audits[0].metadata.changedFields.sort(), ['displayName', 'notes']);
  assert.equal(JSON.stringify(calls.audits[0]).includes('private account note'), false);
  assert.equal(JSON.stringify(calls.audits[0]).includes('updated private note'), false);
});

test('createContact records account linkage and primary status but never copies contact PII', async () => {
  reset();
  const created = await service.createContact(31, { name: 'Private Person', email: 'private@example.test', phone: '+15550000000', notes: 'private note', isPrimary: true }, 7);
  assert.equal(created.accountId, 31);
  assert.equal(calls.audits.length, 1);
  assert.equal(calls.audits[0].action, 'CRM_CONTACT_CREATED');
  assert.equal(calls.audits[0].actorUserId, 7);
  assert.equal(calls.audits[0].entityId, 51);
  assert.equal(calls.audits[0].after.accountId, 31);
  assert.equal(calls.audits[0].after.isPrimary, true);
  assert.equal(JSON.stringify(calls.audits[0]).includes('private@example.test'), false);
  assert.equal(JSON.stringify(calls.audits[0]).includes('+15550000000'), false);
  assert.equal(JSON.stringify(calls.audits[0]).includes('Private Person'), false);
});

test('updateContact audits changed fields while excluding names, email, phone and notes from snapshots', async () => {
  reset();
  const updated = await service.updateContact(51, { name: 'New Person', email: 'new@example.test', isPrimary: true }, 7);
  assert.equal(updated.name, 'New Person');
  assert.equal(calls.audits.length, 1);
  assert.equal(calls.audits[0].action, 'CRM_CONTACT_UPDATED');
  assert.equal(calls.audits[0].actorUserId, 7);
  assert.deepEqual(calls.audits[0].metadata.changedFields.sort(), ['email', 'isPrimary', 'name']);
  assert.equal(JSON.stringify(calls.audits[0]).includes('Old Contact'), false);
  assert.equal(JSON.stringify(calls.audits[0]).includes('private@example.test'), false);
  assert.equal(JSON.stringify(calls.audits[0]).includes('new@example.test'), false);
  assert.equal(JSON.stringify(calls.audits[0]).includes('+15550000000'), false);
  assert.equal(JSON.stringify(calls.audits[0]).includes('private contact note'), false);
});
