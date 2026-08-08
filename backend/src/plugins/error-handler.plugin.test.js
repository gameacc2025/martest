// مسیر فایل: backend/src/plugins/error-handler.plugin.test.js
// =============================================================
// Unit tests — global error-handler Fastify plugin.
//
// Run with:  node --test
//
// This is the single place that decides the HTTP status/body for
// EVERY error thrown anywhere in the app (validation, Prisma, our
// own AppError-shaped throws, and anything unexpected). It had zero
// coverage. Key risk areas covered here:
//   - the error.statusCode < 500 branch (app-thrown errors) vs the
//     >= 500 fallthrough to the generic 500 handler — an off-by-one
//     here would either leak a 500 error's raw message to the client,
//     or mask a legitimate 4xx app error as a vague 500.
//   - stack traces / debug info are only ever attached in development,
//     never production (a real info-disclosure risk if inverted).
//   - the Prisma error code map takes priority over the generic
//     statusCode path (P2002/P2025/etc. never reach the AppError branch).
//
// We call the plugin function directly (fastify-plugin's fp() wrapper
// doesn't change the function's behavior, just attaches metadata used
// by Fastify's encapsulation system), capture the handlers it
// registers via setErrorHandler/setNotFoundHandler, and invoke those
// handlers directly with fake request/reply objects.
// =============================================================

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const Module = require('node:module');

