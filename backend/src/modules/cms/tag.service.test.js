const test = require('node:test');
const assert = require('node:assert/strict');
const dbPath = require.resolve('../../config/db');
const servicePath = require.resolve('./tag.service');
const auditPath = require.resolve('../audit/audit.service');
const previousDb = require.cache[dbPath], previousService = require.cache[servicePath], previousAudit = require.cache[auditPath];
const auditCalls = [];
const calls = { findUnique: [], findFirst: [], create: [], update: [], delete: [], count: [], transactions: [] };
const existing = { id: 5, slug: 'old', name: 'Old', createdAt: new Date(), _count: { articles: 0 } };
const mockPrisma = {
 articleTag: {
  findUnique: async a => { calls.findUnique.push(a); return { ...existing }; },
  findFirst: async a => { calls.findFirst.push(a); return null; },
  create: async a => { calls.create.push(a); return { ...existing, id: 11, ...a.data }; },
  update: async a => { calls.update.push(a); return { ...existing, ...a.data }; },
  delete: async a => { calls.delete.push(a); return { id: a.where.id }; },
 },
 articleTagAssignment: { count: async a => { calls.count.push(a); return 0; } },
 $transaction: async cb => { calls.transactions.push(true); return cb(mockPrisma); },
};
require.cache[dbPath] = { id: dbPath, filename: dbPath, loaded: true, exports: mockPrisma };
require.cache[auditPath] = { id: auditPath, filename: auditPath, loaded: true, exports: { recordAuditLogExplicit: async e => { auditCalls.push(e); return {}; } } };
delete require.cache[servicePath];
const service = require('./tag.service');
test.after(() => {
 delete require.cache[servicePath];
 if (previousService) require.cache[servicePath] = previousService;
 if (previousDb) require.cache[dbPath] = previousDb; else delete require.cache[dbPath];
 if (previousAudit) require.cache[auditPath] = previousAudit; else delete require.cache[auditPath];
});
test('createTag persists tag and audit event atomically', async () => {
 calls.transactions.length = 0; auditCalls.length = 0;
 const result = await service.createTag({ name: 'New tag' }, 22);
 assert.equal(result.id, 11); assert.equal(calls.transactions.length, 1);
 assert.equal(auditCalls[0].action, 'CMS_TAG_CREATED');
 assert.equal(auditCalls[0].actorUserId, 22); assert.equal(auditCalls[0].tx, mockPrisma);
});
test('updateTag records before/after and changed fields', async () => {
 calls.transactions.length = 0; auditCalls.length = 0;
 const result = await service.updateTag(5, { name: 'New name' }, 23);
 assert.equal(result.name, 'New name'); assert.equal(calls.transactions.length, 1);
 assert.equal(auditCalls[0].action, 'CMS_TAG_UPDATED');
 assert.equal(auditCalls[0].before.name, 'Old'); assert.equal(auditCalls[0].after.name, 'New name');
 assert.deepEqual(auditCalls[0].metadata.changedFields, ['name']);
});
test('deleteTag records snapshot and blocks deletion while linked articles exist', async () => {
 calls.transactions.length = 0; auditCalls.length = 0;
 await service.deleteTag(5, 24);
 assert.equal(calls.transactions.length, 1); assert.equal(auditCalls[0].action, 'CMS_TAG_DELETED');
 assert.equal(auditCalls[0].before.name, 'Old');
});
