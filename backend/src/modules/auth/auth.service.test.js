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
  userUpdateMany: [],
  profileCreate: [],
  profileUpsert: [],
  companyCreate: [],
  companyInquiryLimitCreate: [],
  accessProfileCreate: [],
  accessProfileFindUnique: [],
  userRoleCreate: [],
  refreshTokenDeleteMany: [],
  refreshTokenCreate: [],
  refreshTokenUpdateMany: [],
  roleFindUnique: [],
  auditLogCreate: [],
  transaction: [],
};

// Each fixture below is reset in resetMocks() before every test.
let fx = {
  userByEmail: null,
  userByPhone: null,
  userById: null,
  companyByNationalId: null,
  accessProfile: null,
  refreshTokenDeleteCount: 1,
  createdUser: { id: 100, email: 'new@example.com', phone: '09120000000', status: 'ACTIVE' },
  createdCompany: { id: 200, name: 'ACME' },
  createdAccessProfile: { id: 300, type: 'COMPANY', companyId: 200, isActive: false },
  role: { id: 5, name: 'CUSTOMER_USER' },
};

function resetMocks() {
  Object.keys(calls).forEach((k) => (calls[k] = []));
  fx.userByEmail = null;
  fx.userByPhone = null;
  fx.userById = null;
  fx.companyByNationalId = null;
  fx.accessProfile = null;
  fx.refreshTokenDeleteCount = 1;
  fx.createdUser = { id: 100, email: 'new@example.com', phone: '09120000000', status: 'ACTIVE' };
  fx.createdCompany = { id: 200, name: 'ACME' };
  fx.createdAccessProfile = { id: 300, type: 'COMPANY', companyId: 200, isActive: false };
  fx.role = { id: 5, name: 'CUSTOMER_USER' };
}

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
    updateMany: async () => ({ count: 0 }),
  },
  profile: {
    create: async (args) => {
      calls.profileCreate.push(args);
      return { id: 1, ...args.data };
    },
    findUnique: async () => null,
    upsert: async () => ({}),
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
    updateMany: async () => ({ count: 0 }),
    findUnique: async (args) => {
      calls.refreshTokenFindUnique = calls.refreshTokenFindUnique || [];
      calls.refreshTokenFindUnique.push(args);
      return { id: args.where?.id, userId: 1 };
    },
  },
  authChallenge: {
    findMany: async () => [],
    count: async () => 0,
    updateMany: async () => ({ count: 0 }),
  },
  auditLog: {
    create: async (args) => {
      calls.auditLogCreate = calls.auditLogCreate || [];
      calls.auditLogCreate.push(args);
      return { id: 1 };
    },
  },
  role: {
    findUnique: async (args) => {
      calls.roleFindUnique.push(args);
      return fx.role;
    },
  },
  $transaction: async (arg) => {
    calls.transaction.push(arg);
    if (Array.isArray(arg)) {
      return Promise.all(arg);
    }
    const txMock = { ...mockPrisma };
    txMock.$transaction = async (innerArg) => {
      if (Array.isArray(innerArg)) {
        return Promise.all(innerArg);
      }
      return innerArg(txMock);
    };
    return arg(txMock);
  },
};

injectMock('../../config/db', mockPrisma);

injectMock('../../config/env', {
  jwtAccessExpiresIn: '15m',
  jwtRefreshExpiresIn: '7d',
});

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

let nextAccess = { roles: [], permissions: [] };
injectMock('../../utils/rbac', {
  SUPER_ADMIN_ROLE: 'SUPER_ADMIN',
  loadUserAccess: async () => nextAccess,
});

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
  assert.deepEqual(calls.auditLogCreate[0].data.metadata, { extra: { identifierType: 'PHONE', reason: 'USER_NOT_FOUND' } });
  assert.equal(JSON.stringify(calls.auditLogCreate[0].data.metadata).includes('09120000000'), false);
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

test('login: rejects with INVALID_CREDENTIALS when password is wrong', async () => {
  baseResetAll();
  fx.userByPhone = { id: 1, phone: '09120000000', status: 'ACTIVE', passwordHash: 'h' };
  nextVerifyPasswordResult = false;
  await assert.rejects(
    () => authService.login(fakeFastify, '09120000000', 'wrong'),
    (err) => err.statusCode === 401 && err.code === 'INVALID_CREDENTIALS',
  );
});

test('login: succeeds with correct phone + password', async () => {
  baseResetAll();
  fx.userByPhone = { id: 1, phone: '09120000000', status: 'ACTIVE', passwordHash: 'h', email: 'u@x.com' };
  fx.userById = { id: 1, phone: '09120000000', status: 'ACTIVE', email: 'u@x.com' };
  fx.accessProfile = { id: 1, type: 'CUSTOMER', companyId: null, isActive: true };
  nextVerifyPasswordResult = true;
  nextAccess = { roles: ['CUSTOMER_USER'], permissions: [] };
  const result = await authService.login(fakeFastify, '09120000000', 'correct');
  assert.ok(result.accessToken);
  assert.ok(result.refreshToken);
  assert.equal(result.user.id, 1);
  assert.equal(result.accessProfile.type, 'CUSTOMER');
});

