// مسیر فایل: backend/src/modules/admin/admin.controller.test.js
// =============================================================
// Unit tests — Admin controller (HTTP layer over admin.service)
//
// Run with:  node --test
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

const calls = {};
let fx;
function resetMocks() {
  Object.keys(calls).forEach((k) => delete calls[k]);
  fx = {};
}

const mockAdminService = {
  getStats: async (...args) => { calls.getStats = args; return fx.stats; },
};

injectMock('./admin.service', mockAdminService);
const controller = require('./admin.controller');

test.beforeEach(() => resetMocks());

function makeReply() {
  const reply = { _body: undefined, send(b) { this._body = b; return this; } };
  return reply;
}

test('getStats: calls the service with no arguments and wraps the result in success()', async () => {
  fx.stats = { totalUsers: 10, totalCompanies: 3 };
  const reply = makeReply();
  await controller.getStats({}, reply);

  assert.deepEqual(calls.getStats, []);
  assert.deepEqual(reply._body, { data: fx.stats });
});
