// مسیر فایل: backend/src/utils/pagination.test.js
// =============================================================
// Unit tests — pagination utilities (getPaginationParams,
// buildPaginatedResponse). Pure functions, used by nearly every
// list endpoint in the app; a mistake here (e.g. an off-by-one in
// skip, or a bad clamp) would silently corrupt every paginated list.
//
// Run with:  node --test
// =============================================================

const test = require('node:test');
const assert = require('node:assert/strict');
const { getPaginationParams, buildPaginatedResponse } = require('./pagination');

// ── getPaginationParams ──────────────────────────────────────

test('getPaginationParams: defaults to page=1, limit=20, skip=0 when the query is empty', () => {
  assert.deepEqual(getPaginationParams({}), { page: 1, limit: 20, skip: 0, take: 20 });
});

test('getPaginationParams: parses numeric-string page/limit', () => {
  assert.deepEqual(getPaginationParams({ page: '3', limit: '10' }), { page: 3, limit: 10, skip: 20, take: 10 });
});

test('getPaginationParams: skip is (page-1)*limit', () => {
  assert.equal(getPaginationParams({ page: '5', limit: '15' }).skip, 60);
});

test('getPaginationParams: page is floored at 1 — zero, negative, and non-numeric all fall back to 1', () => {
  assert.equal(getPaginationParams({ page: '0' }).page, 1);
  assert.equal(getPaginationParams({ page: '-5' }).page, 1);
  assert.equal(getPaginationParams({ page: 'abc' }).page, 1);
});

test('getPaginationParams: a non-numeric limit falls back to the default of 20', () => {
  assert.equal(getPaginationParams({ limit: 'abc' }).limit, 20);
});

// Regression test for a real bug found via testing: `parseInt(query.limit, 10)
// || 20` treated limit=0 as falsy and silently fell back to the default of 20,
// inconsistent with how a negative limit was clamped to the floor of 1. Fixed
// to distinguish "not a number" (falls back to default) from "a number that's
// out of range" (clamped), using Number.isFinite() instead of truthiness.
test('getPaginationParams: limit=0 clamps to the floor of 1, consistent with a negative limit (regression test)', () => {
  assert.equal(getPaginationParams({ limit: '0' }).limit, 1);
});

test('getPaginationParams: a negative limit clamps to the floor of 1', () => {
  assert.equal(getPaginationParams({ limit: '-5' }).limit, 1);
});

test('getPaginationParams: limit is capped at 100 even when a much larger value is requested', () => {
  assert.equal(getPaginationParams({ limit: '99999' }).limit, 100);
});

test('getPaginationParams: limit=100 exactly is allowed through (boundary, not off-by-one)', () => {
  assert.equal(getPaginationParams({ limit: '100' }).limit, 100);
});

test('getPaginationParams: a float string is truncated by parseInt, not rounded', () => {
  assert.equal(getPaginationParams({ page: '2.9' }).page, 2);
});

// ── buildPaginatedResponse ───────────────────────────────────

test('buildPaginatedResponse: wraps data with total/page/limit/totalPages', () => {
  const result = buildPaginatedResponse([{ id: 1 }], 45, 2, 10);
  assert.deepEqual(result, { data: [{ id: 1 }], meta: { total: 45, page: 2, limit: 10, totalPages: 5 } });
});

test('buildPaginatedResponse: totalPages rounds UP for a partial last page', () => {
  assert.equal(buildPaginatedResponse([], 41, 1, 10).meta.totalPages, 5);
});

test('buildPaginatedResponse: totalPages is 0 for a total of 0 (not 1, not NaN)', () => {
  assert.equal(buildPaginatedResponse([], 0, 1, 20).meta.totalPages, 0);
});

test('buildPaginatedResponse: passes the data array through by reference, unmodified', () => {
  const items = [{ id: 1 }, { id: 2 }];
  assert.equal(buildPaginatedResponse(items, 2, 1, 20).data, items);
});