test('login: trims the phone before passing it to the service', async () => {
  baseResetAll();
  fx.userByPhone = { id: 1, phone: '09120000000', status: 'ACTIVE', passwordHash: 'h', email: 'u@x.com' };
  fx.userById = { id: 1, phone: '09120000000', status: 'ACTIVE', email: 'u@x.com' };
  fx.accessProfile = { id: 1, type: 'CUSTOMER', companyId: null, isActive: true };
  nextVerifyPasswordResult = true;
  nextAccess = { roles: ['CUSTOMER_USER'], permissions: [] };
  await authService.login(fakeFastify, '  09120000000  ', 'pw');
  assert.equal(calls.userFindUnique[0].where.phone, '09120000000');
});

test('login: sets the refresh cookie with the correct security flags (dev: secure=false, sameSite=lax)', async () => {
  baseResetAll();
  fx.userByPhone = { id: 1, phone: '09120000000', status: 'ACTIVE', passwordHash: 'h', email: 'u@x.com' };
  fx.userById = { id: 1, phone: '09120000000', status: 'ACTIVE', email: 'u@x.com' };
  fx.accessProfile = { id: 1, type: 'CUSTOMER', companyId: null, isActive: true };
  nextVerifyPasswordResult = true;
  nextAccess = { roles: ['CUSTOMER_USER'], permissions: [] };
  const ctrl = require('./auth.controller');
  const reply = {
    setCookie: (name, value, opts) => { reply.cookieOpts = opts; },
    header: () => {},
    code: () => ({ send: (x) => x })
  };
  const request = { body: { phone: '09120000000', password: 'pw' }, server: fakeFastify, headers: { 'user-agent': 'test-agent' }, ip: '127.0.0.1', socket: { remoteAddress: '127.0.0.1' } };
  await ctrl.login(request, reply);
  assert.equal(reply.cookieOpts.httpOnly, true);
  assert.equal(reply.cookieOpts.secure, false);
  assert.equal(reply.cookieOpts.sameSite, 'lax');
  assert.equal(reply.cookieOpts.path, '/api/v1/auth');
});

// ── refresh / logout / logoutAll ──────────────────────────────

test('refresh: rejects missing/invalid token record', async () => {
  baseResetAll();
  await assert.rejects(
    () => authService.refresh(fakeFastify, null),
    (err) => err.statusCode === 401 && err.code === 'INVALID_REFRESH_TOKEN',
  );
});

test('refresh: rejects if user status is not ACTIVE', async () => {
  baseResetAll();
  const badUser = { id: 1, status: 'PENDING' };
  await assert.rejects(
    () => authService.refresh(fakeFastify, { user: badUser }),
    (err) => err.statusCode === 401 && err.code === 'USER_DISABLED',
  );
});

test('refresh: rejects reused/already-deleted token', async () => {
  baseResetAll();
  fx.refreshTokenDeleteCount = 0;
  await assert.rejects(
    () => authService.refresh(fakeFastify, { id: 1, user: { id: 1, status: 'ACTIVE' } }),
    (err) => err.statusCode === 401 && err.code === 'REFRESH_TOKEN_REUSED',
  );
  assert.equal(calls.auditLogCreate.at(-1).data.action, 'USER_SESSION_REFRESH_REUSE_DETECTED');
});

test('refresh: issues new access + refresh tokens and persists refresh', async () => {
  baseResetAll();
  fx.refreshTokenDeleteCount = 1;
  fx.accessProfile = { id: 1, type: 'CUSTOMER', companyId: null, isActive: true };
  nextAccess = { roles: ['CUSTOMER_USER'], permissions: [] };
  const result = await authService.refresh(fakeFastify, { id: 1, user: { id: 1, email: 'x@x.com', status: 'ACTIVE' } });
  assert.ok(result.accessToken);
  assert.ok(result.refreshToken);
  assert.equal(calls.refreshTokenCreate.length, 1);
  assert.ok(calls.refreshTokenDeleteMany.length >= 1);
  assert.equal(calls.auditLogCreate.at(-1).data.action, 'USER_SESSION_REFRESHED');
  assert.equal(calls.transaction.length, 1);
});

test('logout: removes the specified refresh token', async () => {
  baseResetAll();
  await authService.logout(42);
  assert.equal(calls.refreshTokenDeleteMany.length, 1);
  assert.equal(calls.refreshTokenDeleteMany[0].where.id, 42);
  assert.equal(calls.auditLogCreate[0].data.action, 'USER_LOGOUT');
  assert.equal(calls.auditLogCreate[0].data.actorUserId, 1);
  assert.equal(calls.transaction.length, 1);
});

