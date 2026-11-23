// مسیر فایل: backend/src/modules/roles/role.service.test.js
// =============================================================
// Unit tests — Role service (listRoles / listAssignableRoles /
// getRole / createRole / updateRole / deleteRole)
//
// Run with:  node --test
// =============================================================

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
  return resolved;
}

const auditCalls = [];
const calls = {
  roleFindMany: [],
  roleFindUnique: [],
  roleCount: [],
  roleCreate: [],
  roleUpdate: [],
  roleDelete: [],
  permissionCount: [],
  transaction: [],
};
let fx;
function resetMocks() {
  Object.keys(calls).forEach((k) => (calls[k] = []));
  auditCalls.length = 0;
  fx = {
    roles: [],
    total: 0,
    role: null, // prisma.role.findUnique
    roleByName: null,
    permissionCount: 0,
    created: { id: 1, name: 'X', scope: 'STAFF' },
    updated: { id: 1 },
  };
}
resetMocks();

const mockPrisma = {
  role: {
    findMany: async (args) => {
      calls.roleFindMany.push(args);
      return fx.roles;
    },
    findUnique: async (args) => {
      calls.roleFindUnique.push(args);
      if (args.where.name !== undefined) return fx.roleByName;
      return fx.role;
    },
    count: async (args) => {
      calls.roleCount.push(args);
      return fx.total;
    },
    create: async (args) => {
      calls.roleCreate.push(args);
      return fx.created;
    },
    update: async (args) => {
      calls.roleUpdate.push(args);
      return fx.updated;
    },
    delete: async (args) => {
      calls.roleDelete.push(args);
      return {};
    },
  },
  permission: {
    count: async (args) => {
      calls.permissionCount.push(args);
      return fx.permissionCount;
    },
  },
  rolePermission: {
    deleteMany: async () => ({ count: 0 }),
    createMany: async () => ({ count: 0 }),
  },
  $transaction: async (arg) => {
    calls.transaction.push(arg);
    if (Array.isArray(arg)) return Promise.all(arg);
    return arg(mockPrisma);
  },
};

injectMock('../../config/db', mockPrisma);
injectMock('../audit/audit.service', {
  recordAuditLogExplicit: async (entry) => {
    auditCalls.push(entry);
    return { id: auditCalls.length };
  },
});

const {
  listRoles,
  listAssignableRoles,
  getRole,
  createRole,
  updateRole,
  deleteRole,
} = require('./role.service');

// ── listRoles ────────────────────────────────────────────────

test('listRoles: with no page/limit in the query, returns a plain array (no pagination)', async () => {
  resetMocks();
  fx.roles = [{ id: 1 }, { id: 2 }];

  const result = await listRoles({});

  assert.ok(Array.isArray(result));
  assert.equal(calls.roleCount.length, 0, 'should not count when not paginating');
});

test('listRoles: page/limit present triggers the paginated { data, meta } shape', async () => {
  resetMocks();
  fx.roles = [{ id: 1 }];
  fx.total = 1;

  const result = await listRoles({ page: 1, limit: 20 });

  assert.deepEqual(Object.keys(result).sort(), ['data', 'meta'].sort());
  assert.equal(result.meta.total, 1);
});

test('listRoles: search builds a case-insensitive OR on name/label', async () => {
  resetMocks();
  await listRoles({ search: 'admin' });

  const where = calls.roleFindMany[0].where;
  assert.equal(where.OR[0].name.contains, 'admin');
  assert.equal(where.OR[1].label.contains, 'admin');
});

// ── listAssignableRoles ──────────────────────────────────────

test('listAssignableRoles: filters strictly by the caller\'s accessType as `scope`', async () => {
  resetMocks();
  await listAssignableRoles({ accessType: 'COMPANY' });

  assert.deepEqual(calls.roleFindMany[0].where, { scope: 'COMPANY' });
});

// ── getRole ──────────────────────────────────────────────────

test('getRole: throws NOT_FOUND for an unknown id', async () => {
  resetMocks();
  fx.role = null;

  await assert.rejects(() => getRole(999), (err) => {
    assert.equal(err.code, 'NOT_FOUND');
    return true;
  });
});

