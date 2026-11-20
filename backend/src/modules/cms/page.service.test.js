const test = require('node:test');
const assert = require('node:assert/strict');

const dbPath = require.resolve('../../config/db');
const servicePath = require.resolve('./page.service');
const auditPath = require.resolve('../audit/audit.service');
const previousDb = require.cache[dbPath];
const previousService = require.cache[servicePath];
const previousAudit = require.cache[auditPath];

const auditCalls = [];
const calls = { findUnique: [], create: [], update: [], delete: [], transactions: [] };
const existingPage = {
  id: 7, slug: 'about', title: 'Old title', content: '<p>Old</p>',
  contentFormat: 'HTML', metaTitle: null, metaDescription: null,
  canonicalUrl: null, isIndexable: true, isActive: true,
};
let auditError = null;

const mockPrisma = {
  page: {
    findUnique: async (args) => {
      calls.findUnique.push(args);
      return { ...existingPage };
    },
    create: async (args) => {
      calls.create.push(args);
      return { ...existingPage, id: 19, ...args.data };
    },
    update: async (args) => {
      calls.update.push(args);
      return { ...existingPage, ...args.data };
    },
    delete: async (args) => {
      calls.delete.push(args);
      return { id: args.where.id };
    },
  },
  $transaction: async (callback) => {
    calls.transactions.push(true);
    return callback(mockPrisma);
  },
};

require.cache[dbPath] = { id: dbPath, filename: dbPath, loaded: true, exports: mockPrisma };
require.cache[auditPath] = {
  id: auditPath, filename: auditPath, loaded: true,
  exports: {
    recordAuditLogExplicit: async (entry) => {
      auditCalls.push(entry);
      if (auditError) throw auditError;
      return { id: auditCalls.length };
    },
  },
};
delete require.cache[servicePath];
const pageService = require('./page.service');

test.after(() => {
  delete require.cache[servicePath];
  if (previousService) require.cache[servicePath] = previousService;
  if (previousDb) require.cache[dbPath] = previousDb;
  else delete require.cache[dbPath];
  if (previousAudit) require.cache[auditPath] = previousAudit;
  else delete require.cache[auditPath];
});

test('createPage writes page and actor audit event in one transaction', async () => {
  calls.transactions.length = 0;
  calls.create.length = 0;
  auditCalls.length = 0;
  const page = await pageService.createPage({ slug: 'about', title: ' About ', content: '<p>About</p>' }, 31);
  assert.equal(page.id, 19);
  assert.equal(calls.transactions.length, 1);
  assert.equal(calls.create[0].data.title, 'About');
  assert.equal(auditCalls.length, 1);
  assert.equal(auditCalls[0].action, 'CMS_PAGE_CREATED');
  assert.equal(auditCalls[0].entityType, 'Page');
  assert.equal(auditCalls[0].entityId, 19);
  assert.equal(auditCalls[0].actorUserId, 31);
  assert.equal(auditCalls[0].actorAccessType, 'STAFF');
  assert.equal(auditCalls[0].tx, mockPrisma);
});

test('updatePage records before/after snapshots and changed fields transactionally', async () => {
  calls.transactions.length = 0;
  calls.findUnique.length = 0;
  calls.update.length = 0;
  auditCalls.length = 0;
  const page = await pageService.updatePage(7, { title: 'New title' }, 42);
  assert.equal(page.title, 'New title');
  assert.equal(calls.transactions.length, 1);
  assert.equal(auditCalls[0].action, 'CMS_PAGE_UPDATED');
  assert.equal(auditCalls[0].actorUserId, 42);
  assert.equal(auditCalls[0].before.title, 'Old title');
  assert.equal(auditCalls[0].after.title, 'New title');
  assert.deepEqual(auditCalls[0].metadata.changedFields, ['title']);
});

test('deletePage records pre-delete snapshot in the same transaction', async () => {
  calls.transactions.length = 0;
  calls.delete.length = 0;
  auditCalls.length = 0;
  assert.deepEqual(await pageService.deletePage(7, 55), { success: true });
  assert.equal(calls.transactions.length, 1);
  assert.equal(calls.delete[0].where.id, 7);
  assert.equal(auditCalls[0].action, 'CMS_PAGE_DELETED');
  assert.equal(auditCalls[0].actorUserId, 55);
  assert.equal(auditCalls[0].before.title, 'Old title');
});

test('page mutation propagates audit failure so transaction can roll back', async () => {
  calls.transactions.length = 0;
  calls.create.length = 0;
  auditCalls.length = 0;
  auditError = new Error('audit storage unavailable');
  try {
    await assert.rejects(
      () => pageService.createPage({ slug: 'contact', title: 'Contact', content: 'Contact' }, 31),
      /audit storage unavailable/,
    );
    assert.equal(calls.transactions.length, 1);
    assert.equal(calls.create.length, 1);
    assert.equal(auditCalls.length, 1);
  } finally {
    auditError = null;
  }
});
