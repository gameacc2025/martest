// مسیر فایل: backend/src/utils/token.test.js
// =============================================================
// Unit tests — utils/token.js
//
// Covers JWT sign/verify (via a real @fastify/jwt instance — no
// mocking needed, token.js has no DB dependency) and the refresh
// token hashing/expiry helpers.
//
// One property gets special attention: access and refresh tokens use
// SEPARATE secrets (see token.js's header comment on why). A token
// signed with one secret must NOT verify against the other — that
// isolation is exactly what limits the blast radius if one secret
// ever leaks, so it's asserted explicitly rather than just assumed.
//
// Run with:  node --test
// =============================================================

process.env.NODE_ENV = process.env.NODE_ENV || 'development';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://u:p@127.0.0.1:5432/db';
process.env.JWT_ACCESS_SECRET = 'access-secret-'.padEnd(32, 'a');
process.env.JWT_REFRESH_SECRET = 'refresh-secret-'.padEnd(32, 'b');
process.env.JWT_ACCESS_EXPIRES_IN = '15m';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';

const test = require('node:test');
const assert = require('node:assert/strict');
const Fastify = require('fastify');
const fastifyJwt = require('@fastify/jwt');
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const os = require('node:os');

const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  hashRefreshToken,
  getRefreshTokenExpiry,
} = require('./token');

async function buildFastifyWithJwt() {
  const app = Fastify();
  // The default `secret` here is irrelevant to these tests: every
  // sign()/verify() call below passes an explicit `key`, which
  // @fastify/jwt uses instead — mirroring exactly how auth.plugin.js
  // and token.js use it in the real app.
  await app.register(fastifyJwt, { secret: 'unused-default-secret' });
  await app.ready();
  return app;
}

test('signAccessToken produces a verifiable JWT with the expected payload shape', async () => {
  const app = await buildFastifyWithJwt();
  const token = signAccessToken(app, {
    id: 42,
    email: 'user@example.com',
    roles: ['COMPANY_MANAGER'],
    permissions: ['products.manage'],
    accessType: 'COMPANY',
    companyId: 7,
  });

  const decoded = app.jwt.verify(token, { key: process.env.JWT_ACCESS_SECRET });
  assert.equal(decoded.sub, 42);
  assert.equal(decoded.email, 'user@example.com');
  assert.deepEqual(decoded.roles, ['COMPANY_MANAGER']);
  assert.deepEqual(decoded.permissions, ['products.manage']);
  assert.equal(decoded.accessType, 'COMPANY');
  assert.equal(decoded.companyId, 7);
  assert.equal(decoded.type, 'access');
  assert.ok(decoded.exp, 'expiry claim (exp) must be set');

  await app.close();
});

test('signAccessToken fills in safe defaults for optional fields', async () => {
  const app = await buildFastifyWithJwt();
  const token = signAccessToken(app, { id: 1 }); // email/roles/permissions/accessType/companyId omitted
  const decoded = app.jwt.verify(token, { key: process.env.JWT_ACCESS_SECRET });

  assert.equal(decoded.email, null);
  assert.deepEqual(decoded.roles, []);
  assert.deepEqual(decoded.permissions, []);
  assert.equal(decoded.accessType, null);
  assert.equal(decoded.companyId, null);

  await app.close();
});

test('signRefreshToken produces a MINIMAL payload — no email/roles/permissions leak into it', async () => {
  const app = await buildFastifyWithJwt();
  const token = signRefreshToken(app, 99);
  const decoded = verifyRefreshToken(app, token);

  assert.equal(decoded.sub, 99);
  assert.equal(decoded.type, 'refresh');
  // The whole point of a minimal refresh payload: nothing else should
  // be in there, so a leaked/decoded refresh token exposes as little
  // as possible.
  const extraKeys = Object.keys(decoded).filter(
    (k) => !['sub', 'type', 'jti', 'iat', 'exp'].includes(k)
  );
  assert.deepEqual(extraKeys, []);

  await app.close();
});

test('signRefreshToken creates distinct tokens when issued repeatedly within one second', async () => {
  const app = await buildFastifyWithJwt();
  const first = signRefreshToken(app, 99);
  const second = signRefreshToken(app, 99);
  assert.notEqual(first, second);
  assert.notEqual(verifyRefreshToken(app, first).jti, verifyRefreshToken(app, second).jti);
  await app.close();
});