test('getRole: returns the role when found', async () => {
  resetMocks();
  fx.role = { id: 1, name: 'VIEWER' };

  const result = await getRole(1);
  assert.deepEqual(result, fx.role);
});

// ── createRole ───────────────────────────────────────────────

test('createRole: rejects a duplicate role name', async () => {
  resetMocks();
  fx.roleByName = { id: 1 };

  await assert.rejects(
    () => createRole({ name: 'VIEWER', label: 'Viewer', scope: 'STAFF' }),
    (err) => {
      assert.equal(err.statusCode, 409);
      assert.equal(err.code, 'DUPLICATE_ROLE');
      return true;
    }
  );
});

test('createRole: duplicate check uses the normalized role name', async () => {
  resetMocks();
  fx.roleByName = { id: 1 };
  await assert.rejects(
    () => createRole({ name: '  sales manager  ', label: 'Sales Manager', scope: 'COMPANY' }),
    (error) => error.code === 'DUPLICATE_ROLE',
  );
  assert.deepEqual(calls.roleFindUnique[0].where, { name: 'SALES_MANAGER' });
});

test('createRole: normalizes the name (trim, uppercase, spaces->underscores)', async () => {
  resetMocks();
  fx.roleByName = null;

  await createRole({ name: '  sales manager  ', label: 'Sales Manager', scope: 'COMPANY' });

  assert.equal(calls.roleCreate[0].data.name, 'SALES_MANAGER');
});

test('createRole: rejects when any requested permissionId does not exist', async () => {
  resetMocks();
  fx.roleByName = null;
  fx.permissionCount = 1; // only 1 of the 2 requested ids actually exists

  await assert.rejects(
    () => createRole({ name: 'X', label: 'X', scope: 'STAFF', permissionIds: [1, 2] }),
    (err) => {
      assert.equal(err.code, 'INVALID_PERMISSION');
      return true;
    }
  );
});

test('createRole: new roles are never system roles', async () => {
  resetMocks();
  fx.roleByName = null;

  await createRole({ name: 'X', label: 'X', scope: 'STAFF' });

  assert.equal(calls.roleCreate[0].data.isSystem, false);
});

test('createRole: wires permissionIds into a nested create when provided', async () => {
  resetMocks();
  fx.roleByName = null;
  fx.permissionCount = 2;

  await createRole({ name: 'X', label: 'X', scope: 'STAFF', permissionIds: ['1', '2'] });

  assert.deepEqual(calls.roleCreate[0].data.permissions.create, [
    { permissionId: 1 },
    { permissionId: 2 },
  ]);
  assert.equal(auditCalls[0].action, 'ROLE_CREATED');
  assert.equal(auditCalls[0].entityType, 'Role');
  assert.equal(auditCalls[0].entityId, 1);
  assert.equal(auditCalls[0].tx, mockPrisma);
  assert.deepEqual(auditCalls[0].metadata, { permissionCount: 2 });
  assert.deepEqual(auditCalls.slice(1).map((entry) => entry.action), ['ROLE_PERMISSION_ADDED', 'ROLE_PERMISSION_ADDED']);
  assert.deepEqual(auditCalls.slice(1).map((entry) => entry.after.permissionId), [1, 2]);
});

// ── updateRole ───────────────────────────────────────────────

test('updateRole: throws NOT_FOUND for an unknown role', async () => {
  resetMocks();
  fx.role = null;

  await assert.rejects(() => updateRole(999, {}), (err) => {
    assert.equal(err.code, 'NOT_FOUND');
    return true;
  });
});

test('updateRole: refuses to change the scope of a system role', async () => {
  resetMocks();
  fx.role = { id: 1, isSystem: true };

  await assert.rejects(() => updateRole(1, { scope: 'COMPANY' }), (err) => {
    assert.equal(err.statusCode, 400);
    assert.equal(err.code, 'SYSTEM_ROLE');
    return true;
  });
});

test('updateRole: allows updating permissions on a system role when its scope is unchanged', async () => {
  resetMocks();
  fx.role = { id: 1, isSystem: true, scope: 'STAFF' };
  fx.permissionCount = 1;

  await updateRole(1, { label: 'مدیر محتوا', scope: 'STAFF', permissionIds: [1] });

  assert.equal(calls.roleUpdate[0].data.label, 'مدیر محتوا');
  assert.equal(calls.roleUpdate[0].data.scope, undefined, 'system role scope must remain immutable');
  assert.equal(calls.transaction.length, 1, 'permissions should be replaced');
});

