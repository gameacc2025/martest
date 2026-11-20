const test = require('node:test');
const assert = require('node:assert/strict');
const dbPath = require.resolve('../../config/db');
const passwordPath = require.resolve('../../utils/password');
const servicePath = require.resolve('./settings.service');
const auditPath = require.resolve('../audit/audit.service');
const previousDb = require.cache[dbPath], previousPassword = require.cache[passwordPath], previousService = require.cache[servicePath], previousAudit = require.cache[auditPath];
const auditCalls = [];
const calls = { upsert: [], profileFind: [], userFind: [], userUpdate: [], tokenDelete: [], transactions: [] };
const profile = { firstName: 'Old', lastName: 'Name', avatar: null };
const mockPrisma = {
 profile: {
  findUnique: async () => ({ ...profile }),
  upsert: async a => { calls.upsert.push(a); return { ...profile, ...a.create, ...a.update }; },
 },
 user: {
  findUnique: async () => ({ passwordHash: 'old-hash' }),
  update: async a => { calls.userUpdate.push(a); return { id: a.where.id }; },
 },
 refreshToken: { deleteMany: async a => { calls.tokenDelete.push(a); return { count: 2 }; } },
 $transaction: async cb => { calls.transactions.push(true); return cb(mockPrisma); },
};
require.cache[dbPath] = { id: dbPath, filename: dbPath, loaded: true, exports: mockPrisma };
require.cache[passwordPath] = { id: passwordPath, filename: passwordPath, loaded: true, exports: { verifyPassword: async () => true, hashPassword: async () => 'new-hash' } };
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
test('profile update and audit snapshots are committed together', async () => {
 calls.transactions.length = 0; auditCalls.length = 0;
 await service.updateProfile(9, { firstName: 'New' }, { id: 9, accessType: 'STAFF' });
 assert.equal(calls.transactions.length, 1);
 assert.equal(auditCalls[0].action, 'USER_PROFILE_UPDATED');
 assert.equal(auditCalls[0].actorUserId, 9);
 assert.equal(auditCalls[0].actorAccessType, 'STAFF');
 assert.equal(auditCalls[0].before.firstName, 'Old');
 assert.equal(auditCalls[0].after.firstName, 'New');
 assert.deepEqual(auditCalls[0].metadata.changedFields, ['firstName']);
});
test('password change revokes refresh tokens and audits without exposing credentials', async () => {
 calls.transactions.length = 0; auditCalls.length = 0;
 await service.changePassword(9, 'current', 'new-password', { id: 9, accessType: 'CUSTOMER' });
 assert.equal(calls.transactions.length, 1);
 assert.equal(calls.userUpdate[0].data.passwordHash, 'new-hash');
 assert.equal(calls.tokenDelete[0].where.userId, 9);
 assert.equal(auditCalls[0].action, 'USER_PASSWORD_CHANGED');
 assert.equal(auditCalls[0].metadata.refreshTokensRevoked, 2);
 assert.equal(JSON.stringify(auditCalls[0]).includes('new-password'), false);
 assert.equal(JSON.stringify(auditCalls[0]).includes('new-hash'), false);
});
