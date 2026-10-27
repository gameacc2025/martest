// مسیر فایل: backend/src/modules/users/user.service.test.js
// =============================================================
// Unit tests — User service (listUsers / getUser / createUser /
// updateUser / setUserAccess / deleteUser / setAccessActive /
// moveUserToCompany)
//
// Run with:  node --test
//
// This is the module the utils/rbac.js breakage (empty exports)
// would have silently broken at runtime — loadUserAccess is called
// directly in listUsers/getUser/setUserAccess. It also carries the
// bulk of the multi-tenant authorization surface (company scoping,
// role-out-of-scope privilege-escalation guards, last-SUPER_ADMIN
// protection, self-delete/self-modify guards), so it gets dedicated
// coverage rather than relying on route-level integration tests.
//
// Mocks injected (same technique as auth.service.test.js):
//   - config/db      -> mockPrisma (records calls, returns fixtures)
//   - utils/password -> stub hashPassword
//   - utils/rbac     -> stub loadUserAccess / loadUserAccessDetailed / SUPER_ADMIN_ROLE
//   - utils/pagination -> the REAL module (no need to stub, it's pure)
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
  // require.cache is process-global — restore after this file's tests so
  // the real utils/rbac (needed by utils/rbac.test.js, security.test.js,
  // etc.) isn't left stubbed for whichever file runs next.
  test.after(() => {
    if (original) require.cache[resolved] = original;
    else delete require.cache[resolved];
  });
  return resolved;
}

const SUPER_ADMIN_ROLE = 'SUPER_ADMIN';

// ── Mock Prisma client ───────────────────────────────────────
const calls = {
  userFindUnique: [],
  userFindMany: [],
  userCount: [],
  userCreate: [],
  userUpdate: [],
  userDelete: [],
  profileUpsert: [],
  accessProfileCreate: [],
  accessProfileUpsert: [],
  accessProfileUpdate: [],
  roleFindMany: [],
  roleFindUnique: [],
  userRoleDeleteMany: [],
  userRoleCreate: [],
  userRoleCount: [],
  companyFindUnique: [],
  transaction: [],
};

let fx;

function resetMocks() {
  Object.keys(calls).forEach((k) => (calls[k] = []));
  fx = {
    userById: null,
    userByEmail: null,
    userByPhone: null,
    listResults: [],
    listTotal: 0,
    role: null, // prisma.role.findUnique
    roles: [], // prisma.role.findMany
    company: null, // prisma.company.findUnique
    superAdminCount: 1,
    createdUser: { id: 100 },
  };
}
resetMocks();

const mockPrisma = {
  user: {
    findUnique: async (args) => {
      calls.userFindUnique.push(args);
      if (args.where.email !== undefined) return fx.userByEmail;
      if (args.where.phone !== undefined) return fx.userByPhone;
      return fx.userById;
    },
    findMany: async (args) => {
      calls.userFindMany.push(args);
      return fx.listResults;
    },
    count: async (args) => {
      calls.userCount.push(args);
      return fx.listTotal;
    },
    create: async (args) => {
      calls.userCreate.push(args);
      return fx.createdUser;
    },
    update: async (args) => {
      calls.userUpdate.push(args);
      return { id: args.where.id };
    },
    delete: async (args) => {
      calls.userDelete.push(args);
      return { id: args.where.id };
    },
  },
  profile: {
    create: async () => ({}),
    upsert: async (args) => {
      calls.profileUpsert.push(args);
      return {};
    },
  },
  accessProfile: {
    create: async (args) => {
      calls.accessProfileCreate.push(args);
      return {};
    },
    upsert: async (args) => {
      calls.accessProfileUpsert.push(args);
      return {};
    },
    update: async (args) => {
      calls.accessProfileUpdate.push(args);
      return {};
    },
  },
  role: {
    findMany: async (args) => {
      calls.roleFindMany.push(args);
      return fx.roles;
    },
    findUnique: async (args) => {
      calls.roleFindUnique.push(args);
      return fx.role;
    },
  },
  userRole: {
    deleteMany: async (args) => {
      calls.userRoleDeleteMany.push(args);
      return { count: 0 };
    },
    create: async (args) => {
      calls.userRoleCreate.push(args);
      return {};
    },
    count: async (args) => {
      calls.userRoleCount.push(args);
      return fx.superAdminCount;
    },
  },
  company: {
    findUnique: async (args) => {
      calls.companyFindUnique.push(args);
      return fx.company;
    },
  },
  $transaction: async (arg) => {
    calls.transaction.push(arg);
    // user.service uses both styles:
    //   prisma.$transaction([p1, p2])         -> array of already-started promises
    //   prisma.$transaction(async (tx) => {}) -> callback receiving a tx client
    if (Array.isArray(arg)) return Promise.all(arg);
    return arg(mockPrisma);
  },
};

