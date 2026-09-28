// =============================================================
// Unit tests — Auth service (login / register / registerCompany /
// refresh / logout / logoutAll / getMe / changePassword /
// changeUserPassword)
//
// Run with:  node --test
//
// These tests inject mock implementations into the module cache
// before loading the service, so no database, bcrypt or JWT
// library is required:
//   - config/db      -> mockPrisma (records calls, returns fixtures)
//   - config/env     -> plain config object
//   - utils/password -> controllable hashPassword / verifyPassword
//   - utils/token    -> controllable signAccessToken / signRefreshToken / ...
//   - utils/rbac     -> controllable loadUserAccess
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
  // require.cache is process-global — in newer Node versions test files
  // share a process by default, so a mock left here would leak into
  // whichever file runs next (e.g. utils/rbac.test.js needs the REAL
  // loadUserAccess this file replaces with a stub). Always restore.
  test.after(() => {
    if (original) require.cache[resolved] = original;
    else delete require.cache[resolved];
  });
  return resolved;
}

// ── Mock Prisma client ───────────────────────────────────────
const calls = {
  userFindUnique: [],
  userCreate: [],
  userUpdate: [],
  profileCreate: [],
  companyCreate: [],
  companyInquiryLimitCreate: [],
  accessProfileCreate: [],
  accessProfileFindUnique: [],
  userRoleCreate: [],
  refreshTokenDeleteMany: [],
  refreshTokenCreate: [],
  roleFindUnique: [],
  transaction: [],
};

// Each fixture below is reset in resetMocks() before every test.
let fx;

function resetMocks() {
  Object.keys(calls).forEach((k) => (calls[k] = []));
  fx = {
    userByEmail: null,        // prisma.user.findUnique({ where: { email } })
    userByPhone: null,        // prisma.user.findUnique({ where: { phone } })
    userById: null,           // prisma.user.findUnique({ where: { id } })
    companyByNationalId: null,
    accessProfile: null,      // prisma.accessProfile.findUnique
    refreshTokenDeleteCount: 1,
    createdUser: { id: 100, email: 'new@example.com', phone: '09120000000', status: 'ACTIVE' },
    createdCompany: { id: 200, name: 'ACME' },
    createdAccessProfile: { id: 300, type: 'COMPANY', companyId: 200, isActive: false },
    role: { id: 5, name: 'CUSTOMER_USER' },
  };
}
resetMocks();

const mockPrisma = {
  user: {
    findUnique: async (args) => {
      calls.userFindUnique.push(args);
      if (args.where.email !== undefined) return fx.userByEmail;
      if (args.where.phone !== undefined) return fx.userByPhone;
      if (args.where.id !== undefined) return fx.userById;
      return null;
    },
    create: async (args) => {
      calls.userCreate.push(args);
      return fx.createdUser;
    },
    update: async (args) => {
      calls.userUpdate.push(args);
      return { ...fx.userById, ...args.data };
    },
  },
  profile: {
    create: async (args) => {
      calls.profileCreate.push(args);
      return { id: 1, ...args.data };
    },
    findUnique: async () => null,
  },
  company: {
    findUnique: async (args) => {
      return fx.companyByNationalId;
    },
    create: async (args) => {
      calls.companyCreate.push(args);
      return fx.createdCompany;
    },
  },
  companyInquiryLimit: {
    create: async (args) => {
      calls.companyInquiryLimitCreate.push(args);
      return {};
    },
  },
  accessProfile: {
    create: async (args) => {
      calls.accessProfileCreate.push(args);
      return fx.createdAccessProfile;
    },
    findUnique: async (args) => {
      calls.accessProfileFindUnique.push(args);
      return fx.accessProfile;
    },
  },
  role: {
    findUnique: async (args) => {
      calls.roleFindUnique.push(args);
      return fx.role;
    },
  },
  userRole: {
    create: async (args) => {
      calls.userRoleCreate.push(args);
      return {};
    },
  },
  refreshToken: {
    deleteMany: async (args) => {
      calls.refreshTokenDeleteMany.push(args);
      return { count: fx.refreshTokenDeleteCount };
    },
    create: async (args) => {
      calls.refreshTokenCreate.push(args);
      return { id: 1, ...args.data };
    },
  },
  $transaction: async (arg) => {
    calls.transaction.push(arg);
    // auth.service uses both styles:
    //   prisma.$transaction([p1, p2])         -> array of already-started promises
    //   prisma.$transaction(async (tx) => {}) -> callback receiving a tx client
    if (Array.isArray(arg)) {
      return Promise.all(arg);
    }
    return arg(mockPrisma);
  },
};