test('updateRole: allows changing the scope of a non-system role', async () => {
  resetMocks();
  fx.role = { id: 1, isSystem: false };

  await updateRole(1, { scope: 'COMPANY' });

  assert.equal(calls.roleUpdate[0].data.scope, 'COMPANY');
});

test('updateRole: rejects an invalid permissionId on update', async () => {
  resetMocks();
  fx.role = { id: 1, isSystem: false };
  fx.permissionCount = 0;

  await assert.rejects(() => updateRole(1, { permissionIds: [999] }), (err) => {
    assert.equal(err.code, 'INVALID_PERMISSION');
    return true;
  });
});

test('updateRole: replaces permissions via delete-then-create in a transaction', async () => {
  resetMocks();
  fx.role = { id: 1, isSystem: false, name: 'X', scope: 'STAFF', permissions: [{ permissionId: 1 }, { permissionId: 3 }] };
  fx.permissionCount = 2;

  await updateRole(1, { permissionIds: [1, 2] });

  assert.equal(calls.transaction.length, 1);
  assert.equal(typeof calls.transaction[0], 'function');
  assert.equal(auditCalls[0].action, 'ROLE_UPDATED');
  assert.equal(auditCalls[0].entityId, 1);
  assert.equal(auditCalls[0].tx, mockPrisma);
  assert.deepEqual(auditCalls[0].metadata.changedFields, ['permissionIds']);
  assert.equal(auditCalls[0].metadata.permissionCount, 2);
  assert.deepEqual(auditCalls[0].metadata.addedPermissionIds, [2]);
  assert.deepEqual(auditCalls[0].metadata.removedPermissionIds, [3]);
  assert.deepEqual(auditCalls.slice(1).map((entry) => entry.action), ['ROLE_PERMISSION_ADDED', 'ROLE_PERMISSION_REMOVED']);
});

test('updateRole: passing an empty permissionIds array clears all permissions (delete only, no create)', async () => {
  resetMocks();
  fx.role = { id: 1, isSystem: false, permissions: [{ permissionId: 1 }, { permissionId: 2 }] };

  await updateRole(1, { permissionIds: [] });

  assert.equal(typeof calls.transaction[0], 'function');
  assert.equal(auditCalls[0].action, 'ROLE_UPDATED');
  assert.equal(auditCalls[0].metadata.permissionCount, 0);
  assert.deepEqual(auditCalls[0].metadata.removedPermissionIds, [1, 2]);
  assert.deepEqual(auditCalls.slice(1).map((entry) => entry.action), ['ROLE_PERMISSION_REMOVED', 'ROLE_PERMISSION_REMOVED']);
});

// ── deleteRole ───────────────────────────────────────────────

test('deleteRole: throws NOT_FOUND for an unknown role', async () => {
  resetMocks();
  fx.role = null;

  await assert.rejects(() => deleteRole(999), (err) => {
    assert.equal(err.code, 'NOT_FOUND');
    return true;
  });
});

test('deleteRole: refuses to delete a system role', async () => {
  resetMocks();
  fx.role = { id: 1, isSystem: true };

  await assert.rejects(() => deleteRole(1), (err) => {
    assert.equal(err.statusCode, 400);
    assert.equal(err.code, 'SYSTEM_ROLE');
    return true;
  });
  assert.equal(calls.roleDelete.length, 0);
});

test('deleteRole: deletes a non-system role', async () => {
  resetMocks();
  fx.role = { id: 1, isSystem: false, name: 'CUSTOM', scope: 'STAFF', permissions: [{ permissionId: 4 }] };

  const result = await deleteRole(1);

  assert.equal(calls.roleDelete.length, 1);
  assert.ok(result.message);
  assert.equal(calls.transaction.length, 1);
  assert.equal(auditCalls[0].action, 'ROLE_DELETED');
  assert.equal(auditCalls[0].entityId, 1);
  assert.equal(auditCalls[0].tx, mockPrisma);
  assert.equal(auditCalls[1].action, 'ROLE_PERMISSION_REMOVED');
  assert.equal(auditCalls[1].before.permissionId, 4);
});