injectMock('../../config/db', mockPrisma);
injectMock('../../utils/password', {
  hashPassword: async (pw) => `hashed(${pw})`,
});

// ── Mock RBAC — controllable per test via fx.access ──────────
let accessFx; // { roles, permissions } returned by loadUserAccess/-Detailed
function resetAccessFx() {
  accessFx = { roles: ['VIEWER'], permissions: ['products.read'] };
}
resetAccessFx();

injectMock('../../utils/rbac', {
  SUPER_ADMIN_ROLE,
  loadUserAccess: async () => ({ roles: accessFx.roles, permissions: accessFx.permissions }),
  loadUserAccessDetailed: async () => ({ roles: accessFx.roles, permissions: accessFx.permissions }),
});

const {
  listUsers,
  getUser,
  createUser,
  updateUser,
  setUserAccess,
  deleteUser,
  setAccessActive,
  moveUserToCompany,
} = require('./user.service');

// Helper: build a caller (request.user shape after auth).
function caller({ id = 1, roles = ['VIEWER'], companyId = null, accessType = 'STAFF', permissions = [] } = {}) {
  return { id, roles, companyId, accessType, permissions };
}

function dbUser(overrides = {}) {
  return {
    id: 5,
    email: 'user@example.com',
    phone: null,
    status: 'ACTIVE',
    accessProfile: { companyId: 10 },
    ...overrides,
  };
}

// ── listUsers ─────────────────────────────────────────────────

test('listUsers: non-SUPER_ADMIN callers are forced into their own company, ignoring query.companyId', async () => {
  resetMocks();
  fx.listResults = [];
  fx.listTotal = 0;

  await listUsers({ companyId: '999' }, caller({ roles: ['COMPANY_ADMIN'], companyId: 10 }));

  const where = calls.userFindMany[0].where;
  assert.deepEqual(where.AND[0], { accessProfile: { companyId: 10 } });
});

test('listUsers: CUSTOMER context cannot access user administration even with SUPER_ADMIN role', async () => {
  resetMocks();
  await assert.rejects(
    () => listUsers({}, caller({ roles: [SUPER_ADMIN_ROLE], accessType: 'CUSTOMER', permissions: ['*'] })),
    (err) => err.statusCode === 403 && err.code === 'ACCESS_TYPE_FORBIDDEN',
  );
  assert.equal(calls.userFindMany.length, 0);
});

test('listUsers: COMPANY context remains tenant-scoped even with a SUPER_ADMIN role', async () => {
  resetMocks();
  await listUsers({ companyId: '999' }, caller({ roles: [SUPER_ADMIN_ROLE], accessType: 'COMPANY', companyId: 10 }));
  assert.deepEqual(calls.userFindMany[0].where.AND[0], { accessProfile: { companyId: 10, type: 'COMPANY' } });
});

test('listUsers: SUPER_ADMIN can filter by any companyId', async () => {
  resetMocks();
  await listUsers({ companyId: '42' }, caller({ roles: [SUPER_ADMIN_ROLE] }));

  const where = calls.userFindMany[0].where;
  assert.deepEqual(where.AND[0], { accessProfile: { companyId: 42 } });
});

test('listUsers: SUPER_ADMIN with no companyId filter applies no company scoping', async () => {
  resetMocks();
  await listUsers({}, caller({ roles: [SUPER_ADMIN_ROLE] }));

  const where = calls.userFindMany[0].where;
  assert.equal(where.AND, undefined);
});

test('listUsers: enriches each row with roles/permissions from loadUserAccess', async () => {
  resetMocks();
  fx.listResults = [{ id: 1 }, { id: 2 }];
  fx.listTotal = 2;
  accessFx = { roles: ['VIEWER'], permissions: ['products.read'] };

  const result = await listUsers({}, caller({ roles: [SUPER_ADMIN_ROLE] }));

  assert.equal(result.data.length, 2);
  for (const row of result.data) {
    assert.deepEqual(row.roles, ['VIEWER']);
    assert.deepEqual(row.permissions, ['products.read']);
  }
  resetAccessFx();
});

