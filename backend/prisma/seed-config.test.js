const test = require('node:test');
const assert = require('node:assert/strict');
const { resolveSuperAdminPassword } = require('./seed-config');

test('uses the documented local-only bootstrap password in development', () => {
  assert.equal(resolveSuperAdminPassword({ NODE_ENV: 'development' }), 'A123@456');
});

test('prefers an explicitly configured bootstrap password in every environment', () => {
  assert.equal(
    resolveSuperAdminPassword({ NODE_ENV: 'production', SUPER_ADMIN_PASSWORD: 'runtime-only-secret' }),
    'runtime-only-secret',
  );
});

test('refuses to seed outside development without an explicit bootstrap password', () => {
  for (const NODE_ENV of ['production', 'test', 'staging', undefined]) {
    assert.throws(
      () => resolveSuperAdminPassword({ NODE_ENV }),
      /SUPER_ADMIN_PASSWORD must be set/,
    );
  }
});