test('logoutAll: removes all refresh tokens for the user', async () => {
  baseResetAll();
  await authService.logoutAll(99);
  assert.equal(calls.refreshTokenDeleteMany.length, 1);
  assert.equal(calls.refreshTokenDeleteMany[0].where.userId, 99);
  assert.equal(calls.auditLogCreate[0].data.action, 'USER_LOGOUT_ALL');
  assert.equal(calls.transaction.length, 1);
});

test('getMe: throws NOT_FOUND when user does not exist', async () => {
  baseResetAll();
  fx.userById = null;
  await assert.rejects(
    () => authService.getMe(999),
    (err) => err.statusCode === 404 && err.code === 'NOT_FOUND',
  );
});

test('getMe: returns user + profile + accessProfile + roles + permissions', async () => {
  baseResetAll();
  fx.userById = { id: 1, email: 'a@b.com', phone: '09120000000', status: 'ACTIVE' };
  fx.accessProfile = { id: 1, type: 'STAFF', companyId: 10, isActive: true };
  nextAccess = { roles: ['SUPER_ADMIN'], permissions: ['*'] };
  const result = await authService.getMe(1);
  assert.equal(result.user.id, 1);
  assert.equal(result.accessProfile.type, 'STAFF');
  assert.equal(result.roles[0], 'SUPER_ADMIN');
});

// ── changePassword / changeUserPassword ───────────────────────

test('changePassword: rejects wrong current password', async () => {
  baseResetAll();
  fx.userById = { id: 1, passwordHash: 'hashed:correct' };
  nextVerifyPasswordResult = false;
  await assert.rejects(
    () => authService.changePassword(1, 'wrong', 'newpassword123'),
    (err) => err.statusCode === 400 && err.code === 'WRONG_PASSWORD',
  );
});

test('changePassword: rejects same password', async () => {
  baseResetAll();
  fx.userById = { id: 1, passwordHash: 'hashed:correct' };
  await assert.rejects(
    () => authService.changePassword(1, 'correct', 'correct'),
    (err) => err.statusCode === 400 && err.code === 'SAME_PASSWORD',
  );
});

test('changePassword: rejects too-short new password', async () => {
  baseResetAll();
  fx.userById = { id: 1, passwordHash: 'hashed:correct' };
  await assert.rejects(
    () => authService.changePassword(1, 'correct', 'short'),
    (err) => err.statusCode === 400 && err.code === 'WEAK_PASSWORD',
  );
});

test('changePassword: updates hash and revokes all refresh tokens', async () => {
  baseResetAll();
  fx.userById = { id: 1, passwordHash: 'hashed:correct' };
  nextVerifyPasswordResult = true;
  await authService.changePassword(1, 'correct', 'newpassword123');
  assert.equal(calls.userUpdate.length, 1);
  assert.equal(calls.userUpdate[0].data.passwordHash, 'hashed:newpassword123');
  assert.equal(calls.refreshTokenDeleteMany.length, 1);
  assert.equal(calls.refreshTokenDeleteMany[0].where.userId, 1);
  assert.equal(calls.auditLogCreate[0].data.action, 'USER_PASSWORD_CHANGED');
  assert.equal(calls.transaction.length, 1);
});

test('changeUserPassword: rejects STAFF without the explicit reset permission', async () => {
  baseResetAll();
  await assert.rejects(
    () => authService.changeUserPassword(2, 'newpass', { accessType: 'STAFF', permissions: [] }),
    (err) => err.statusCode === 403 && err.code === 'PERMISSION_REQUIRED',
  );
});

test('changeUserPassword: throws NOT_FOUND for an unknown target user', async () => {
  baseResetAll();
  fx.userById = null;
  await assert.rejects(
    () => authService.changeUserPassword(2, 'newpass', { accessType: 'STAFF', permissions: ['users.reset_password'] }),
    (err) => err.statusCode === 404 && err.code === 'NOT_FOUND',
  );
});

test('changeUserPassword: rejects a weak new password', async () => {
  baseResetAll();
  fx.userById = { id: 2, passwordHash: 'h' };
  await assert.rejects(
    () => authService.changeUserPassword(2, 'weak', { accessType: 'STAFF', permissions: ['users.reset_password'] }),
    (err) => err.statusCode === 400 && err.code === 'WEAK_PASSWORD',
  );
});