test('listUsers: builds a case-insensitive search OR clause across email/phone/name', async () => {
  resetMocks();
  await listUsers({ search: 'ali' }, caller({ roles: [SUPER_ADMIN_ROLE] }));

  const where = calls.userFindMany[0].where;
  const searchClause = where.AND.find((c) => c.OR);
  assert.ok(searchClause, 'expected an OR search clause');
  assert.equal(searchClause.OR.length, 4);
});

test('listUsers: returns the standard paginated response shape', async () => {
  resetMocks();
  fx.listResults = [{ id: 1 }];
  fx.listTotal = 1;

  const result = await listUsers({ page: '1', limit: '20' }, caller({ roles: [SUPER_ADMIN_ROLE] }));
  assert.deepEqual(Object.keys(result).sort(), ['data', 'meta'].sort());
  assert.equal(result.meta.total, 1);
  assert.equal(result.meta.page, 1);
});

// ── getUser ──────────────────────────────────────────────────

test('getUser: throws NOT_FOUND when the user does not exist', async () => {
  resetMocks();
  fx.userById = null;
  await assert.rejects(() => getUser(999, caller({ roles: [SUPER_ADMIN_ROLE] })), (err) => {
    assert.equal(err.statusCode, 404);
    assert.equal(err.code, 'NOT_FOUND');
    return true;
  });
});

test('getUser: rejects a non-admin caller from a different company (403)', async () => {
  resetMocks();
  fx.userById = dbUser({ accessProfile: { companyId: 10 } });

  await assert.rejects(
    () => getUser(5, caller({ roles: ['COMPANY_ADMIN'], companyId: 20 })),
    (err) => {
      assert.equal(err.statusCode, 403);
      assert.equal(err.code, 'FORBIDDEN');
      return true;
    }
  );
});

test('getUser: allows a caller from the SAME company', async () => {
  resetMocks();
  fx.userById = dbUser({ accessProfile: { companyId: 10 } });

  const result = await getUser(5, caller({ roles: ['COMPANY_ADMIN'], companyId: 10 }));
  assert.equal(result.id, 5);
});

test('getUser: COMPANY context cannot view another company even with a SUPER_ADMIN role', async () => {
  resetMocks();
  fx.userById = dbUser({ accessProfile: { type: 'COMPANY', companyId: 999 } });
  await assert.rejects(
    () => getUser(5, caller({ roles: [SUPER_ADMIN_ROLE], accessType: 'COMPANY', companyId: 10 })),
    (err) => err.statusCode === 403 && err.code === 'FORBIDDEN',
  );
});

test('getUser: SUPER_ADMIN can view a user in any company', async () => {
  resetMocks();
  fx.userById = dbUser({ accessProfile: { companyId: 999 } });

  const result = await getUser(5, caller({ roles: [SUPER_ADMIN_ROLE], companyId: 1 }));
  assert.equal(result.id, 5);
});

// ── createUser ───────────────────────────────────────────────

test('createUser: CUSTOMER context cannot create accounts even with SUPER_ADMIN role', async () => {
  resetMocks();
  await assert.rejects(
    () => createUser(
      { phone: '09120000000', password: 'secret', type: 'COMPANY', companyId: 10 },
      caller({ roles: [SUPER_ADMIN_ROLE], accessType: 'CUSTOMER', permissions: ['*'] })
    ),
    (err) => err.statusCode === 403 && err.code === 'STAFF_CONTEXT_REQUIRED',
  );
  assert.equal(calls.userCreate.length, 0);
});

test('createUser: COMPANY callers cannot create users even inside their own company', async () => {
  resetMocks();

  await assert.rejects(
    () => createUser(
      { email: 'new@x.com', phone: '09120000000', password: 'p', companyId: 10, type: 'COMPANY' },
      caller({ accessType: 'COMPANY', companyId: 10, permissions: ['users.create'] })
    ),
    (err) => err.statusCode === 403 && err.code === 'COMPANY_USER_MANAGEMENT_RESTRICTED',
  );
  assert.equal(calls.userCreate.length, 0);
});

