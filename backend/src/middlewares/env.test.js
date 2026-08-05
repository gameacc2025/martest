// =============================================================
// Tests — env.js fail-fast behavior
//
// env.js runs validation at MODULE LOAD TIME and calls process.exit(1)
// on failure. That can't be tested by require()-ing it in this same
// process (it would kill the whole test run), so each case spawns a
// short-lived child process with a controlled environment and checks
// its exit code instead — the same manual check you'd do by hand.
//
// Run with:  node --test
// =============================================================

const test = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const path = require('node:path');

const envPath = path.join(__dirname, 'env.js');

function runWithEnv(extraEnv) {
  return spawnSync(process.execPath, ['-e', `require(${JSON.stringify(envPath)})`], {
    env: {
      ...process.env,
      DATABASE_URL: 'postgresql://u:p@127.0.0.1:5432/db',
      JWT_ACCESS_SECRET: 'a'.repeat(32),
      JWT_REFRESH_SECRET: 'b'.repeat(32),
      ...extraEnv,
    },
    encoding: 'utf8',
  });
}

test('production boot fails without SUPER_ADMIN_PASSWORD', () => {
  const result = runWithEnv({ NODE_ENV: 'production' });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /SUPER_ADMIN_PASSWORD must be explicitly set in production/);
});

test('production boot succeeds when SUPER_ADMIN_PASSWORD is set', () => {
  const result = runWithEnv({ NODE_ENV: 'production', SUPER_ADMIN_PASSWORD: 'StrongPass123!' });
  assert.equal(result.status, 0);
});

test('development boot succeeds without SUPER_ADMIN_PASSWORD (falls back to dev default)', () => {
  const result = runWithEnv({ NODE_ENV: 'development' });
  assert.equal(result.status, 0);
});

test('boot fails when a genuinely required var (JWT secret) is missing, in any env', () => {
  const result = spawnSync(process.execPath, ['-e', `require(${JSON.stringify(envPath)})`], {
    env: {
      ...process.env,
      DATABASE_URL: 'postgresql://u:p@127.0.0.1:5432/db',
      // JWT_ACCESS_SECRET / JWT_REFRESH_SECRET intentionally omitted
      NODE_ENV: 'development',
    },
    encoding: 'utf8',
  });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Missing required environment variables/);
});