test('changeUserPassword: succeeds without requiring the current password', async () => {
  baseResetAll();
  fx.userById = { id: 2, passwordHash: 'h' };
  await authService.changeUserPassword(2, 'newpassword123', { accessType: 'STAFF', permissions: ['users.reset_password'] });
  assert.equal(calls.userUpdate.length, 1);
  assert.equal(calls.userUpdate[0].data.passwordHash, 'hashed:newpassword123');
  assert.equal(calls.refreshTokenDeleteMany.length, 1);
});

// ── register / registerCompany ────────────────────────────────

const validPayload = { phone: '09120000000', password: 'password123', firstName: 'John', lastName: 'Doe', email: 'john@example.com' };

test('register: rejects missing required fields (phone required)', async () => {
  baseResetAll();
  await assert.rejects(
    () => authService.register({ password: 'password123', firstName: 'John', lastName: 'Doe' }),
    (err) => err.statusCode === 400 && err.code === 'VALIDATION_ERROR',
  );
});

test('register: rejects a weak password', async () => {
  baseResetAll();
  await assert.rejects(
    () => authService.register({ phone: '09120000000', password: 'weak', firstName: 'John', lastName: 'Doe' }),
    (err) => err.statusCode === 400 && err.code === 'WEAK_PASSWORD',
  );
});

test('register: rejects a duplicate phone', async () => {
  baseResetAll();
  fx.userByPhone = { id: 1 };
  await assert.rejects(
    () => authService.register(validPayload),
    (err) => err.statusCode === 409 && err.code === 'DUPLICATE_PHONE',
  );
});

test('register: rejects a duplicate email when provided', async () => {
  baseResetAll();
  fx.userByEmail = { id: 1 };
  await assert.rejects(
    () => authService.register(validPayload),
    (err) => err.statusCode === 409 && err.code === 'DUPLICATE_EMAIL',
  );
});

test('register: creates a CUSTOMER_USER with no AccessProfile (email optional)', async () => {
  baseResetAll();
  fx.userByPhone = null;
  fx.userByEmail = null;
  fx.createdUser = { id: 999, phone: '09120000000', status: 'ACTIVE' };
  fx.role = { id: 5, name: 'CUSTOMER_USER' };
  fx.createdUser = { id: 999, phone: '09120000000', status: 'ACTIVE' };
  const result = await authService.register({ phone: '09120000000', password: 'password123', firstName: 'John', lastName: 'Doe' });
  assert.equal(result.roles[0], 'CUSTOMER_USER');
  assert.equal(calls.accessProfileCreate.length, 0);
  assert.equal(calls.userRoleCreate.length, 1);
  assert.equal(calls.userRoleCreate[0].data.roleId, 5);
});

test('register: stores email when provided', async () => {
  baseResetAll();
  fx.userByPhone = null;
  fx.userByEmail = null;
  fx.createdUser = { id: 999, phone: '09120000000', email: 'john@example.com', status: 'ACTIVE' };
  const result = await authService.register({ phone: '09120000000', password: 'password123', firstName: 'John', lastName: 'Doe', email: 'john@example.com' });
  assert.equal(calls.userCreate[0].data.email, 'john@example.com');
});

const validCompanyPayload = {
  companyName: 'ACME', nationalId: '1234567890', registrationNumber: 'REG123',
  companyEmail: 'acme@acme.com', phone: '02122223333', address: 'Tehran',
  managerPhone: '09120000000', password: 'password123',
  managerFirstName: 'Ali', managerLastName: 'Rezaei',
};

test('registerCompany: rejects missing company fields', async () => {
  baseResetAll();
  await assert.rejects(
    () => authService.registerCompany({ companyName: 'ACME', phone: '02122223333' }),
    (err) => err.statusCode === 400 && err.code === 'VALIDATION_ERROR',
  );
});

test('registerCompany: rejects missing manager phone (required)', async () => {
  baseResetAll();
  await assert.rejects(
    () => authService.registerCompany({ ...validCompanyPayload, managerPhone: '' }),
    (err) => err.statusCode === 400 && err.code === 'VALIDATION_ERROR',
  );
});

test('registerCompany: rejects a weak manager password', async () => {
  baseResetAll();
  await assert.rejects(
    () => authService.registerCompany({ ...validCompanyPayload, password: 'weak' }),
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
  fx.userByPhone = { id: 1 };
  await assert.rejects(
    () => authService.registerCompany(validCompanyPayload),
    (err) => err.statusCode === 409 && err.code === 'DUPLICATE_PHONE',
  );
});

test('registerCompany: rejects a duplicate manager email when provided', async () => {
  baseResetAll();
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
  assert.equal(calls.accessProfileCreate.length, 1);
  assert.equal(calls.userRoleCreate.length, 0);
  assert.equal(result.company.id, fx.createdCompany.id);
  assert.equal(result.accessProfile.id, fx.createdAccessProfile.id);
  assert.equal(calls.userCreate[0].data.phone, '09120000000');
  assert.equal(calls.userCreate[0].data.email, null);
});