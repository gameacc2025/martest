// =============================================================
// Unit tests — RBAC middleware (hasPermission, requireAccessType,
// requirePermission, requireAnyPermission, requireRole, requireOwnCompany)
//
// Run with:  node --test
//
// These tests mock '../utils/rbac' (only the SUPER_ADMIN_ROLE constant
// is needed) so no database / Prisma client is required.
// =============================================================

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const Module = require('node:module');

// ── Mock utils/rbac (only SUPER_ADMIN_ROLE is used by the middleware) ──
const rbacUtilsPath = require.resolve(path.join(__dirname, '../utils/rbac'));
const originalRbacUtilsEntry = require.cache[rbacUtilsPath];
require.cache[rbacUtilsPath] = new Module(rbacUtilsPath);
require.cache[rbacUtilsPath].exports = { SUPER_ADMIN_ROLE: 'SUPER_ADMIN' };
require.cache[rbacUtilsPath].loaded = true;

// require.cache is process-global — in newer Node versions test files
// share a process by default, so this stub (missing loadUserAccess /
// loadUserAccessDetailed) must be restored once this file's tests
// finish, or utils/rbac.test.js (which needs the REAL module) breaks.
test.after(() => {
  if (originalRbacUtilsEntry) require.cache[rbacUtilsPath] = originalRbacUtilsEntry;
  else delete require.cache[rbacUtilsPath];
});

const {
  hasPermission,
  requireAccessType,
  requireExactAccessType,
  requirePermission,
  requireAnyPermission,
  requireRole,
  requireOwnCompany,
} = require('./rbac');

// ── Fake Fastify reply — records what was sent ─────────────────
function makeReply() {
  const reply = {
    statusCode: null,
    body: null,
    code(c) {
      reply.statusCode = c;
      return reply;
    },
    send(b) {
      reply.body = b;
      return reply;
    },
  };
  return reply;
}

const superAdmin = { roles: ['SUPER_ADMIN'], permissions: ['*'], accessType: 'STAFF', companyId: null };
const staff = { roles: ['STAFF_ROLE'], permissions: ['users.read', 'users.create'], accessType: 'STAFF', companyId: null };
const company = { roles: ['COMPANY_ADMIN'], permissions: ['products.read'], accessType: 'COMPANY', companyId: 10 };
const customer = { roles: ['CUSTOMER_USER'], permissions: [], accessType: 'CUSTOMER', companyId: null };

// ── hasPermission ────────────────────────────────────────────

test('hasPermission returns false for a missing/invalid user', () => {
  assert.equal(hasPermission(null, ['users.read']), false);
  assert.equal(hasPermission({}, ['users.read']), false);
});

test('hasPermission: SUPER_ADMIN wildcard matches anything', () => {
  assert.equal(hasPermission(superAdmin, ['anything.at.all']), true);
});

test('hasPermission mode=all requires every permission', () => {
  assert.equal(hasPermission(staff, ['users.read', 'users.create'], 'all'), true);
  assert.equal(hasPermission(staff, ['users.read', 'users.delete'], 'all'), false);
});

test('hasPermission mode=any requires at least one permission', () => {
  assert.equal(hasPermission(staff, ['users.delete', 'users.create'], 'any'), true);
  assert.equal(hasPermission(staff, ['users.delete', 'roles.delete'], 'any'), false);
});

// ── requireExactAccessType ────────────────────────────────────

test('requireExactAccessType: rejects a COMPANY SUPER_ADMIN at a STAFF boundary', async () => {
  const reply = makeReply();
  await requireExactAccessType('STAFF')({
    user: { accessType: 'COMPANY', roles: ['SUPER_ADMIN'], permissions: ['*'] },
  }, reply);
  assert.equal(reply.statusCode, 403);
  assert.equal(reply.body.code, 'FORBIDDEN');
});

test('requireExactAccessType: allows a matching STAFF context', async () => {
  const reply = makeReply();
  const result = await requireExactAccessType('STAFF')({ user: staff }, reply);
  assert.equal(result, undefined);
  assert.equal(reply.statusCode, null);
});

// ── requireAccessType ────────────────────────────────────────

test('requireAccessType: rejects with 401 when there is no user', async () => {
  const reply = makeReply();
  await requireAccessType('STAFF')({ user: null }, reply);
  assert.equal(reply.statusCode, 401);
  assert.equal(reply.body.code, 'UNAUTHORIZED');
});

test('requireAccessType: allows a matching access type', async () => {
  const reply = makeReply();
  const result = await requireAccessType('STAFF')({ user: staff }, reply);
  assert.equal(result, undefined);
  assert.equal(reply.statusCode, null); // never called code/send
});