test('createUser: rejects a missing phone (phone required)', async () => {
  resetMocks();
  fx.userByEmail = null;

  await assert.rejects(
    () => createUser({ email: 'x@x.com', password: 'p' }, caller({ roles: [SUPER_ADMIN_ROLE] })),
    (err) => {
      assert.equal(err.statusCode, 400);
      assert.equal(err.code, 'PHONE_REQUIRED');
      return true;
    }
  );
});

test('createUser: rejects a duplicate email before touching passwords/roles', async () => {
  resetMocks();
  fx.userByEmail = { id: 1 };

  await assert.rejects(
    () => createUser({ email: 'dup@x.com', phone: '09120000000', password: 'p' }, caller({ roles: [SUPER_ADMIN_ROLE] })),
    (err) => {
      assert.equal(err.statusCode, 409);
      assert.equal(err.code, 'DUPLICATE_EMAIL');
      return true;
    }
  );
});

test('createUser: rejects a duplicate phone', async () => {
  resetMocks();
  fx.userByEmail = null;
  fx.userByPhone = { id: 1 };

  await assert.rejects(
    () => createUser({ email: 'x@x.com', phone: '0912', password: 'p' }, caller({ roles: [SUPER_ADMIN_ROLE] })),
    (err) => {
      assert.equal(err.code, 'DUPLICATE_PHONE');
      return true;
    }
  );
});

test('createUser: COMPANY type without a companyId is rejected', async () => {
  resetMocks();
  fx.userByEmail = null;

  await assert.rejects(
    () => createUser({ email: 'x@x.com', phone: '09120000000', password: 'p', type: 'COMPANY' }, caller({ roles: [SUPER_ADMIN_ROLE] })),
    (err) => {
      assert.equal(err.code, 'COMPANY_REQUIRED');
      return true;
    }
  );
});

test('createUser: a COMPANY-scoped caller cannot assign a non-COMPANY-scope role (privilege escalation guard)', async () => {
  resetMocks();
  fx.userByEmail = null;
  fx.roles = [{ id: 1, name: 'SUPER_ADMIN', scope: 'GLOBAL' }];

  await assert.rejects(
    () =>
      createUser(
        { email: 'x@x.com', phone: '09120000000', password: 'p', roleIds: [1] },
        caller({ accessType: 'COMPANY', companyId: 10 })
      ),
    (err) => {
      assert.equal(err.statusCode, 403);
      assert.equal(err.code, 'ROLE_OUT_OF_SCOPE');
      return true;
    }
  );
});

test('createUser: an invalid role id (not found in DB) is rejected', async () => {
  resetMocks();
  fx.userByEmail = null;
  fx.roles = []; // none of the requested ids exist

  await assert.rejects(
    () => createUser({ email: 'x@x.com', phone: '09120000000', password: 'p', roleIds: [999] }, caller({ roles: [SUPER_ADMIN_ROLE] })),
    (err) => {
      assert.equal(err.code, 'INVALID_ROLE');
      return true;
    }
  );
});

test('createUser: hashes the password before persisting', async () => {
  resetMocks();
  fx.userByEmail = null;
  fx.userById = dbUser({ id: 100 });

  await createUser({ email: 'x@x.com', phone: '09120000000', password: 'plaintext' }, caller({ roles: [SUPER_ADMIN_ROLE] }));

  assert.equal(calls.userCreate[0].data.passwordHash, 'hashed(plaintext)');
});

// ── updateUser ───────────────────────────────────────────────

test('updateUser: COMPANY callers cannot edit user details even within their own company', async () => {
  resetMocks();
  fx.userById = dbUser({ accessProfile: { type: 'COMPANY', companyId: 10 } });
  await assert.rejects(
    () => updateUser(5, { firstName: 'Changed' }, caller({ accessType: 'COMPANY', companyId: 10, permissions: ['users.update'] })),
    (err) => err.statusCode === 403 && err.code === 'COMPANY_USER_MANAGEMENT_RESTRICTED',
  );
  assert.equal(calls.userUpdate.length, 0);
});

test('updateUser: a non-admin caller from a different company is rejected (403)', async () => {
  resetMocks();
  fx.userById = dbUser({ accessProfile: { companyId: 10 } });

  await assert.rejects(
    () => updateUser(5, { email: 'new@x.com' }, caller({ roles: ['COMPANY_ADMIN'], companyId: 999 })),
    (err) => {
      assert.equal(err.statusCode, 403);
      return true;
    }
  );
});