test('an access token does NOT verify as a refresh token, and vice versa (separate secrets)', async () => {
  const app = await buildFastifyWithJwt();
  const accessToken = signAccessToken(app, { id: 1 });
  const refreshToken = signRefreshToken(app, 1);

  // Refresh verification uses JWT_REFRESH_SECRET — an access token
  // (signed with JWT_ACCESS_SECRET) must be rejected.
  assert.throws(() => verifyRefreshToken(app, accessToken));

  // And the reverse: an access-token verify call (JWT_ACCESS_SECRET)
  // must reject a refresh token.
  assert.throws(() => app.jwt.verify(refreshToken, { key: process.env.JWT_ACCESS_SECRET }));

  await app.close();
});

test('verifyRefreshToken rejects a tampered token', async () => {
  const app = await buildFastifyWithJwt();
  const token = signRefreshToken(app, 5);
  const tampered = token.slice(0, -2) + (token.slice(-2) === 'aa' ? 'bb' : 'aa');

  assert.throws(() => verifyRefreshToken(app, tampered));

  await app.close();
});

test('hashRefreshToken is deterministic, one-way looking, and collision-resistant across inputs', () => {
  const h1 = hashRefreshToken('token-abc');
  const h2 = hashRefreshToken('token-abc');
  const h3 = hashRefreshToken('token-xyz');

  assert.equal(h1, h2); // same input -> same hash (needed for DB lookup by hash)
  assert.notEqual(h1, h3); // different input -> different hash
  assert.notEqual(h1, 'token-abc'); // never equals the raw token
  assert.match(h1, /^[0-9a-f]{64}$/); // SHA-256 hex digest shape
});

test('getRefreshTokenExpiry (default 7d) returns a Date roughly 7 days out', () => {
  const before = Date.now();
  const expiry = getRefreshTokenExpiry();
  const after = Date.now();

  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  assert.ok(expiry instanceof Date);
  assert.ok(expiry.getTime() >= before + sevenDaysMs - 1000);
  assert.ok(expiry.getTime() <= after + sevenDaysMs + 1000);
});

test('getRefreshTokenExpiry parses hour and minute suffixes correctly (subprocess, isolated env)', () => {
  const envPath = require.resolve('../config/env');
  const tokenPath = require.resolve('./token');

  function expiryMsFor(expiresIn) {
    // Wrap the result in a unique marker and read it out with a regex
    // instead of `Number(stdout.trim())`. Anything else the child process
    // writes to stdout before/after our line — a dotenv "injecting env"
    // notice, a differently-versioned dotenv that isn't quiet by default,
    // an antivirus/Node warning banner, etc. — would otherwise turn a
    // clean number into "some text\n7200000", which Number() silently
    // turns into NaN. The marker makes this robust regardless of what
    // else lands on stdout, instead of guessing at a specific cause.
    const script = `
      const env = require(${JSON.stringify(envPath)});
      const { getRefreshTokenExpiry } = require(${JSON.stringify(tokenPath)});
      process.stdout.write('##RESULT_START##' + (getRefreshTokenExpiry().getTime() - Date.now()) + '##RESULT_END##');
    `;
    const result = spawnSync(process.execPath, ['-e', script], {
      cwd: os.tmpdir(), // avoid a real .env backfilling JWT_REFRESH_EXPIRES_IN — see env.test.js
      env: {
        ...process.env,
        DATABASE_URL: 'postgresql://u:p@127.0.0.1:5432/db',
        JWT_ACCESS_SECRET: 'a'.repeat(32),
        JWT_REFRESH_SECRET: 'b'.repeat(32),
        JWT_REFRESH_EXPIRES_IN: expiresIn,
      },
      encoding: 'utf8',
    });
    assert.equal(result.status, 0, result.stderr);

    const match = /##RESULT_START##(-?\d+)##RESULT_END##/.exec(result.stdout);
    assert.ok(
      match,
      `could not find the result marker in subprocess stdout — something else was printed. ` +
        `stdout=${JSON.stringify(result.stdout)} stderr=${JSON.stringify(result.stderr)}`
    );
    return Number(match[1]);
  }

  const twoHoursMs = expiryMsFor('2h');
  const thirtyMinMs = expiryMsFor('30m');

  // Generous tolerance: this spawns a real child process, so on a loaded
  // machine (antivirus scanning node.exe, a noisy parallel test run) the
  // measured gap can occasionally run into the low seconds even though
  // the underlying parsing logic is exact.
  assert.ok(Math.abs(twoHoursMs - 2 * 3600000) < 10000, `twoHoursMs=${twoHoursMs}`);
  assert.ok(Math.abs(thirtyMinMs - 30 * 60000) < 10000, `thirtyMinMs=${thirtyMinMs}`);
});