injectMock('../../config/db', mockPrisma);

injectMock('../../config/env', {
  jwtAccessExpiresIn: '15m',
  jwtRefreshExpiresIn: '7d',
});

// ── Mock utils/password ──────────────────────────────────────
let nextVerifyPasswordResult = true;
const passwordCalls = { verify: [], hash: [] };
injectMock('../../utils/password', {
  hashPassword: async (plain) => {
    passwordCalls.hash.push(plain);
    return `hashed:${plain}`;
  },
  verifyPassword: async (plain, hash) => {
    passwordCalls.verify.push({ plain, hash });
    return nextVerifyPasswordResult;
  },
});

// ── Mock utils/token ──────────────────────────────────────────
const tokenCalls = { signAccess: [], signRefresh: [] };
injectMock('../../utils/token', {
  signAccessToken: (fastify, payload) => {
    tokenCalls.signAccess.push(payload);
    return `access-token-for-${payload.id}`;
  },
  signRefreshToken: (fastify, userId) => {
    tokenCalls.signRefresh.push(userId);
    return `refresh-token-for-${userId}`;
  },
  hashRefreshToken: (token) => `hashed:${token}`,
  getRefreshTokenExpiry: () => new Date('2099-01-01T00:00:00.000Z'),
});

// ── Mock utils/rbac ────────────────────────────────────────────
let nextAccess = { roles: [], permissions: [] };
injectMock('../../utils/rbac', {
  SUPER_ADMIN_ROLE: 'SUPER_ADMIN',
  loadUserAccess: async () => nextAccess,
});

// Now load the real service — it will pick up every mock above.
const authService = require('./auth.service');

const fakeFastify = { jwt: { sign: () => 'unused-in-tests' } };

function baseResetAll() {
  resetMocks();
  nextVerifyPasswordResult = true;
  nextAccess = { roles: [], permissions: [] };
  passwordCalls.verify = [];
  passwordCalls.hash = [];
  tokenCalls.signAccess = [];
  tokenCalls.signRefresh = [];
}

// ── login (phone only) ───────────────────────────────────────

test('login: rejects with INVALID_CREDENTIALS when the user does not exist', async () => {
  baseResetAll();
  fx.userByPhone = null;
  await assert.rejects(
    () => authService.login(fakeFastify, '09120000000', 'pw'),
    (err) => err.statusCode === 401 && err.code === 'INVALID_CREDENTIALS',
  );
});

test('login: rejects PENDING accounts with ACCOUNT_PENDING', async () => {
  baseResetAll();
  fx.userByPhone = { id: 1, phone: '09120000000', status: 'PENDING', passwordHash: 'h' };
  await assert.rejects(
    () => authService.login(fakeFastify, '09120000000', 'pw'),
    (err) => err.statusCode === 403 && err.code === 'ACCOUNT_PENDING',
  );
});

test('login: rejects REJECTED accounts with ACCOUNT_REJECTED', async () => {
  baseResetAll();
  fx.userByPhone = { id: 1, phone: '09120000000', status: 'REJECTED', passwordHash: 'h' };
  await assert.rejects(
    () => authService.login(fakeFastify, '09120000000', 'pw'),
    (err) => err.statusCode === 403 && err.code === 'ACCOUNT_REJECTED',
  );
});

test('login: rejects a wrong password with INVALID_CREDENTIALS (no user enumeration)', async () => {
  baseResetAll();
  fx.userByPhone = { id: 1, phone: '09120000000', status: 'ACTIVE', passwordHash: 'h' };
  nextVerifyPasswordResult = false;
  await assert.rejects(
    () => authService.login(fakeFastify, '09120000000', 'wrong'),
    (err) => err.statusCode === 401 && err.code === 'INVALID_CREDENTIALS',
  );
});