test('updateUser: changing panel access requires the matching activate/deactivate permission', async () => {
  resetMocks();
  fx.userById = dbUser({ accessProfile: { id: 1, type: 'COMPANY', companyId: 10, isActive: true } });

  await assert.rejects(
    () => updateUser(5, { isAccessActive: false }, caller({ roles: ['STAFF_EDITOR'], companyId: 10, permissions: ['users.update'] })),
    (err) => err.statusCode === 403 && err.code === 'PERMISSION_REQUIRED',
  );
  assert.equal(calls.accessProfileUpsert.length, 0);
});

test('updateUser: panel access can be changed with the specific deactivate permission', async () => {
  resetMocks();
  fx.userById = dbUser({ accessProfile: { id: 1, type: 'COMPANY', companyId: 10, isActive: true } });

  await updateUser(5, { isAccessActive: false }, caller({
    roles: ['STAFF_EDITOR'], companyId: 10, permissions: ['users.update', 'users.deactivate'],
  }));

  assert.equal(calls.accessProfileUpsert[0].update.isActive, false);
});

test('updateUser: only a SUPER_ADMIN may change companyId/type', async () => {
  resetMocks();
  fx.userById = dbUser({ accessProfile: { companyId: 10 } });

  await updateUser(5, { companyId: '20', type: 'COMPANY' }, caller({ roles: ['COMPANY_ADMIN'], companyId: 10 }));

  // Non-admin: no accessProfile upsert should have been issued for the company change.
  assert.equal(calls.accessProfileUpsert.length, 0);
});

test('updateUser: a SUPER_ADMIN can move a user to a different company via companyId', async () => {
  resetMocks();
  fx.userById = dbUser({ accessProfile: { companyId: 10 } });

  await updateUser(5, { companyId: '20' }, caller({ roles: [SUPER_ADMIN_ROLE] }));

  assert.equal(calls.accessProfileUpsert.length, 1);
  assert.equal(calls.accessProfileUpsert[0].update.companyId, 20);
});

test('updateUser: throws NOT_FOUND for an unknown user', async () => {
  resetMocks();
  fx.userById = null;

  await assert.rejects(
    () => updateUser(999, {}, caller({ roles: [SUPER_ADMIN_ROLE] })),
    (err) => {
      assert.equal(err.code, 'NOT_FOUND');
      return true;
    }
  );
});

// ── setUserAccess ────────────────────────────────────────────

test('setUserAccess: rejects an unknown user', async () => {
  resetMocks();
  fx.userById = null;

  await assert.rejects(
    () => setUserAccess(999, 1, [], caller({ roles: [SUPER_ADMIN_ROLE] })),
    (err) => {
      assert.equal(err.code, 'NOT_FOUND');
      return true;
    }
  );
});

test('setUserAccess: a non-admin caller cannot touch another company\'s user', async () => {
  resetMocks();
  fx.userById = dbUser({ accessProfile: { companyId: 10 } });

  await assert.rejects(
    () => setUserAccess(5, 1, [], caller({ roles: ['COMPANY_ADMIN'], companyId: 999 })),
    (err) => {
      assert.equal(err.statusCode, 403);
      return true;
    }
  );
});

test('setUserAccess: COMPANY callers cannot change roles or permissions at all', async () => {
  resetMocks();
  fx.userById = dbUser({ accessProfile: { type: 'COMPANY', companyId: 10 } });
  await assert.rejects(
    () => setUserAccess(5, 1, [], caller({ accessType: 'COMPANY', companyId: 10, permissions: ['users.assign_roles'] })),
    (err) => err.statusCode === 403 && err.code === 'COMPANY_USER_MANAGEMENT_RESTRICTED',
  );
  assert.equal(calls.userRoleCreate.length, 0);
});

test('setUserAccess: an invalid roleId is rejected', async () => {
  resetMocks();
  fx.userById = dbUser({ accessProfile: { companyId: 10 } });
  fx.role = null;

  await assert.rejects(
    () => setUserAccess(5, 999, [], caller({ roles: [SUPER_ADMIN_ROLE] })),
    (err) => {
      assert.equal(err.code, 'INVALID_ROLE');
      return true;
    }
  );
});

