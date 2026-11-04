// مسیر فایل: backend/src/utils/success.test.js
// =============================================================
// Unit tests — success response envelope helpers (success, paginated)
//
// Run with:  node --test
// =============================================================

const test = require('node:test');
const assert = require('node:assert/strict');
const { success, paginated } = require('./success');

test('success: wraps any value under a `data` key', () => {
  assert.deepEqual(success({ id: 1 }), { data: { id: 1 } });
  assert.deepEqual(success([1, 2, 3]), { data: [1, 2, 3] });
  assert.deepEqual(success(null), { data: null });
  assert.deepEqual(success('x'), { data: 'x' });
});

test('paginated: wraps data + meta as separate top-level keys', () => {
  const meta = { total: 1, page: 1, limit: 20, totalPages: 1 };
  assert.deepEqual(paginated([{ id: 1 }], meta), { data: [{ id: 1 }], meta });
});
