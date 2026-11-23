// Unit tests for the app-context boundary used by PKCE handoff.
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const Module = require('node:module');

const serviceDir = __dirname;
const crypto = require('node:crypto');
const calls = { codeCreate: [], codeFindUnique: [], codeDeleteMany: [], audit: [], refreshCreate: [] };
let codeRecord = null;
let userFixture = { id: 7, email: 'u@example.com', status: 'ACTIVE', accessProfile: { type: 'STAFF', companyId: null } };
let accessFixture = { type: 'STAFF', isActive: true, companyId: null };
let contextFixture = { user: userFixture, accessProfile: accessFixture, roles: ['ADMIN'], permissions: ['*'] };

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

const mockPrisma = {
  user: { findUnique: async () => userFixture },
  accessProfile: { findUnique: async () => accessFixture },
  handoffCode: {
    deleteMany: async () => ({ count: 0 }),
    create: async (args) => { calls.codeCreate.push(args); return { id: 31, ...args.data }; },
    findUnique: async (args) => { calls.codeFindUnique.push(args); return codeRecord; },
    delete: async () => ({ id: 31 }),
    deleteMany: async (args) => { calls.codeDeleteMany.push(args); return { count: 1 }; },
  },
  refreshToken: { create: async (args) => { calls.refreshCreate.push(args); return { id: 1 }; } },
  auditLog: { create: async (args) => { calls.audit.push(args); return { id: calls.audit.length }; } },
  $transaction: async (callback) => callback(mockPrisma),
};
injectMock('../../config/db', mockPrisma);
injectMock('../../utils/rbac', { loadUserAccess: async () => ({ roles: [], permissions: [] }) });
injectMock('../../config/env', { jwtAccessExpiresIn: '15m' });
const authServiceMock = {
  buildUserContext: async () => contextFixture,
  issueTokens: async (fastify, data, options) => {
    calls.issueTokens = { data, options };
    await options.tx.refreshToken.create({ data: { userId: data.userId } });
    return { accessToken: 'access-token', refreshToken: 'refresh-token' };
  },
  expiryToSeconds: () => 900,
};
injectMock('./auth.service', authServiceMock);
injectMock('../audit/audit.service', {
  recordAuditLogExplicit: async ({ tx, ...entry }) => {
    const db = tx || mockPrisma;
    const data = { ...entry, metadata: entry.metadata ? { extra: entry.metadata } : null };
    await db.auditLog.create({ data });
  },
});
injectMock('../audit/audit.events', {
  AUDIT_ACTIONS: {
    AUTH_HANDOFF_CODE_CREATED: 'AUTH_HANDOFF_CODE_CREATED',
    AUTH_HANDOFF_CODE_CONSUMED: 'AUTH_HANDOFF_CODE_CONSUMED',
    AUTH_HANDOFF_SESSION_ISSUED: 'AUTH_HANDOFF_SESSION_ISSUED',
    AUTH_HANDOFF_FAILED: 'AUTH_HANDOFF_FAILED',
  },
});

const handoffService = require('./handoff.service');
const { assertPanelAccess } = handoffService;

test('handoff: matching STAFF context can enter Admin', () => {
  assert.doesNotThrow(() => assertPanelAccess('admin', { type: 'STAFF', isActive: true }));
});

test('handoff: SUPER_ADMIN role cannot cross from STAFF context into Company', () => {
  assert.throws(
    () => assertPanelAccess('company', { type: 'STAFF', isActive: true }),
    (err) => err.statusCode === 403 && err.code === 'APP_ACCESS_DENIED',
  );
});

test('handoff: missing access profile is denied', () => {
  assert.throws(
    () => assertPanelAccess('admin', null),
    (err) => err.statusCode === 403 && err.code === 'APP_ACCESS_DENIED',
  );
});

test('handoff: inactive matching access profile is denied', () => {
  assert.throws(
    () => assertPanelAccess('admin', { type: 'STAFF', isActive: false }),
    (err) => err.statusCode === 403 && err.code === 'ACCESS_DISABLED',
  );
});


test('handoff: code creation persists and audits atomically', async () => {
  calls.codeCreate.length = 0;
  calls.audit.length = 0;
  const result = await handoffService.createHandoffCode(7, 'admin', 'pkce-challenge');
  assert.equal(result.expiresIn, 60);
  assert.equal(calls.codeCreate.length, 1);
  assert.equal(calls.audit.at(-1).data.action, 'AUTH_HANDOFF_CODE_CREATED');
  assert.equal(calls.audit.at(-1).data.actorUserId, 7);
  assert.deepEqual(calls.audit.at(-1).data.metadata.extra, { app: 'admin', expiresIn: 60 });
});

test('handoff: redemption consumes a code and audits session issuance in transactions', async () => {
  const code = 'one-time-code';
  const challenge = crypto.createHash('sha256').update('verifier').digest('base64url');
  const codeHash = crypto.createHash('sha256').update(code).digest('base64url');
  codeRecord = { id: 31, codeHash, userId: 7, app: 'admin', challenge, expiresAt: new Date(Date.now() + 60_000) };
  calls.audit.length = 0;
  calls.codeDeleteMany.length = 0;
  calls.refreshCreate.length = 0;

  const result = await handoffService.redeemHandoffCode({}, { app: 'admin', code, verifier: 'verifier' });

  assert.equal(result.accessToken, 'access-token');
  assert.equal(result.refreshToken, 'refresh-token');
  assert.equal(calls.codeDeleteMany.length, 1);
  assert.equal(calls.audit[0].data.action, 'AUTH_HANDOFF_CODE_CONSUMED');
  assert.equal(calls.audit[0].data.actorAccessType, 'STAFF');
  assert.equal(calls.audit.at(-1).data.action, 'AUTH_HANDOFF_SESSION_ISSUED');
  assert.equal(calls.audit.at(-1).data.actorUserId, 7);
  assert.equal(calls.refreshCreate.length, 1);
});

test('handoff: invalid PKCE proof consumes the one-time code and records a failure', async () => {
  const code = 'wrong-verifier-code';
  const challenge = crypto.createHash('sha256').update('expected-verifier').digest('base64url');
  const codeHash = crypto.createHash('sha256').update(code).digest('base64url');
  codeRecord = { id: 32, codeHash, userId: 7, app: 'admin', challenge, expiresAt: new Date(Date.now() + 60_000) };
  calls.audit.length = 0;

  await assert.rejects(
    () => handoffService.redeemHandoffCode({}, { app: 'admin', code, verifier: 'wrong' }),
    (error) => error.code === 'INVALID_HANDOFF',
  );
  assert.equal(calls.audit.at(-1).data.action, 'AUTH_HANDOFF_FAILED');
  assert.equal(calls.audit.at(-1).data.actorAccessType, 'STAFF');
  assert.equal(calls.audit.at(-1).data.metadata.extra.reason, 'PKCE_MISMATCH');
});