test('login: rejects a deactivated STAFF AccessProfile with ACCESS_DISABLED', async () => {
  baseResetAll();
  fx.userByPhone = { id: 1, phone: '09120000000', status: 'ACTIVE', passwordHash: 'h' };
  fx.userById = { id: 1, phone: '09120000000', status: 'ACTIVE' };
  fx.accessProfile = { id: 1, type: 'STAFF', companyId: null, isActive: false };
  nextAccess = { roles: ['ADMIN'], permissions: ['users.read'] };
  await assert.rejects(
    () => authService.login(fakeFastify, '09120000000', 'pw'),
    (err) => err.statusCode === 403 && err.code === 'ACCESS_DISABLED',
  );
});

test('login: does NOT gate a deactivated CUSTOMER access (no panel)', async () => {
  baseResetAll();
  fx.userByPhone = { id: 1, phone: '09120000000', status: 'ACTIVE', passwordHash: 'h' };
  fx.userById = { id: 1, phone: '09120000000', status: 'ACTIVE' };
  fx.accessProfile = null; // customers have no AccessProfile
  nextAccess = { roles: ['CUSTOMER_USER'], permissions: [] };
  const result = await authService.login(fakeFastify, '09120000000', 'pw');
  assert.equal(result.accessToken, 'access-token-for-1');
});

test('login: app="admin" rejects a non-STAFF access type with APP_ACCESS_DENIED', async () => {
  baseResetAll();
  fx.userByPhone = { id: 1, phone: '09120000000', status: 'ACTIVE', passwordHash: 'h' };
  fx.userById = { id: 1, phone: '09120000000', status: 'ACTIVE' };
  fx.accessProfile = { id: 1, type: 'COMPANY', companyId: 10, isActive: true };
  nextAccess = { roles: ['COMPANY_ADMIN'], permissions: [] };
  await assert.rejects(
    () => authService.login(fakeFastify, '09120000000', 'pw', 'admin'),
    (err) => err.statusCode === 403 && err.code === 'APP_ACCESS_DENIED',
  );
});

test('login: app="company" rejects a non-COMPANY access type with APP_ACCESS_DENIED', async () => {
  baseResetAll();
  fx.userByPhone = { id: 1, phone: '09120000000', status: 'ACTIVE', passwordHash: 'h' };
  fx.userById = { id: 1, phone: '09120000000', status: 'ACTIVE' };
  fx.accessProfile = { id: 1, type: 'STAFF', companyId: null, isActive: true };
  nextAccess = { roles: ['ADMIN'], permissions: [] };
  await assert.rejects(
    () => authService.login(fakeFastify, '09120000000', 'pw', 'company'),
    (err) => err.statusCode === 403 && err.code === 'APP_ACCESS_DENIED',
  );
});

test('login: SUPER_ADMIN bypasses the app-type guard entirely', async () => {
  baseResetAll();
  fx.userByPhone = { id: 1, phone: '09120000000', status: 'ACTIVE', passwordHash: 'h' };
  fx.userById = { id: 1, phone: '09120000000', status: 'ACTIVE' };
  fx.accessProfile = null;
  nextAccess = { roles: ['SUPER_ADMIN'], permissions: ['*'] };
  const result = await authService.login(fakeFastify, '09120000000', 'pw', 'company');
  assert.equal(result.accessToken, 'access-token-for-1');
});

test('login: succeeds and returns token pair + expiresIn for a valid ACTIVE user', async () => {
  baseResetAll();
  fx.userByPhone = { id: 42, phone: '09120000000', status: 'ACTIVE', passwordHash: 'h' };
  fx.userById = { id: 42, phone: '09120000000', status: 'ACTIVE' };
  fx.accessProfile = null;
  nextAccess = { roles: ['CUSTOMER_USER'], permissions: [] };
  const result = await authService.login(fakeFastify, '09120000000', 'pw');
  assert.equal(result.accessToken, 'access-token-for-42');
  assert.equal(result.refreshToken, 'refresh-token-for-42');
  assert.equal(result.expiresIn, 15 * 60);
  // Old refresh tokens must be revoked before issuing a new one.
  assert.equal(calls.refreshTokenDeleteMany.length, 1);
  assert.equal(calls.refreshTokenDeleteMany[0].where.userId, 42);
  assert.equal(calls.refreshTokenCreate.length, 1);
});