function injectMock(relativePath, exportsObj) {
  const resolved = require.resolve(path.join(__dirname, relativePath));
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

let currentNodeEnv = 'production';
const envPath = injectMock('../config/env', {
  get nodeEnv() { return currentNodeEnv; },
});
const pluginPath = require.resolve(path.join(__dirname, './error-handler.plugin'));

// `const { nodeEnv } = require('../config/env')` inside the plugin destructures
// (and thus freezes) nodeEnv at require-time, so switching currentNodeEnv after
// the plugin has already been required has no effect — the plugin module must
// be re-required fresh for each nodeEnv value under test.
function reloadPlugin() {
  delete require.cache[pluginPath];
  return require('./error-handler.plugin');
}

test.after(() => { delete require.cache[pluginPath]; });

function makeReply() {
  const reply = {
    _statusCode: undefined,
    _body: undefined,
    code(c) { this._statusCode = c; return this; },
    send(b) { this._body = b; return this; },
  };
  return reply;
}

async function loadHandlers() {
  const logs = { warn: [], error: [] };
  const fastify = {
    log: {
      warn: (...args) => logs.warn.push(args),
      error: (...args) => logs.error.push(args),
    },
    _errorHandler: null,
    _notFoundHandler: null,
    setErrorHandler(fn) { this._errorHandler = fn; },
    setNotFoundHandler(fn) { this._notFoundHandler = fn; },
  };
  const plugin = reloadPlugin();
  await plugin(fastify, {});
  return { fastify, logs };
}

const request = { url: '/api/v1/companies/1', method: 'GET' };

test.beforeEach(() => { currentNodeEnv = 'production'; });

// ── Fastify schema-validation errors ──────────────────────────

test('a Fastify validation error -> 400 VALIDATION_ERROR with per-field details', async () => {
  const { fastify } = await loadHandlers();
  const reply = makeReply();
  const error = {
    validation: [
      { instancePath: '/email', message: 'must be a valid email' },
      { instancePath: '', params: { missingProperty: 'name' }, message: 'must have required property name' },
    ],
    message: 'validation failed',
  };

  fastify._errorHandler(error, request, reply);

  assert.equal(reply._statusCode, 400);
  assert.equal(reply._body.error.code, 'VALIDATION_ERROR');
  assert.deepEqual(reply._body.error.details, [
    { field: 'email', message: 'must be a valid email' },
    { field: 'name', message: 'must have required property name' },
  ]);
});

test('a validation error with neither instancePath nor missingProperty reports field="unknown"', async () => {
  const { fastify } = await loadHandlers();
  const reply = makeReply();
  const error = { validation: [{ message: 'weird' }] };

  fastify._errorHandler(error, request, reply);
  assert.equal(reply._body.error.details[0].field, 'unknown');
});

// ── Prisma known-error mapping ────────────────────────────────

test('Prisma P2002 -> 409 DUPLICATE_ENTRY', async () => {
  const { fastify } = await loadHandlers();
  const reply = makeReply();
  fastify._errorHandler({ code: 'P2002' }, request, reply);
  assert.equal(reply._statusCode, 409);
  assert.equal(reply._body.error.code, 'DUPLICATE_ENTRY');
});

test('Prisma P2025 -> 404 NOT_FOUND', async () => {
  const { fastify } = await loadHandlers();
  const reply = makeReply();
  fastify._errorHandler({ code: 'P2025' }, request, reply);
  assert.equal(reply._statusCode, 404);
  assert.equal(reply._body.error.code, 'NOT_FOUND');
});

test('Prisma P2003 -> 400 FOREIGN_KEY_VIOLATION', async () => {
  const { fastify } = await loadHandlers();
  const reply = makeReply();
  fastify._errorHandler({ code: 'P2003' }, request, reply);
  assert.equal(reply._statusCode, 400);
  assert.equal(reply._body.error.code, 'FOREIGN_KEY_VIOLATION');
});

test('Prisma P2014 -> 400 RELATION_VIOLATION', async () => {
  const { fastify } = await loadHandlers();
  const reply = makeReply();
  fastify._errorHandler({ code: 'P2014' }, request, reply);
  assert.equal(reply._body.error.code, 'RELATION_VIOLATION');
});

test('an unmapped Prisma-shaped error code (e.g. P2016) does NOT match the Prisma branch and falls through', async () => {
  const { fastify } = await loadHandlers();
  const reply = makeReply();
  fastify._errorHandler({ code: 'P2016', statusCode: 422, message: 'weird' }, request, reply);
  // falls to the app-error branch since statusCode(422) < 500
  assert.equal(reply._statusCode, 422);
});

// ── App-thrown errors (statusCode < 500) ─────────────────────

test('an app-thrown error with statusCode < 500 uses that status, its own code, and includes details if present', async () => {
  const { fastify } = await loadHandlers();
  const reply = makeReply();
  const error = { statusCode: 403, code: 'FORBIDDEN', message: 'No access', details: { permission: 'x.delete' } };

  fastify._errorHandler(error, request, reply);
  assert.equal(reply._statusCode, 403);
  assert.deepEqual(reply._body, {
    error: { code: 'FORBIDDEN', message: 'No access', details: { permission: 'x.delete' } },
  });
});

test('an app-thrown error with statusCode < 500 but no code falls back to APP_ERROR', async () => {
  const { fastify } = await loadHandlers();
  const reply = makeReply();
  fastify._errorHandler({ statusCode: 400, message: 'Bad' }, request, reply);
  assert.equal(reply._body.error.code, 'APP_ERROR');
});

test('an app-thrown error with statusCode < 500 and no details omits the `details` key entirely', async () => {
  const { fastify } = await loadHandlers();
  const reply = makeReply();
  fastify._errorHandler({ statusCode: 400, code: 'X', message: 'Bad' }, request, reply);
  assert.equal('details' in reply._body.error, false);
});

test('statusCode=499 boundary still takes the app-error branch (< 500)', async () => {
  const { fastify } = await loadHandlers();
  const reply = makeReply();
  fastify._errorHandler({ statusCode: 499, code: 'X', message: 'edge' }, request, reply);
  assert.equal(reply._statusCode, 499);
});

// ── Unexpected / 500 errors — production vs development ──────

test('statusCode=500 boundary falls through to the generic 500 handler, NOT the app-error branch', async () => {
  const { fastify } = await loadHandlers();
  const reply = makeReply();
  fastify._errorHandler({ statusCode: 500, code: 'SHOULD_NOT_APPEAR', message: 'internal detail' }, request, reply);
  assert.equal(reply._statusCode, 500);
  assert.equal(reply._body.error.code, 'INTERNAL_ERROR');
});

test('a raw unexpected error with no statusCode -> 500 INTERNAL_ERROR with a generic message', async () => {
  const { fastify } = await loadHandlers();
  const reply = makeReply();
  fastify._errorHandler(new TypeError('cannot read property x of undefined'), request, reply);
  assert.equal(reply._statusCode, 500);
  assert.equal(reply._body.error.message, 'An unexpected error occurred. Please try again later.');
});

test('production (nodeEnv=production): a 500 error response NEVER includes debug/stack fields', async () => {
  currentNodeEnv = 'production';
  const { fastify } = await loadHandlers();
  const reply = makeReply();
  fastify._errorHandler(new Error('sensitive internal detail'), request, reply);
  assert.equal('debug' in reply._body.error, false);
  assert.equal('stack' in reply._body.error, false);
});

test('development (nodeEnv=development): a 500 error response includes debug + stack for local debugging', async () => {
  currentNodeEnv = 'development';
  const { fastify } = await loadHandlers();
  const reply = makeReply();
  fastify._errorHandler(new Error('helpful local detail'), request, reply);
  assert.equal(reply._body.error.debug, 'helpful local detail');
  assert.ok(typeof reply._body.error.stack === 'string');
});

test('every 500-path error is logged via fastify.log.error (not just log.warn)', async () => {
  const { fastify, logs } = await loadHandlers();
  fastify._errorHandler(new Error('boom'), request, makeReply());
  assert.equal(logs.error.length, 1);
});

test('every error (regardless of type) is logged via fastify.log.warn with the request url/method', async () => {
  const { fastify, logs } = await loadHandlers();
  fastify._errorHandler({ statusCode: 400, message: 'x' }, request, makeReply());
  assert.equal(logs.warn.length, 1);
  assert.equal(logs.warn[0][0].url, request.url);
  assert.equal(logs.warn[0][0].method, request.method);
});

// ── 404 (unmatched route) handler ─────────────────────────────

test('setNotFoundHandler: replies 404 with a message naming the method and url', async () => {
  const { fastify } = await loadHandlers();
  const reply = makeReply();
  fastify._notFoundHandler({ method: 'POST', url: '/api/v1/does-not-exist' }, reply);
  assert.equal(reply._statusCode, 404);
  assert.deepEqual(reply._body, {
    error: { code: 'NOT_FOUND', message: 'Route POST /api/v1/does-not-exist not found.' },
  });
});
