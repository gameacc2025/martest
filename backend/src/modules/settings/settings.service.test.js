// مسیر فایل: backend/src/modules/settings/settings.service.test.js
// =============================================================
// Unit tests — Settings service (getProfile / updateProfile /
// changePassword / uploadAvatar / deleteAvatar) — the authenticated
// user's own account settings, as opposed to admin user management
// (see modules/users/user.service.js for that).
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
  userFindUnique: [],
  profileUpsert: [],
  profileUpdate: [],
  userUpdate: [],
  refreshTokenDeleteMany: [],
  transaction: [],
};
let fx;
function resetMocks() {
  Object.keys(calls).forEach((k) => (calls[k] = []));
  fx = {
    userForProfile: null, // shape returned by getProfile's select
    userForPassword: null, // { passwordHash }
    verifyResult: true,
  };
}
resetMocks();

const mockPrisma = {
  user: {
    findUnique: async (args) => {
      calls.userFindUnique.push(args);
      // Distinguish the two different `select` shapes used by this service.
      if (args.select && 'passwordHash' in args.select) return fx.userForPassword;
      return fx.userForProfile;
    },
    update: async (args) => {
      calls.userUpdate.push(args);
      return {};
    },
  },
  profile: {
    upsert: async (args) => {
      calls.profileUpsert.push(args);
      return {};
    },
    update: async (args) => {
      calls.profileUpdate.push(args);
      return {};
    },
  },
  refreshToken: {
    deleteMany: async (args) => {
      calls.refreshTokenDeleteMany.push(args);
      return { count: 0 };
    },
  },
  $transaction: async (arg) => {
    calls.transaction.push(arg);
    if (Array.isArray(arg)) return Promise.all(arg);
    return arg(mockPrisma);
  },
};

injectMock('../../config/db', mockPrisma);

let passwordFx;
function resetPasswordFx() {
  passwordFx = { verifyResult: true, hashed: 'hashed-value' };
}
resetPasswordFx();

injectMock('../../utils/password', {
  verifyPassword: async () => passwordFx.verifyResult,
  hashPassword: async (pw) => `hashed(${pw})`,
});

const { getProfile, updateProfile, changePassword, uploadAvatar, deleteAvatar } = require('./settings.service');

// ── getProfile ───────────────────────────────────────────────

test('getProfile: throws a 404 AppError for an unknown user', async () => {
  resetMocks();
  fx.userForProfile = null;

  await assert.rejects(() => getProfile(999), (err) => {
    assert.equal(err.statusCode, 404);
    return true;
  });
});

test('getProfile: returns the assembled profile (identity + profile + accessProfile + roles)', async () => {
  resetMocks();
  fx.userForProfile = { id: 1, email: 'a@b.com', profile: {}, accessProfile: null, roles: [] };

  const result = await getProfile(1);
  assert.deepEqual(result, fx.userForProfile);
});

test('getProfile: selects the identity fields plus nested profile/accessProfile/roles (never passwordHash)', async () => {
  resetMocks();
  fx.userForProfile = { id: 1 };

  await getProfile(1);

  const select = calls.userFindUnique[0].select;
  assert.equal('passwordHash' in select, false);
  assert.ok(select.profile);
  assert.ok(select.accessProfile);
  assert.ok(select.roles);
});

// ── updateProfile ────────────────────────────────────────────

test('updateProfile: only forwards firstName/lastName/avatar to Profile.upsert', async () => {
  resetMocks();
  fx.userForProfile = { id: 1 };

  await updateProfile(1, { firstName: 'Ali', lastName: 'Rezaei', avatar: 'x.jpg', email: 'ignored@x.com' });

  const data = calls.profileUpsert[0];
  assert.deepEqual(data.update, { firstName: 'Ali', lastName: 'Rezaei', avatar: 'x.jpg' });
  assert.equal('email' in data.update, false, 'email must not be settable via updateProfile');
});

test('updateProfile: does not touch the DB at all when no updatable fields are provided', async () => {
  resetMocks();
  fx.userForProfile = { id: 1 };

  await updateProfile(1, { email: 'ignored@x.com' });

  assert.equal(calls.profileUpsert.length, 0);
});

test('updateProfile: returns the freshly-loaded profile after the update', async () => {
  resetMocks();
  fx.userForProfile = { id: 1, profile: { firstName: 'Ali' } };

  const result = await updateProfile(1, { firstName: 'Ali' });

  assert.deepEqual(result, fx.userForProfile);
});

// ── changePassword ───────────────────────────────────────────

test('changePassword: throws a 404 AppError for an unknown user', async () => {
  resetMocks();
  fx.userForPassword = null;

  await assert.rejects(() => changePassword(999, 'old', 'new'), (err) => {
    assert.equal(err.statusCode, 404);
    return true;
  });
});

test('changePassword: rejects an incorrect current password with 400', async () => {
  resetMocks();
  fx.userForPassword = { passwordHash: 'hash' };
  resetPasswordFx();
  passwordFx.verifyResult = false;

  await assert.rejects(() => changePassword(1, 'wrong', 'new'), (err) => {
    assert.equal(err.statusCode, 400);
    return true;
  });
  assert.equal(calls.transaction.length, 0, 'must not touch the DB when the current password is wrong');
});

test('changePassword: on success, updates the hash AND revokes all refresh tokens in one transaction', async () => {
  resetMocks();
  fx.userForPassword = { passwordHash: 'hash' };
  resetPasswordFx();

  await changePassword(1, 'correct', 'newpassword');

  assert.equal(calls.transaction.length, 1);
  assert.equal(calls.userUpdate[0].data.passwordHash, 'hashed(newpassword)');
  assert.deepEqual(calls.refreshTokenDeleteMany[0].where, { userId: 1 });
});

// ── uploadAvatar / deleteAvatar ──────────────────────────────

test('uploadAvatar: upserts a per-user avatar URL and returns it', async () => {
  resetMocks();

  const result = await uploadAvatar(1, {});

  assert.equal(calls.profileUpsert.length, 1);
  assert.deepEqual(calls.profileUpsert[0].where, { userId: 1 });
  assert.ok(result.startsWith('/uploads/avatars/1-'));
  assert.equal(calls.profileUpsert[0].update.avatar, result);
});

test('deleteAvatar: clears the avatar field to null', async () => {
  resetMocks();

  await deleteAvatar(1);

  assert.deepEqual(calls.profileUpdate[0].where, { userId: 1 });
  assert.deepEqual(calls.profileUpdate[0].data, { avatar: null });
});