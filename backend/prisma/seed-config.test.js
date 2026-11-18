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


test('rejects a weak explicitly configured bootstrap password', () => {
  assert.throws(
    () => resolveSuperAdminPassword({ NODE_ENV: 'production', SUPER_ADMIN_PASSWORD: 'too-short' }),
    /at least 32 characters/,
  );
});

test('environment example never contains a preconfigured administrator password', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const example = fs.readFileSync(path.join(__dirname, '../.env.example'), 'utf8');
  assert.match(example, /^SUPER_ADMIN_PASSWORD=\s*$/m);
});