test('login: trims phone before lookup', async () => {
  baseResetAll();
  fx.userByPhone = { id: 1, phone: '09120000000', status: 'ACTIVE', passwordHash: 'h' };
  fx.userById = { id: 1, phone: '09120000000', status: 'ACTIVE' };
  nextAccess = { roles: [], permissions: [] };
  await authService.login(fakeFastify, '  09120000000  ', 'pw');
  assert.equal(calls.userFindUnique[0].where.phone, '09120000000');
});

// ── refresh ──────────────────────────────────────────────────

test('refresh: rejects a missing token record', async () => {
  baseResetAll();
  await assert.rejects(
    () => authService.refresh(fakeFastify, null),
    (err) => err.statusCode === 401 && err.code === 'INVALID_REFRESH_TOKEN',
  );
});

test('refresh: rejects when the linked user is disabled', async () => {
  baseResetAll();
  await assert.rejects(
    () => authService.refresh(fakeFastify, { id: 1, user: { id: 5, status: 'REJECTED' } }),
    (err) => err.statusCode === 401 && err.code === 'USER_DISABLED',
  );
});

test('refresh: rejects a reused/already-deleted token', async () => {
  baseResetAll();
  fx.refreshTokenDeleteCount = 0;
  await assert.rejects(
    () => authService.refresh(fakeFastify, { id: 1, user: { id: 5, status: 'ACTIVE' } }),
    (err) => err.statusCode === 401 && err.code === 'REFRESH_TOKEN_REUSED',
  );
});

test('refresh: rejects a deactivated STAFF/COMPANY panel user', async () => {
  baseResetAll();
  fx.refreshTokenDeleteCount = 1;
  fx.accessProfile = { id: 1, type: 'COMPANY', companyId: 10, isActive: false };
  nextAccess = { roles: ['COMPANY_ADMIN'], permissions: [] };
  await assert.rejects(
    () => authService.refresh(fakeFastify, { id: 1, user: { id: 5, status: 'ACTIVE' } }),
    (err) => err.statusCode === 403 && err.code === 'ACCESS_DISABLED',
  );
});

test('refresh: rotates the token and returns a new pair', async () => {
  baseResetAll();
  fx.refreshTokenDeleteCount = 1;
  fx.accessProfile = null;
  nextAccess = { roles: ['CUSTOMER_USER'], permissions: [] };
  const result = await authService.refresh(fakeFastify, { id: 1, user: { id: 7, status: 'ACTIVE' } });
  assert.equal(result.accessToken, 'access-token-for-7');
  assert.equal(result.refreshToken, 'refresh-token-for-7');
  assert.equal(calls.refreshTokenCreate.length, 1);
});

// ── logout / logoutAll ──────────────────────────────────────

test('logout: revokes only the given refresh-token record', async () => {
  baseResetAll();
  await authService.logout(55);
  assert.equal(calls.refreshTokenDeleteMany[0].where.id, 55);
});

test('logoutAll: revokes every refresh token for the user', async () => {
  baseResetAll();
  await authService.logoutAll(9);
  assert.equal(calls.refreshTokenDeleteMany[0].where.userId, 9);
});

// ── getMe ────────────────────────────────────────────────────

test('getMe: throws NOT_FOUND when the user no longer exists', async () => {
  baseResetAll();
  fx.userById = null;
  await assert.rejects(
    () => authService.getMe(123),
    (err) => err.statusCode === 404 && err.code === 'NOT_FOUND',
  );
});

test('getMe: returns the assembled user context', async () => {
  baseResetAll();
  fx.userById = { id: 8, phone: '09120000000', status: 'ACTIVE' };
  nextAccess = { roles: ['CUSTOMER_USER'], permissions: [] };
  const result = await authService.getMe(8);
  assert.equal(result.user.id, 8);
  assert.deepEqual(result.roles, ['CUSTOMER_USER']);
});

// ── changePassword ───────────────────────────────────────────

test('changePassword: throws NOT_FOUND for an unknown user', async () => {
  baseResetAll();
  fx.userById = null;
  await assert.rejects(
    () => authService.changePassword(1, 'old', 'newpassword'),
    (err) => err.statusCode === 404 && err.code === 'NOT_FOUND',
  );
});

