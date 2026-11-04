// مسیر فایل: backend/src/modules/permissions/permission.service.test.js
// =============================================================
// Unit tests — Permission service (listPermissions / getPermission /
// createPermission / updatePermission / deletePermission)
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

const calls = {
  findMany: [],
  findUnique: [],
  count: [],
  create: [],
  update: [],
  delete: [],
  rolePermissionCount: [],
  userPermissionCount: [],
};
let fx;
function resetMocks() {
  Object.keys(calls).forEach((k) => (calls[k] = []));
  fx = {
    items: [],
    total: 0,
    byId: null,
    byName: null, // used for both "exists on create" and "rename collision" lookups
    rolesWithPermission: 0,
    usersWithPermission: 0,
    created: { id: 1 },
    updated: { id: 1 },
  };
}
resetMocks();

const mockPrisma = {
  permission: {
    findMany: async (args) => {
      calls.findMany.push(args);
      return fx.items;
    },
    findUnique: async (args) => {
      calls.findUnique.push(args);
      if (args.where.name !== undefined) return fx.byName;
      return fx.byId;
    },
    count: async (args) => {
      calls.count.push(args);
      return fx.total;
    },
    create: async (args) => {
      calls.create.push(args);
      return fx.created;
    },
    update: async (args) => {
      calls.update.push(args);
      return fx.updated;
    },
    delete: async (args) => {
      calls.delete.push(args);
      return {};
    },
  },
  rolePermission: {
    count: async (args) => {
      calls.rolePermissionCount.push(args);
      return fx.rolesWithPermission;
    },
  },
  userPermission: {
    count: async (args) => {
      calls.userPermissionCount.push(args);
      return fx.usersWithPermission;
    },
  },
};

injectMock('../../config/db', mockPrisma);

const {
  listPermissions,
  getPermission,
  createPermission,
  updatePermission,
  deletePermission,
} = require('./permission.service');

// ── listPermissions ──────────────────────────────────────────

test('listPermissions: with no page/limit, returns a plain array', async () => {
  resetMocks();
  fx.items = [{ id: 1, group: 'products' }];

  const result = await listPermissions({});
  assert.ok(Array.isArray(result));
});

test('listPermissions: grouped=true (no pagination) returns { all, grouped } bucketed by `group`', async () => {
  resetMocks();
  fx.items = [
    { id: 1, name: 'products.read', group: 'products' },
    { id: 2, name: 'products.create', group: 'products' },
    { id: 3, name: 'inquiries.read', group: 'inquiries' },
    { id: 4, name: 'weird', group: null },
  ];

  const result = await listPermissions({ grouped: 'true' });

  assert.deepEqual(result.all, fx.items);
  assert.equal(result.grouped.products.length, 2);
  assert.equal(result.grouped.inquiries.length, 1);
  assert.equal(result.grouped.other.length, 1, 'a null group falls back to "other"');
});

test('listPermissions: page/limit triggers the paginated shape', async () => {
  resetMocks();
  fx.items = [{ id: 1 }];
  fx.total = 1;

  const result = await listPermissions({ page: 1, limit: 20 });
  assert.deepEqual(Object.keys(result).sort(), ['data', 'meta'].sort());
});

test('listPermissions: search builds an OR across name/label/group', async () => {
  resetMocks();
  await listPermissions({ search: 'read' });

  const where = calls.findMany[0].where;
  assert.equal(where.OR.length, 3);
});

test('listPermissions: group filters to an exact group', async () => {
  resetMocks();
  await listPermissions({ group: 'products' });

  assert.equal(calls.findMany[0].where.group, 'products');
});

// ── getPermission ────────────────────────────────────────────

test('getPermission: throws a 404 AppError for an unknown id', async () => {
  resetMocks();
  fx.byId = null;

  await assert.rejects(() => getPermission(999), (err) => {
    assert.equal(err.statusCode, 404);
    return true;
  });
});

