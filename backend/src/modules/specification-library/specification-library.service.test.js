// مسیر فایل: backend/src/modules/specification-library/specification-library.service.test.js
// =============================================================
// Unit tests — Specification Library service (autocomplete search
// + full listing of reusable spec fields used by the product form)
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

const calls = { findMany: [] };
let fx;
function resetMocks() {
  calls.findMany = [];
  fx = { results: [] };
}
resetMocks();

const mockPrisma = {
  specificationLibraryField: {
    findMany: async (args) => {
      calls.findMany.push(args);
      return fx.results;
    },
  },
};

injectMock('../../config/db', mockPrisma);

const { searchFields, listFields } = require('./specification-library.service');

// ── searchFields ──────────────────────────────────────────────

test('searchFields: returns [] without touching the DB for an empty/blank query', async () => {
  resetMocks();
  assert.deepEqual(await searchFields(''), []);
  assert.deepEqual(await searchFields('   '), []);
  assert.deepEqual(await searchFields(undefined), []);
  assert.equal(calls.findMany.length, 0);
});

test('searchFields: trims the query and searches title/slug (case-insensitive)', async () => {
  resetMocks();
  await searchFields('  ram  ');
  const args = calls.findMany[0];
  assert.deepEqual(args.where.OR, [
    { title: { contains: 'ram', mode: 'insensitive' } },
    { slug: { contains: 'ram', mode: 'insensitive' } },
  ]);
});

test('searchFields: only returns isActive=true fields', async () => {
  resetMocks();
  await searchFields('ram');
  assert.equal(calls.findMany[0].where.isActive, true);
});

test('searchFields: default limit is 20', async () => {
  resetMocks();
  await searchFields('ram');
  assert.equal(calls.findMany[0].take, 20);
});

test('searchFields: clamps a too-large limit down to 50', async () => {
  resetMocks();
  await searchFields('ram', { limit: 500 });
  assert.equal(calls.findMany[0].take, 50);
});

test('searchFields: clamps a negative limit up to 1', async () => {
  resetMocks();
  await searchFields('ram', { limit: -5 });
  assert.equal(calls.findMany[0].take, 1);
});

// Regression test for a real bug found via testing: `Number(limit) || 20`
// treated limit=0 as falsy and silently fell back to the default of 20,
// inconsistent with how a negative limit was clamped to 1. Fixed to check
// Number.isFinite() instead of relying on truthiness.
test('searchFields: limit=0 clamps to the floor of 1, consistent with a negative limit (regression test)', async () => {
  resetMocks();
  await searchFields('ram', { limit: 0 });
  assert.equal(calls.findMany[0].take, 1);
});

test('searchFields: a non-numeric limit falls back to the default of 20', async () => {
  resetMocks();
  await searchFields('ram', { limit: 'not-a-number' });
  assert.equal(calls.findMany[0].take, 20);
});

test('searchFields: orders by title asc and selects only the autocomplete-safe fields', async () => {
  resetMocks();
  await searchFields('ram');
  const args = calls.findMany[0];
  assert.deepEqual(args.orderBy, [{ title: 'asc' }]);
  assert.deepEqual(args.select, {
    id: true, title: true, slug: true, type: true, defaultUnit: true, description: true,
  });
});

test('searchFields: returns whatever the DB gives back', async () => {
  resetMocks();
  fx.results = [{ id: 1, title: 'RAM' }];
  const result = await searchFields('ram');
  assert.deepEqual(result, fx.results);
});

// ── listFields ────────────────────────────────────────────────

test('listFields: filters to isActive=true and orders by title asc', async () => {
  resetMocks();
  await listFields();
  assert.deepEqual(calls.findMany[0].where, { isActive: true });
  assert.deepEqual(calls.findMany[0].orderBy, { title: 'asc' });
});

test('listFields: selects only the autocomplete-safe fields', async () => {
  resetMocks();
  await listFields();
  assert.deepEqual(calls.findMany[0].select, {
    id: true, title: true, slug: true, type: true, defaultUnit: true, description: true,
  });
});

test('listFields: returns whatever the DB gives back', async () => {
  resetMocks();
  fx.results = [{ id: 1 }, { id: 2 }];
  const result = await listFields();
  assert.deepEqual(result, fx.results);
});