test('setUserAccess: assigning a role to a PENDING user activates them', async () => {
  resetMocks();
  fx.userById = dbUser({ accessProfile: { companyId: 10 }, status: 'PENDING' });
  fx.role = { id: 1, scope: 'COMPANY' };

  await setUserAccess(5, 1, [], caller({ roles: [SUPER_ADMIN_ROLE] }));

  const txArg = calls.transaction[calls.transaction.length - 1];
  assert.ok(Array.isArray(txArg));
  // First element of the batch should be the status->ACTIVE update.
  assert.equal(calls.userUpdate[0].data.status, 'ACTIVE');
});

test('setUserAccess: clearing the role (roleId=null) removes assignment without creating a new one', async () => {
  resetMocks();
  fx.userById = dbUser({ accessProfile: { companyId: 10 } });

  await setUserAccess(5, null, [], caller({ roles: [SUPER_ADMIN_ROLE] }));

  assert.equal(calls.userRoleDeleteMany.length, 1);
  assert.equal(calls.userRoleCreate.length, 0);
});

// ── deleteUser ───────────────────────────────────────────────

test('deleteUser: COMPANY callers cannot delete users in their own company', async () => {
  resetMocks();
  fx.userById = dbUser({ accessProfile: { type: 'COMPANY', companyId: 10 }, roles: [] });
  await assert.rejects(
    () => deleteUser(5, caller({ id: 1, accessType: 'COMPANY', companyId: 10, permissions: ['users.delete'] })),
    (err) => err.statusCode === 403 && err.code === 'COMPANY_USER_MANAGEMENT_RESTRICTED',
  );
  assert.equal(calls.userDelete.length, 0);
});

test('deleteUser: cannot delete your own account', async () => {
  resetMocks();

  await assert.rejects(
    () => deleteUser(5, caller({ id: 5, roles: [SUPER_ADMIN_ROLE] })),
    (err) => {
      assert.equal(err.code, 'CANNOT_DELETE_SELF');
      return true;
    }
  );
});

test('deleteUser: rejects a non-admin caller targeting another company\'s user', async () => {
  resetMocks();
  fx.userById = { id: 5, accessProfile: { companyId: 10 }, roles: [] };

  await assert.rejects(
    () => deleteUser(5, caller({ id: 1, roles: ['COMPANY_ADMIN'], companyId: 999 })),
    (err) => {
      assert.equal(err.statusCode, 403);
      return true;
    }
  );
});

test('deleteUser: refuses to delete the last SUPER_ADMIN', async () => {
  resetMocks();
  fx.userById = {
    id: 5,
    accessProfile: { companyId: null },
    roles: [{ role: { name: SUPER_ADMIN_ROLE } }],
  };
  fx.superAdminCount = 1;

  await assert.rejects(
    () => deleteUser(5, caller({ id: 1, roles: [SUPER_ADMIN_ROLE] })),
    (err) => {
      assert.equal(err.code, 'LAST_SUPER_ADMIN');
      return true;
    }
  );
});

test('deleteUser: allows deleting a SUPER_ADMIN when others remain', async () => {
  resetMocks();
  fx.userById = {
    id: 5,
    accessProfile: { companyId: null },
    roles: [{ role: { name: SUPER_ADMIN_ROLE } }],
  };
  fx.superAdminCount = 2;

  const result = await deleteUser(5, caller({ id: 1, roles: [SUPER_ADMIN_ROLE] }));
  assert.equal(calls.userDelete.length, 1);
  assert.ok(result.message);
});

test('deleteUser: throws NOT_FOUND for an unknown user', async () => {
  resetMocks();
  fx.userById = null;

  await assert.rejects(
    () => deleteUser(999, caller({ id: 1, roles: [SUPER_ADMIN_ROLE] })),
    (err) => {
      assert.equal(err.code, 'NOT_FOUND');
      return true;
    }
  );
});

// ── setAccessActive ──────────────────────────────────────────

test('setAccessActive: cannot activate/deactivate your own access', async () => {
  resetMocks();

  await assert.rejects(
    () => setAccessActive(5, false, caller({ id: 5, roles: [SUPER_ADMIN_ROLE] })),
    (err) => {
      assert.equal(err.code, 'CANNOT_SELF_MODIFY');
      return true;
    }
  );
});

test('setAccessActive: rejects a user with no AccessProfile', async () => {
  resetMocks();
  fx.userById = { id: 5, accessProfile: null };

  await assert.rejects(
    () => setAccessActive(5, false, caller({ id: 1, roles: [SUPER_ADMIN_ROLE] })),
    (err) => {
      assert.equal(err.code, 'NO_ACCESS_PROFILE');
      return true;
    }
  );
});