test('changePassword: rejects a wrong current password', async () => {
  baseResetAll();
  fx.userById = { id: 1, passwordHash: 'h' };
  nextVerifyPasswordResult = false;
  await assert.rejects(
    () => authService.changePassword(1, 'wrong', 'newpassword'),
    (err) => err.statusCode === 400 && err.code === 'WRONG_PASSWORD',
  );
});

test('changePassword: rejects reusing the same password', async () => {
  baseResetAll();
  fx.userById = { id: 1, passwordHash: 'h' };
  nextVerifyPasswordResult = true;
  await assert.rejects(
    () => authService.changePassword(1, 'samepassword', 'samepassword'),
    (err) => err.statusCode === 400 && err.code === 'SAME_PASSWORD',
  );
});

test('changePassword: rejects a weak new password (<8 chars)', async () => {
  baseResetAll();
  fx.userById = { id: 1, passwordHash: 'h' };
  nextVerifyPasswordResult = true;
  await assert.rejects(
    () => authService.changePassword(1, 'oldpassword', 'short'),
    (err) => err.statusCode === 400 && err.code === 'WEAK_PASSWORD',
  );
});

test('changePassword: succeeds and revokes all refresh tokens', async () => {
  baseResetAll();
  fx.userById = { id: 1, passwordHash: 'h' };
  nextVerifyPasswordResult = true;
  await authService.changePassword(1, 'oldpassword', 'newpassword');
  assert.equal(calls.transaction.length, 1);
  assert.equal(calls.userUpdate.length, 1);
  assert.equal(calls.refreshTokenDeleteMany.length, 1);
  assert.equal(calls.refreshTokenDeleteMany[0].where.userId, 1);
});

// ── changeUserPassword (admin action) ───────────────────────

test('changeUserPassword: throws NOT_FOUND for an unknown target user', async () => {
  baseResetAll();
  fx.userById = null;
  await assert.rejects(
    () => authService.changeUserPassword(999, 'newpassword'),
    (err) => err.statusCode === 404 && err.code === 'NOT_FOUND',
  );
});

test('changeUserPassword: rejects a weak new password', async () => {
  baseResetAll();
  fx.userById = { id: 2 };
  await assert.rejects(
    () => authService.changeUserPassword(2, 'short'),
    (err) => err.statusCode === 400 && err.code === 'WEAK_PASSWORD',
  );
});

test('changeUserPassword: succeeds without requiring the current password', async () => {
  baseResetAll();
  fx.userById = { id: 2 };
  await authService.changeUserPassword(2, 'brandnewpassword');
  assert.equal(calls.userUpdate.length, 1);
  assert.equal(calls.refreshTokenDeleteMany[0].where.userId, 2);
});

// ── register (customer) — phone required, email optional ────

test('register: rejects missing required fields (phone required)', async () => {
  baseResetAll();
  await assert.rejects(
    () => authService.register({ email: 'a@a.com', password: 'password1', firstName: 'A', lastName: 'B' }),
    (err) => err.statusCode === 400 && err.code === 'VALIDATION_ERROR',
  );
});

test('register: rejects a weak password', async () => {
  baseResetAll();
  await assert.rejects(
    () => authService.register({ phone: '09120000000', password: 'short', firstName: 'A', lastName: 'B' }),
    (err) => err.statusCode === 400 && err.code === 'WEAK_PASSWORD',
  );
});

test('register: rejects a duplicate phone', async () => {
  baseResetAll();
  fx.userByPhone = { id: 2 };
  await assert.rejects(
    () => authService.register({
      phone: '09120000000', password: 'password1', firstName: 'A', lastName: 'B',
    }),
    (err) => err.statusCode === 409 && err.code === 'DUPLICATE_PHONE',
  );
});

test('register: rejects a duplicate email when provided', async () => {
  baseResetAll();
  fx.userByPhone = null;
  fx.userByEmail = { id: 1 };
  await assert.rejects(
    () => authService.register({
      phone: '09120000000', email: 'dup@a.com', password: 'password1', firstName: 'A', lastName: 'B',
    }),
    (err) => err.statusCode === 409 && err.code === 'DUPLICATE_EMAIL',
  );
});