test('getPermission: coerces the id to a number', async () => {
  resetMocks();
  fx.byId = { id: 5 };

  await getPermission('5');
  assert.equal(calls.findUnique[0].where.id, 5);
});

// ── createPermission ─────────────────────────────────────────

test('createPermission: rejects a duplicate name with 409', async () => {
  resetMocks();
  fx.byName = { id: 1 };

  await assert.rejects(
    () => createPermission({ name: 'products.read', label: 'Read products' }),
    (err) => {
      assert.equal(err.statusCode, 409);
      return true;
    }
  );
});

test('createPermission: normalizes the name (trim, lowercase, spaces -> dots)', async () => {
  resetMocks();
  fx.byName = null;

  await createPermission({ name: '  Products  Read  ', label: 'Read products' });

  assert.equal(calls.create[0].data.name, 'products.read');
});

test('createPermission: defaults description/group to null when omitted', async () => {
  resetMocks();
  fx.byName = null;

  await createPermission({ name: 'x.y', label: 'X Y' });

  assert.equal(calls.create[0].data.description, null);
  assert.equal(calls.create[0].data.group, null);
});

// ── updatePermission ─────────────────────────────────────────

test('updatePermission: throws a 404 AppError for an unknown id', async () => {
  resetMocks();
  fx.byId = null;

  await assert.rejects(() => updatePermission(999, {}), (err) => {
    assert.equal(err.statusCode, 404);
    return true;
  });
});

test('updatePermission: renaming to an already-used name is rejected with 409', async () => {
  resetMocks();
  fx.byId = { id: 1, name: 'products.read' };
  fx.byName = { id: 2, name: 'products.update' }; // collision target already exists

  await assert.rejects(
    () => updatePermission(1, { name: 'products.update' }),
    (err) => {
      assert.equal(err.statusCode, 409);
      return true;
    }
  );
});

test('updatePermission: renaming to the SAME name is a no-op collision check (allowed)', async () => {
  resetMocks();
  fx.byId = { id: 1, name: 'products.read' };

  await updatePermission(1, { name: 'products.read', label: 'New label' });

  // Since data.name === existing.name, the collision lookup must be skipped
  // entirely (findUnique should only have been called once: the initial fetch).
  assert.equal(calls.findUnique.length, 1);
  assert.equal('name' in calls.update[0].data, false);
});

test('updatePermission: only touches the fields explicitly provided', async () => {
  resetMocks();
  fx.byId = { id: 1, name: 'products.read' };

  await updatePermission(1, { label: 'New label' });

  assert.deepEqual(calls.update[0].data, { label: 'New label' });
});

// ── deletePermission ─────────────────────────────────────────

test('deletePermission: throws a 404 AppError for an unknown id', async () => {
  resetMocks();
  fx.byId = null;

  await assert.rejects(() => deletePermission(999), (err) => {
    assert.equal(err.statusCode, 404);
    return true;
  });
});

test('deletePermission: refuses to delete a permission still assigned to a role', async () => {
  resetMocks();
  fx.byId = { id: 1 };
  fx.rolesWithPermission = 2;

  await assert.rejects(() => deletePermission(1), (err) => {
    assert.equal(err.statusCode, 400);
    return true;
  });
  assert.equal(calls.delete.length, 0);
});

test('deletePermission: refuses to delete a permission still assigned directly to a user', async () => {
  resetMocks();
  fx.byId = { id: 1 };
  fx.rolesWithPermission = 0;
  fx.usersWithPermission = 1;

  await assert.rejects(() => deletePermission(1), (err) => {
    assert.equal(err.statusCode, 400);
    return true;
  });
  assert.equal(calls.delete.length, 0);
});

test('deletePermission: deletes an unassigned permission', async () => {
  resetMocks();
  fx.byId = { id: 1 };
  fx.rolesWithPermission = 0;
  fx.usersWithPermission = 0;

  const result = await deletePermission(1);

  assert.equal(calls.delete.length, 1);
  assert.ok(result.message);
});