test('setAccessActive: a non-admin caller cannot toggle another company\'s user', async () => {
  resetMocks();
  fx.userById = { id: 5, accessProfile: { id: 1, companyId: 10 } };

  await assert.rejects(
    () => setAccessActive(5, false, caller({ id: 1, roles: ['COMPANY_ADMIN'], companyId: 999 })),
    (err) => {
      assert.equal(err.statusCode, 403);
      return true;
    }
  );
});

test('setAccessActive: COMPANY SUPER_ADMIN cannot toggle another company user', async () => {
  resetMocks();
  fx.userById = dbUser({ accessProfile: { id: 1, type: 'COMPANY', companyId: 20 } });
  await assert.rejects(
    () => setAccessActive(5, false, caller({ id: 1, roles: [SUPER_ADMIN_ROLE], accessType: 'COMPANY', companyId: 10 })),
    (err) => err.statusCode === 403 && err.code === 'FORBIDDEN',
  );
  assert.equal(calls.accessProfileUpdate.length, 0);
});

test('setAccessActive: COMPANY can toggle a user in its own company', async () => {
  resetMocks();
  fx.userById = dbUser({ accessProfile: { id: 1, type: 'COMPANY', companyId: 10 } });
  await setAccessActive(5, false, caller({ id: 1, accessType: 'COMPANY', companyId: 10, permissions: ['users.deactivate'] }));
  assert.equal(calls.accessProfileUpdate[0].data.isActive, false);
});

test('setAccessActive: users.activate alone cannot deactivate a user', async () => {
  resetMocks();
  fx.userById = dbUser({ accessProfile: { id: 1, type: 'COMPANY', companyId: 10 } });

  await assert.rejects(
    () => setAccessActive(5, false, caller({ id: 1, companyId: 10, permissions: ['users.activate'] })),
    (err) => err.statusCode === 403 && err.code === 'PERMISSION_REQUIRED',
  );
  assert.equal(calls.accessProfileUpdate.length, 0);
});

test('setAccessActive: SUPER_ADMIN can deactivate a user in any company', async () => {
  resetMocks();
  fx.userById = dbUser({ accessProfile: { id: 1, companyId: 10 } });

  await setAccessActive(5, false, caller({ id: 1, roles: [SUPER_ADMIN_ROLE] }));

  assert.equal(calls.accessProfileUpdate[0].data.isActive, false);
});

// ── moveUserToCompany ────────────────────────────────────────

test('moveUserToCompany: rejects a non-SUPER_ADMIN caller', async () => {
  resetMocks();

  await assert.rejects(
    () => moveUserToCompany(5, 20, caller({ roles: ['COMPANY_ADMIN'] })),
    (err) => {
      assert.equal(err.statusCode, 403);
      return true;
    }
  );
});

test('moveUserToCompany: COMPANY context cannot move users even with a SUPER_ADMIN role', async () => {
  resetMocks();
  await assert.rejects(
    () => moveUserToCompany(5, 20, caller({ roles: [SUPER_ADMIN_ROLE], accessType: 'COMPANY', companyId: 10 })),
    (err) => err.statusCode === 403 && err.code === 'COMPANY_USER_MANAGEMENT_RESTRICTED',
  );
  assert.equal(calls.accessProfileUpsert.length, 0);
});

test('moveUserToCompany: rejects a nonexistent target company', async () => {
  resetMocks();
  fx.company = null;

  await assert.rejects(
    () => moveUserToCompany(5, 999, caller({ roles: [SUPER_ADMIN_ROLE] })),
    (err) => {
      assert.equal(err.code, 'COMPANY_NOT_FOUND');
      return true;
    }
  );
});

test('moveUserToCompany: upserts the AccessProfile to the target company as type COMPANY', async () => {
  resetMocks();
  fx.company = { id: 20, name: 'ACME' };
  fx.userById = dbUser({ accessProfile: { companyId: 20 } });

  await moveUserToCompany(5, 20, caller({ roles: [SUPER_ADMIN_ROLE] }));

  assert.equal(calls.accessProfileUpsert.length, 1);
  assert.equal(calls.accessProfileUpsert[0].update.companyId, 20);
  assert.equal(calls.accessProfileUpsert[0].update.type, 'COMPANY');
});