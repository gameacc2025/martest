// =============================================================
// Unit tests — utils/rbac.js (loadUserAccess, loadUserAccessDetailed)
//
// This is the module that decides what a user is allowed to do
// (SUPER_ADMIN wildcard, role→permission union, de-duplication). It's
// consumed by auth.service (embedded in the access token) and
// user.service (returned to the admin UI) — a bug here silently
// over- or under-grants access across the whole app, so it gets
// dedicated, thorough coverage rather than relying on it being
// exercised indirectly by auth.service's tests.
//
// Run with:  node --test
// =============================================================

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const Module = require('node:module');

function injectMock(relativePath, exportsObj) {
  const resolved = require.resolve(path.join(__dirname, relativePath));
  const original = require.cache[resolved];
  require.cache[resolved] = new Module(resolved);
  require.cache[resolved].exports = exportsObj;
  require.cache[resolved].loaded = true;
  test.after(() => {
    if (original) require.cache[resolved] = original;
    else delete require.cache[resolved];
  });
  return resolved;
}

// ── Mock Prisma client ───────────────────────────────────────
const calls = {
  userFindUnique: [],
  roleFindMany: [],
  permissionFindMany: [],
};

let fx; // fixtures, reset before each test

function resetMocks() {
  calls.userFindUnique = [];
  calls.roleFindMany = [];
  calls.permissionFindMany = [];
  fx = {
    user: null,           // what prisma.user.findUnique should return
    roleRecords: [],       // what prisma.role.findMany should return
    permissionRecords: [], // what prisma.permission.findMany should return
  };
}

const mockPrisma = {
  user: {
    findUnique: async (args) => {
      calls.userFindUnique.push(args);
      return fx.user;
    },
  },
  role: {
    findMany: async (args) => {
      calls.roleFindMany.push(args);
      return fx.roleRecords;
    },
  },
  permission: {
    findMany: async (args) => {
      calls.permissionFindMany.push(args);
      return fx.permissionRecords;
    },
  },
};

injectMock('../config/db', mockPrisma);

const { SUPER_ADMIN_ROLE, loadUserAccess, loadUserAccessDetailed } = require('./rbac');

// Helper: build the nested shape prisma.user.findUnique's `select` returns.
function userWithRoles(roleDefs) {
  // roleDefs: [{ name: 'COMPANY_ADMIN', permissions: ['products.manage', ...] }, ...]
  return {
    id: 1,
    roles: roleDefs.map((r) => ({
      role: {
        name: r.name,
        permissions: r.permissions.map((p) => ({ permission: { name: p } })),
      },
    })),
  };
}

// ── loadUserAccess ─────────────────────────────────────────────

test('loadUserAccess: returns empty roles/permissions when the user does not exist', async () => {
  resetMocks();
  fx.user = null;

  const result = await loadUserAccess(999);
  assert.deepEqual(result, { roles: [], permissions: [] });
});

test('loadUserAccess: a role with no permissions yields an empty permissions array', async () => {
  resetMocks();
  fx.user = userWithRoles([{ name: 'VIEWER', permissions: [] }]);

  const result = await loadUserAccess(1);
  assert.deepEqual(result, { roles: ['VIEWER'], permissions: [] });
});

test('loadUserAccess: permissions are the union of all held roles', async () => {
  resetMocks();
  fx.user = userWithRoles([
    { name: 'PRODUCT_MANAGER', permissions: ['products.create', 'products.update'] },
    { name: 'SUPPORT_AGENT', permissions: ['inquiries.read'] },
  ]);

  const result = await loadUserAccess(1);
  assert.deepEqual(result.roles.sort(), ['PRODUCT_MANAGER', 'SUPPORT_AGENT']);
  assert.deepEqual(
    result.permissions.sort(),
    ['inquiries.read', 'products.create', 'products.update'].sort()
  );
});

test('loadUserAccess: duplicate permissions across roles are de-duplicated', async () => {
  resetMocks();
  fx.user = userWithRoles([
    { name: 'ROLE_A', permissions: ['products.read', 'products.update'] },
    { name: 'ROLE_B', permissions: ['products.read', 'inquiries.read'] }, // products.read overlaps
  ]);

  const result = await loadUserAccess(1);
  const readCount = result.permissions.filter((p) => p === 'products.read').length;
  assert.equal(readCount, 1, 'products.read should appear exactly once, not per-role');
  assert.equal(result.permissions.length, 3);
});

test('loadUserAccess: SUPER_ADMIN role always returns the ["*"] wildcard', async () => {
  resetMocks();
  // Even with other roles/permissions attached, SUPER_ADMIN wins.
  fx.user = userWithRoles([
    { name: SUPER_ADMIN_ROLE, permissions: [] }, // SUPER_ADMIN itself carries no explicit perms in DB
    { name: 'VIEWER', permissions: ['products.read'] },
  ]);

  const result = await loadUserAccess(1);
  assert.deepEqual(result.permissions, ['*']);
  assert.ok(result.roles.includes(SUPER_ADMIN_ROLE));
});

test('loadUserAccess: queries by the given userId', async () => {
  resetMocks();
  fx.user = userWithRoles([]);

  await loadUserAccess(42);
  assert.equal(calls.userFindUnique.length, 1);
  assert.equal(calls.userFindUnique[0].where.id, 42);
});

// ── loadUserAccessDetailed ──────────────────────────────────────

test('loadUserAccessDetailed: fetches role + permission records matching the user\'s access', async () => {
  resetMocks();
  fx.user = userWithRoles([{ name: 'VIEWER', permissions: ['products.read'] }]);
  fx.roleRecords = [{ id: 1, name: 'VIEWER', label: 'Viewer', isSystem: false }];
  fx.permissionRecords = [{ id: 5, name: 'products.read', label: 'Read products', group: 'products' }];

  const result = await loadUserAccessDetailed(1);

  assert.deepEqual(result.roles, fx.roleRecords);
  assert.deepEqual(result.permissions, fx.permissionRecords);
  // Non-wildcard case: permission lookup must be filtered to the user's
  // actual permission names, not fetch the whole table.
  assert.deepEqual(calls.permissionFindMany[0].where, { name: { in: ['products.read'] } });
});

test('loadUserAccessDetailed: SUPER_ADMIN gets ALL permissions (no name filter), not just an explicit list', async () => {
  resetMocks();
  fx.user = userWithRoles([{ name: SUPER_ADMIN_ROLE, permissions: [] }]);
  fx.roleRecords = [{ id: 1, name: SUPER_ADMIN_ROLE, label: 'Super Admin', isSystem: true }];
  fx.permissionRecords = [
    { id: 1, name: 'products.read', label: 'x', group: 'products' },
    { id: 2, name: 'users.delete', label: 'y', group: 'users' },
  ];

  const result = await loadUserAccessDetailed(1);

  assert.deepEqual(result.permissions, fx.permissionRecords);
  // The wildcard path must NOT pass a `where` filter — it should ask for everything.
  assert.equal(calls.permissionFindMany[0].where, undefined);
});

test('loadUserAccessDetailed: a user with no roles returns empty role/permission lists', async () => {
  resetMocks();
  fx.user = null; // unknown/deleted user
  fx.roleRecords = [];
  fx.permissionRecords = [];

  const result = await loadUserAccessDetailed(999);
  assert.deepEqual(result, { roles: [], permissions: [] });
});