// مسیر فایل: backend/src/modules/specification-library/specification-library.controller.test.js
// =============================================================
// Unit tests — Specification Library controller (HTTP layer)
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

const mockService = {
  searchFields: async (...args) => { calls.searchFields = args; return fx.searchResult ?? []; },
  listFields: async (...args) => { calls.listFields = args; return fx.listResult ?? []; },
};

injectMock('./specification-library.service', mockService);
const controller = require('./specification-library.controller');

test.beforeEach(() => resetMocks());

function makeReply() {
  const reply = { _body: undefined, send(b) { this._body = b; return this; } };
  return reply;
}

// ── search ────────────────────────────────────────────────────

test('search: forwards q and limit from the query string to the service', async () => {
  fx.searchResult = [{ id: 1, title: 'RAM' }];
  const reply = makeReply();
  await controller.search({ query: { q: 'ram', limit: '10' } }, reply);

  assert.deepEqual(calls.searchFields, ['ram', { limit: '10' }]);
  assert.deepEqual(reply._body, { data: fx.searchResult });
});

test('search: still calls through with an undefined q (service owns the empty-query short-circuit)', async () => {
  const reply = makeReply();
  await controller.search({ query: {} }, reply);
  assert.deepEqual(calls.searchFields, [undefined, { limit: undefined }]);
  assert.deepEqual(reply._body, { data: [] });
});

// ── listAll ───────────────────────────────────────────────────

test('listAll: calls the service with no arguments and wraps the result', async () => {
  fx.listResult = [{ id: 1 }, { id: 2 }];
  const reply = makeReply();
  await controller.listAll({ query: {} }, reply);

  assert.deepEqual(calls.listFields, []);
  assert.deepEqual(reply._body, { data: fx.listResult });
});
