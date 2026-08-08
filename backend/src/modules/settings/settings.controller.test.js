// مسیر فایل: backend/src/modules/settings/settings.controller.test.js
// =============================================================
// Unit tests — Settings controller (profile, password, avatar for
// the CURRENT authenticated user only — everything is scoped off
// request.user.id, never a route param, so there's no IDOR surface
// here as long as that stays true).
//
// Run with:  node --test
//
// Focus: uploadAvatar's explicit throw when request.file() resolves
// to nothing (Fastify's multipart plugin can do this for a request
// with no file part), and that every route is scoped to the caller's
// own id.
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

const mockSettingsService = {
  getProfile: async (...args) => { calls.getProfile = args; return fx.profile; },
  updateProfile: async (...args) => { calls.updateProfile = args; return fx.updated; },
  changePassword: async (...args) => { calls.changePassword = args; },
  uploadAvatar: async (...args) => { calls.uploadAvatar = args; return fx.avatarUrl; },
  deleteAvatar: async (...args) => { calls.deleteAvatar = args; },
};

injectMock('./settings.service', mockSettingsService);
const controller = require('./settings.controller');

test.beforeEach(() => resetMocks());

function makeReply() {
  const reply = { _body: undefined, send(b) { this._body = b; return this; } };
  return reply;
}

function makeRequest(overrides = {}) {
  return { body: {}, user: { id: 1 }, ...overrides };
}

// ── getProfile ────────────────────────────────────────────────

test('getProfile: scoped to request.user.id, wraps in success()', async () => {
  fx.profile = { id: 7, email: 'a@a.com' };
  const reply = makeReply();
  await controller.getProfile(makeRequest({ user: { id: 7 } }), reply);
  assert.deepEqual(calls.getProfile, [7]);
  assert.deepEqual(reply._body, { data: fx.profile });
});

// ── updateProfile ─────────────────────────────────────────────

test('updateProfile: forwards the caller id and full body', async () => {
  fx.updated = { id: 7 };
  const reply = makeReply();
  await controller.updateProfile(makeRequest({ user: { id: 7 }, body: { firstName: 'Ali' } }), reply);
  assert.deepEqual(calls.updateProfile, [7, { firstName: 'Ali' }]);
});

// ── changePassword ────────────────────────────────────────────

test('changePassword: extracts currentPassword/newPassword and scopes to the caller', async () => {
  const reply = makeReply();
  await controller.changePassword(makeRequest({ user: { id: 7 }, body: { currentPassword: 'old', newPassword: 'new' } }), reply);
  assert.deepEqual(calls.changePassword, [7, 'old', 'new']);
  assert.deepEqual(reply._body, { data: { message: 'Password changed successfully' } });
});

// ── uploadAvatar ──────────────────────────────────────────────

test('uploadAvatar: throws when request.file() resolves to a falsy value (no file part uploaded)', async () => {
  const request = makeRequest({ user: { id: 7 }, file: async () => undefined });
  await assert.rejects(() => controller.uploadAvatar(request, makeReply()), /No file uploaded/);
  assert.equal(calls.uploadAvatar, undefined);
});

test('uploadAvatar: forwards the caller id and resolved file, replies with { avatarUrl }', async () => {
  fx.avatarUrl = 'https://cdn/avatar.png';
  const reply = makeReply();
  const fakeFile = { filename: 'a.png' };
  const request = makeRequest({ user: { id: 7 }, file: async () => fakeFile });
  await controller.uploadAvatar(request, reply);

  assert.deepEqual(calls.uploadAvatar, [7, fakeFile]);
  assert.deepEqual(reply._body, { data: { avatarUrl: fx.avatarUrl } });
});

// ── deleteAvatar ──────────────────────────────────────────────

test('deleteAvatar: scoped to the caller id', async () => {
  const reply = makeReply();
  await controller.deleteAvatar(makeRequest({ user: { id: 7 } }), reply);
  assert.deepEqual(calls.deleteAvatar, [7]);
  assert.deepEqual(reply._body, { data: { message: 'Avatar deleted successfully' } });
});