test('register: creates a CUSTOMER_USER with no AccessProfile (email optional)', async () => {
  baseResetAll();
  fx.userByPhone = null;
  fx.userByEmail = null;
  fx.role = { id: 5, name: 'CUSTOMER_USER' };
  const result = await authService.register({
    phone: '09120000000', password: 'password1', firstName: 'A', lastName: 'B',
  });
  assert.deepEqual(result.roles, ['CUSTOMER_USER']);
  assert.equal(result.accessProfile, null);
  assert.equal(calls.accessProfileCreate.length, 0);
  assert.equal(calls.userRoleCreate.length, 1);
  // phone is stored, email is null
  assert.equal(calls.userCreate[0].data.phone, '09120000000');
  assert.equal(calls.userCreate[0].data.email, null);
});

test('register: stores email when provided', async () => {
  baseResetAll();
  fx.userByPhone = null;
  fx.userByEmail = null;
  fx.role = { id: 5, name: 'CUSTOMER_USER' };
  await authService.register({
    phone: '09120000000', email: 'new@a.com', password: 'password1', firstName: 'A', lastName: 'B',
  });
  assert.equal(calls.userCreate[0].data.phone, '09120000000');
  assert.equal(calls.userCreate[0].data.email, 'new@a.com');
});

// ── registerCompany — manager phone required, email optional ─

const validCompanyPayload = {
  companyName: 'ACME', nationalId: '111', registrationNumber: '222',
  companyEmail: 'c@acme.com', phone: '021', address: 'Tehran',
  managerPhone: '09120000000', password: 'password1',
  managerFirstName: 'M', managerLastName: 'N',
};

test('registerCompany: rejects missing company fields', async () => {
  baseResetAll();
  await assert.rejects(
    () => authService.registerCompany({ ...validCompanyPayload, companyName: undefined }),
    (err) => err.statusCode === 400 && err.code === 'VALIDATION_ERROR',
  );
});

test('registerCompany: rejects missing manager phone (required)', async () => {
  baseResetAll();
  await assert.rejects(
    () => authService.registerCompany({ ...validCompanyPayload, managerPhone: undefined }),
    (err) => err.statusCode === 400 && err.code === 'VALIDATION_ERROR',
  );
});

test('registerCompany: rejects a weak manager password', async () => {
  baseResetAll();
  await assert.rejects(
    () => authService.registerCompany({ ...validCompanyPayload, password: 'short' }),
    (err) => err.statusCode === 400 && err.code === 'WEAK_PASSWORD',
  );
});

test('registerCompany: rejects a duplicate nationalId', async () => {
  baseResetAll();
  fx.companyByNationalId = { id: 1 };
  await assert.rejects(
    () => authService.registerCompany(validCompanyPayload),
    (err) => err.statusCode === 409 && err.code === 'DUPLICATE_COMPANY',
  );
});

test('registerCompany: rejects a duplicate manager phone', async () => {
  baseResetAll();
  fx.companyByNationalId = null;
  fx.userByPhone = { id: 5 };
  await assert.rejects(
    () => authService.registerCompany(validCompanyPayload),
    (err) => err.statusCode === 409 && err.code === 'DUPLICATE_PHONE',
  );
});

test('registerCompany: rejects a duplicate manager email when provided', async () => {
  baseResetAll();
  fx.companyByNationalId = null;
  fx.userByPhone = null;
  fx.userByEmail = { id: 5 };
  await assert.rejects(
    () => authService.registerCompany({ ...validCompanyPayload, managerEmail: 'm@acme.com' }),
    (err) => err.statusCode === 409 && err.code === 'DUPLICATE_EMAIL',
  );
});

test('registerCompany: creates a PENDING company + inactive COMPANY access, no role assigned', async () => {
  baseResetAll();
  fx.companyByNationalId = null;
  fx.userByPhone = null;
  fx.userByEmail = null;
  const result = await authService.registerCompany(validCompanyPayload);

  assert.equal(calls.companyCreate[0].data.status, 'PENDING');
  assert.equal(calls.accessProfileCreate[0].data.isActive, false);
  assert.equal(calls.accessProfileCreate[0].data.type, 'COMPANY');
  assert.equal(calls.userRoleCreate.length, 0); // no role auto-assigned
  assert.equal(result.company.id, fx.createdCompany.id);
  assert.equal(result.accessProfile.id, fx.createdAccessProfile.id);
  // manager phone is stored, email is null
  assert.equal(calls.userCreate[0].data.phone, '09120000000');
  assert.equal(calls.userCreate[0].data.email, null);
});