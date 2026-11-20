const test = require('node:test');
const assert = require('node:assert/strict');

const dbPath = require.resolve('../../config/db');
const servicePath = require.resolve('./faq.service');
const auditPath = require.resolve('../audit/audit.service');
const previousDb = require.cache[dbPath];
const previousService = require.cache[servicePath];
const previousAudit = require.cache[auditPath];

const auditCalls = [];
const calls = { findUnique: [], create: [], update: [], delete: [], transactions: [] };
const existingFaq = {
  id: 7,
  question: 'Old question',
  answer: 'Old answer',
  category: 'General',
  sortOrder: 1,
  isActive: true,
};
let auditError = null;

const mockPrisma = {
  faq: {
    findUnique: async (args) => {
      calls.findUnique.push(args);
      return { ...existingFaq };
    },
    create: async (args) => {
      calls.create.push(args);
      return { id: 19, ...args.data };
    },
    update: async (args) => {
      calls.update.push(args);
      return { ...existingFaq, ...args.data };
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
  id: auditPath,
  filename: auditPath,
  loaded: true,
  exports: {
    recordAuditLogExplicit: async (entry) => {
      auditCalls.push(entry);
      if (auditError) throw auditError;
      return { id: auditCalls.length };
    },
  },
};
delete require.cache[servicePath];
const faqService = require('./faq.service');

test.after(() => {
  delete require.cache[servicePath];
  if (previousService) require.cache[servicePath] = previousService;
  if (previousDb) require.cache[dbPath] = previousDb;
  else delete require.cache[dbPath];
  if (previousAudit) require.cache[auditPath] = previousAudit;
  else delete require.cache[auditPath];
});

test('createFaq writes the FAQ and actor audit event in one transaction', async () => {
  calls.transactions.length = 0;
  calls.create.length = 0;
  auditCalls.length = 0;

  const faq = await faqService.createFaq({
    question: '  New question  ',
    answer: '  New answer  ',
  }, 31);

  assert.equal(faq.id, 19);
  assert.equal(calls.transactions.length, 1);
  assert.equal(calls.create[0].data.question, 'New question');
  assert.equal(auditCalls.length, 1);
  assert.equal(auditCalls[0].action, 'CMS_FAQ_CREATED');
  assert.equal(auditCalls[0].entityType, 'Faq');
  assert.equal(auditCalls[0].entityId, 19);
  assert.equal(auditCalls[0].actorUserId, 31);
  assert.equal(auditCalls[0].actorAccessType, 'STAFF');
  assert.equal(auditCalls[0].tx, mockPrisma);
  assert.equal(auditCalls[0].after.question, 'New question');
});

test('updateFaq records before and after snapshots and changed fields transactionally', async () => {
  calls.transactions.length = 0;
  calls.findUnique.length = 0;
  calls.update.length = 0;
  auditCalls.length = 0;

  const faq = await faqService.updateFaq(7, { question: 'Updated question' }, 42);

  assert.equal(faq.question, 'Updated question');
  assert.equal(calls.transactions.length, 1);
  assert.equal(calls.findUnique[0].where.id, 7);
  assert.equal(auditCalls.length, 1);
  assert.equal(auditCalls[0].action, 'CMS_FAQ_UPDATED');
  assert.equal(auditCalls[0].actorUserId, 42);
  assert.equal(auditCalls[0].tx, mockPrisma);
  assert.equal(auditCalls[0].before.question, 'Old question');
  assert.equal(auditCalls[0].after.question, 'Updated question');
  assert.deepEqual(auditCalls[0].metadata.changedFields, ['question']);
});

test('deleteFaq records the pre-delete snapshot in the same transaction', async () => {
  calls.transactions.length = 0;
  calls.delete.length = 0;
  auditCalls.length = 0;

  const result = await faqService.deleteFaq(7, 55);

  assert.deepEqual(result, { success: true });
  assert.equal(calls.transactions.length, 1);
  assert.equal(calls.delete[0].where.id, 7);
  assert.equal(auditCalls[0].action, 'CMS_FAQ_DELETED');
  assert.equal(auditCalls[0].actorUserId, 55);
  assert.equal(auditCalls[0].tx, mockPrisma);
  assert.equal(auditCalls[0].before.question, 'Old question');
});

test('createFaq propagates audit failure so the database transaction can roll back', async () => {
  calls.transactions.length = 0;
  calls.create.length = 0;
  auditCalls.length = 0;
  auditError = new Error('audit storage unavailable');

  try {
    await assert.rejects(
      () => faqService.createFaq({ question: 'Question', answer: 'Answer' }, 31),
      /audit storage unavailable/,
    );
    assert.equal(calls.transactions.length, 1);
    assert.equal(calls.create.length, 1);
    assert.equal(auditCalls.length, 1);
  } finally {
    auditError = null;
  }
});
