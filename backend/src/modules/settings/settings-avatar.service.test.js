const test = require('node:test');
const assert = require('node:assert/strict');
const dbPath = require.resolve('../../config/db');
const passwordPath = require.resolve('../../utils/password');
const servicePath = require.resolve('./settings.service');
const auditPath = require.resolve('../audit/audit.service');
const previousDb = require.cache[dbPath], previousPassword = require.cache[passwordPath], previousService = require.cache[servicePath], previousAudit = require.cache[auditPath];
const auditCalls = [];
const calls = { profileFind: [], profileUpdate: [], transactions: [] };
const mockPrisma = {
 profile: {
  findUnique: async a => { calls.profileFind.push(a); return { avatar: '/uploads/avatars/old.png' }; },
  update: async a => { calls.profileUpdate.push(a); return { avatar: null }; },
 },
 $transaction: async cb => { calls.transactions.push(true); return cb(mockPrisma); },
};
require.cache[dbPath] = { id: dbPath, filename: dbPath, loaded: true, exports: mockPrisma };
require.cache[passwordPath] = { id: passwordPath, filename: passwordPath, loaded: true, exports: { verifyPassword: async () => true, hashPassword: async () => 'hash' } };
require.cache[auditPath] = { id: auditPath, filename: auditPath, loaded: true, exports: { recordAuditLogExplicit: async e => { auditCalls.push(e); return {}; } } };
delete require.cache[servicePath];
const service = require('./settings.service');
test.after(() => {
 delete require.cache[servicePath];
 if (previousService) require.cache[servicePath] = previousService;
 if (previousDb) require.cache[dbPath] = previousDb; else delete require.cache[dbPath];
 if (previousPassword) require.cache[passwordPath] = previousPassword; else delete require.cache[passwordPath];
 if (previousAudit) require.cache[auditPath] = previousAudit; else delete require.cache[auditPath];
});
test('avatar deletion is transactional and records old/new avatar references', async () => {
 calls.transactions.length = 0; auditCalls.length = 0;
 await service.deleteAvatar(9, { id: 9, accessType: 'STAFF' });
 assert.equal(calls.transactions.length, 1);
 assert.equal(calls.profileUpdate[0].data.avatar, null);
 assert.equal(auditCalls[0].action, 'USER_AVATAR_DELETED');
 assert.equal(auditCalls[0].actorAccessType, 'STAFF');
 assert.equal(auditCalls[0].before.avatar, '/uploads/avatars/old.png');
 assert.equal(auditCalls[0].after.avatar, null);
});