test('requireAccessType: rejects a mismatched access type with 403', async () => {
  const reply = makeReply();
  await requireAccessType('STAFF')({ user: company }, reply);
  assert.equal(reply.statusCode, 403);
  assert.equal(reply.body.code, 'FORBIDDEN');
});

test('requireAccessType: SUPER_ADMIN bypasses the access-type check', async () => {
  const reply = makeReply();
  // superAdmin.accessType is 'STAFF' above, so use a COMPANY-only guard
  // to prove the bypass is driven by the SUPER_ADMIN role, not accessType.
  const result = await requireAccessType('COMPANY')({ user: superAdmin }, reply);
  assert.equal(result, undefined);
  assert.equal(reply.statusCode, null);
});

// ── requirePermission (ALL) ──────────────────────────────────

test('requirePermission: rejects with 401 when there is no user', async () => {
  const reply = makeReply();
  await requirePermission('users.create')({ user: null }, reply);
  assert.equal(reply.statusCode, 401);
});

test('requirePermission: allows when the user has all required permissions', async () => {
  const reply = makeReply();
  const result = await requirePermission('users.read', 'users.create')({ user: staff }, reply);
  assert.equal(result, undefined);
  assert.equal(reply.statusCode, null);
});

test('requirePermission: rejects with 403 when missing a permission', async () => {
  const reply = makeReply();
  await requirePermission('users.delete')({ user: staff }, reply);
  assert.equal(reply.statusCode, 403);
  assert.equal(reply.body.code, 'FORBIDDEN');
});

test('requirePermission: SUPER_ADMIN wildcard bypasses the check', async () => {
  const reply = makeReply();
  const result = await requirePermission('anything.not.granted')({ user: superAdmin }, reply);
  assert.equal(result, undefined);
  assert.equal(reply.statusCode, null);
});

// ── requireAnyPermission ─────────────────────────────────────

test('requireAnyPermission: allows when at least one permission matches', async () => {
  const reply = makeReply();
  const result = await requireAnyPermission('users.delete', 'users.create')({ user: staff }, reply);
  assert.equal(result, undefined);
  assert.equal(reply.statusCode, null);
});

test('requireAnyPermission: rejects with 403 when none match', async () => {
  const reply = makeReply();
  await requireAnyPermission('users.delete', 'roles.delete')({ user: staff }, reply);
  assert.equal(reply.statusCode, 403);
});

// ── requireRole ───────────────────────────────────────────────

test('requireRole: rejects with 401 when there is no user / no roles array', async () => {
  const reply = makeReply();
  await requireRole('COMPANY_ADMIN')({ user: null }, reply);
  assert.equal(reply.statusCode, 401);
});

test('requireRole: allows a matching role', async () => {
  const reply = makeReply();
  const result = await requireRole('COMPANY_ADMIN')({ user: company }, reply);
  assert.equal(result, undefined);
  assert.equal(reply.statusCode, null);
});

test('requireRole: rejects with 403 for a non-matching role', async () => {
  const reply = makeReply();
  await requireRole('COMPANY_ADMIN')({ user: customer }, reply);
  assert.equal(reply.statusCode, 403);
});

test('requireRole: SUPER_ADMIN bypasses the role check', async () => {
  const reply = makeReply();
  const result = await requireRole('COMPANY_ADMIN')({ user: superAdmin }, reply);
  assert.equal(result, undefined);
  assert.equal(reply.statusCode, null);
});

// ── requireOwnCompany ────────────────────────────────────────

test('requireOwnCompany: rejects with 401 when there is no user', async () => {
  const reply = makeReply();
  await requireOwnCompany(() => 10)({ user: null }, reply);
  assert.equal(reply.statusCode, 401);
});

test('requireOwnCompany: allows when companyId matches the target', async () => {
  const reply = makeReply();
  const request = { user: company, params: { companyId: '10' } };
  const result = await requireOwnCompany((req) => parseInt(req.params.companyId, 10))(request, reply);
  assert.equal(result, undefined);
  assert.equal(reply.statusCode, null);
});

test('requireOwnCompany: rejects with 403 for a different company', async () => {
  const reply = makeReply();
  const request = { user: company, params: { companyId: '999' } };
  await requireOwnCompany((req) => parseInt(req.params.companyId, 10))(request, reply);
  assert.equal(reply.statusCode, 403);
});

test('requireOwnCompany: SUPER_ADMIN bypasses the company check', async () => {
  const reply = makeReply();
  const request = { user: superAdmin, params: { companyId: '999' } };
  const result = await requireOwnCompany((req) => parseInt(req.params.companyId, 10))(request, reply);
  assert.equal(result, undefined);
  assert.equal(reply.statusCode, null);
});