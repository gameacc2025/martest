const test = require('node:test');
const assert = require('node:assert/strict');
const dbPath = require.resolve('../../config/db');
const servicePath = require.resolve('./preview.service');
const auditPath = require.resolve('../audit/audit.service');
const previousDb = require.cache[dbPath], previousService = require.cache[servicePath], previousAudit = require.cache[auditPath];
const auditCalls = [];
const calls = { create: [], findUnique: [], updateMany: [], deleteMany: [], transactions: [] };
const record = { id: 8, articleId: 3, userId: 17, expiresAt: new Date(Date.now()+60000), consumedAt: null, article: { id: 3, title: 'Draft' } };
const mockPrisma = {
 cmsPreviewToken: {
  create: async a => { calls.create.push(a); return { id: 8, articleId: a.data.articleId, userId: a.data.userId, expiresAt: a.data.expiresAt }; },
  findUnique: async a => { calls.findUnique.push(a); return { ...record }; },
  updateMany: async a => { calls.updateMany.push(a); return { count: 1 }; },
  deleteMany: async a => { calls.deleteMany.push(a); return { count: 0 }; },
 },
 $transaction: async cb => { calls.transactions.push(true); return cb(mockPrisma); },
};
require.cache[dbPath] = { id: dbPath, filename: dbPath, loaded: true, exports: mockPrisma };
require.cache[auditPath] = { id: auditPath, filename: auditPath, loaded: true, exports: { recordAuditLogExplicit: async e => { auditCalls.push(e); return {}; } } };
delete require.cache[servicePath];
const service = require('./preview.service');
test.after(() => {
 delete require.cache[servicePath];
 if (previousService) require.cache[servicePath] = previousService;
 if (previousDb) require.cache[dbPath] = previousDb; else delete require.cache[dbPath];
 if (previousAudit) require.cache[auditPath] = previousAudit; else delete require.cache[auditPath];
});
test('preview token creation audits metadata without storing the secret token', async () => {
 calls.transactions.length = 0; auditCalls.length = 0;
 const result = await service.generatePreviewToken(3, 17);
 assert.equal(result.token.length, 64);
 assert.equal(calls.transactions.length, 1);
 assert.equal(auditCalls[0].action, 'CMS_PREVIEW_TOKEN_CREATED');
 assert.equal(auditCalls[0].actorUserId, 17);
 assert.equal(auditCalls[0].metadata.articleId, 3);
 assert.equal(JSON.stringify(auditCalls[0]).includes(result.token), false);
});
test('preview token consumption is conditional and audited in one transaction', async () => {
 calls.transactions.length = 0; calls.updateMany.length = 0; auditCalls.length = 0;
 const article = await service.validatePreviewToken('a'.repeat(64));
 assert.deepEqual(article, { id: 3, title: 'Draft' });
 assert.equal(calls.transactions.length, 1);
 assert.equal(calls.updateMany[0].where.consumedAt, null);
 assert.equal(calls.updateMany[0].where.expiresAt.gt instanceof Date, true);
 assert.equal(auditCalls[0].action, 'CMS_PREVIEW_TOKEN_CONSUMED');
 assert.equal(auditCalls[0].actorUserId, 17);
});
test('preview token is rejected if another request already consumed it', async () => {
 mockPrisma.cmsPreviewToken.updateMany = async () => ({ count: 0 });
 auditCalls.length = 0;
 assert.equal(await service.validatePreviewToken('b'.repeat(64)), null);
 assert.equal(auditCalls.length, 0);
});
