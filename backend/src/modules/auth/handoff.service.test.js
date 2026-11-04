// Unit tests for the app-context boundary used by PKCE handoff.
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

injectMock('../../config/db', {});
injectMock('../../utils/rbac', { loadUserAccess: async () => ({ roles: [], permissions: [] }) });
injectMock('../../config/env', { jwtAccessExpiresIn: '15m' });
injectMock('./auth.service', {
  buildUserContext: async () => ({}),
  issueTokens: async () => ({}),
  expiryToSeconds: () => 900,
});

const { assertPanelAccess } = require('./handoff.service');

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
