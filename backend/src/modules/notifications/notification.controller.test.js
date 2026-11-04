// مسیر فایل: backend/src/modules/notifications/notification.controller.test.js
// =============================================================
// Unit tests — Notification controller (HTTP layer)
//
// Run with:  node --test
//
// Focus: query -> Number coercion + defaults on list(), the
// unreadOnly==='true' string comparison (a common source of bugs —
// truthy-but-wrong values like unreadOnly=1 must NOT be treated as
// true), and params.id -> Number coercion on the mutation routes.
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

const mockNotificationService = {
  getNotifications: async (...args) => { calls.getNotifications = args; return fx.result ?? { data: [], meta: {} }; },
  getUnreadCount: async (...args) => { calls.getUnreadCount = args; return fx.count ?? 0; },
  markAsRead: async (...args) => { calls.markAsRead = args; },
  markAllAsRead: async (...args) => { calls.markAllAsRead = args; },
  deleteNotification: async (...args) => { calls.deleteNotification = args; },
  getUserFolders: async (...args) => { calls.getUserFolders = args; return fx.folders || []; },
  changeNotificationFolder: async (...args) => { calls.changeNotificationFolder = args; return { success: true }; },
};

injectMock('./notification.service', mockNotificationService);
const controller = require('./notification.controller');

test.beforeEach(() => resetMocks());

function makeReply() {
  const reply = { _body: undefined, send(b) { this._body = b; return this; } };
  return reply;
}

function makeRequest(overrides = {}) {
  return { query: {}, params: {}, user: { id: 1 }, ...overrides };
}

// ── list ──────────────────────────────────────────────────────

test('list: defaults page=1, limit=20, unreadOnly=false when the query is empty', async () => {
  const reply = makeReply();
  await controller.list(makeRequest({ user: { id: 7 } }), reply);
  const [userId, opts] = calls.getNotifications;
  assert.equal(userId, 7);
  assert.deepEqual(opts, { page: 1, limit: 20, unreadOnly: false });
});

test('list: coerces string page/limit to numbers', async () => {
  const reply = makeReply();
  await controller.list(makeRequest({ query: { page: '3', limit: '50' } }), reply);
  assert.deepEqual(calls.getNotifications[1], { page: 3, limit: 50, unreadOnly: false });
});

test('list: unreadOnly is true only for the literal string "true"', async () => {
  const reply = makeReply();
  await controller.list(makeRequest({ query: { unreadOnly: 'true' } }), reply);
  assert.equal(calls.getNotifications[1].unreadOnly, true);

  await controller.list(makeRequest({ query: { unreadOnly: '1' } }), reply);
  assert.equal(calls.getNotifications[1].unreadOnly, false);

  await controller.list(makeRequest({ query: { unreadOnly: true } }), reply); // already boolean, not the string
  assert.equal(calls.getNotifications[1].unreadOnly, false);
});

test('list: sends the service result AS-IS (no success() wrapping)', async () => {
  fx.result = { data: [{ id: 1 }], meta: { total: 1 } };
  const reply = makeReply();
  await controller.list(makeRequest(), reply);
  assert.deepEqual(reply._body, fx.result);
});

// ── getUnreadCount ────────────────────────────────────────────

test('getUnreadCount: forwards the caller id and sends { count }', async () => {
  fx.count = 5;
  const reply = makeReply();
  await controller.getUnreadCount(makeRequest({ user: { id: 9 } }), reply);
  assert.deepEqual(calls.getUnreadCount, [9]);
  assert.deepEqual(reply._body, { count: 5 });
});

// ── markAsRead ────────────────────────────────────────────────

test('markAsRead: coerces params.id to a number, forwards the caller id, replies { success: true }', async () => {
  const reply = makeReply();
  await controller.markAsRead(makeRequest({ params: { id: '42' }, user: { id: 9 } }), reply);
  assert.deepEqual(calls.markAsRead, [42, 9]);
  assert.deepEqual(reply._body, { success: true });
});

// ── markAllAsRead ─────────────────────────────────────────────

test('markAllAsRead: forwards only the caller id', async () => {
  const reply = makeReply();
  await controller.markAllAsRead(makeRequest({ user: { id: 9 } }), reply);
  assert.deepEqual(calls.markAllAsRead, [9]);
  assert.deepEqual(reply._body, { success: true });
});

// ── remove ────────────────────────────────────────────────────

test('remove: coerces params.id to a number and scopes deletion to the caller', async () => {
  const reply = makeReply();
  await controller.remove(makeRequest({ params: { id: '3' }, user: { id: 9 } }), reply);
  assert.deepEqual(calls.deleteNotification, [3, 9]);
  assert.deepEqual(reply._body, { success: true });
});


test('listFolders: derives the app scope from verified accessType, ignoring query.app', async () => {
  fx.folders = [{ id: 4, key: 'INBOX', scope: 'ALL' }];
  const reply = makeReply();
  await controller.listFolders(makeRequest({
    query: { app: 'COMPANY' },
    user: { id: 7, accessType: 'STAFF' },
  }), reply);
  assert.deepEqual(calls.getUserFolders, ['ADMIN']);
  assert.deepEqual(reply._body, { data: fx.folders });
});

test('listFolders: fails closed when the token has no recognized app context', async () => {
  await assert.rejects(
    () => controller.listFolders(makeRequest({ query: { app: 'ADMIN' }, user: { id: 7 } }), makeReply()),
    (error) => error.code === 'NOTIFICATION_APP_CONTEXT_REQUIRED' && error.statusCode === 403,
  );
  assert.equal(calls.getUserFolders, undefined);
});

test('listFolders: AccessProfile-less CUSTOMER_USER receives Website folders only', async () => {
  fx.folders = [{ id: 5, key: 'INBOX', scope: 'ALL' }];
  await controller.listFolders(makeRequest({
    query: { app: 'ADMIN' },
    user: { id: 8, accessType: null, roles: ['CUSTOMER_USER'] },
  }), makeReply());
  assert.deepEqual(calls.getUserFolders, ['WEBSITE']);
});

test('listFolders: CUSTOMER_USER fallback never applies to SUPER_ADMIN', async () => {
  await assert.rejects(
    () => controller.listFolders(makeRequest({
      user: { id: 8, accessType: null, roles: ['CUSTOMER_USER', 'SUPER_ADMIN'] },
    }), makeReply()),
    (error) => error.code === 'NOTIFICATION_APP_CONTEXT_REQUIRED' && error.statusCode === 403,
  );
  assert.equal(calls.getUserFolders, undefined);
});

test('list: AccessProfile-less CUSTOMER_USER can filter only Website-scoped folders', async () => {
  fx.folders = [{ id: 6, key: 'SAVED', scope: 'WEBSITE' }];
  await controller.list(makeRequest({
    query: { folderId: '6' },
    user: { id: 8, accessType: null, roles: ['CUSTOMER_USER'] },
  }), makeReply());
  assert.deepEqual(calls.getUserFolders, ['WEBSITE']);
  assert.deepEqual(calls.getNotifications, [8, { page: 1, limit: 20, unreadOnly: false, folderId: 6 }]);
});

test('list: rejects a folder ID outside the authenticated app scope before querying notifications', async () => {
  fx.folders = [{ id: 21, key: 'INBOX', scope: 'COMPANY' }];
  await assert.rejects(
    () => controller.list(makeRequest({
      query: { folderId: '22' },
      user: { id: 7, accessType: 'COMPANY' },
    }), makeReply()),
    (error) => error.code === 'FOLDER_NOT_FOUND' && error.statusCode === 404,
  );
  assert.deepEqual(calls.getUserFolders, ['COMPANY']);
  assert.equal(calls.getNotifications, undefined);
});

test('list: validates folder scope and filters by the accessible folder ID', async () => {
  fx.folders = [{ id: 12, key: 'SAVED', scope: 'WEBSITE' }];
  await controller.list(makeRequest({
    query: { folderId: '12' },
    user: { id: 7, accessType: 'CUSTOMER' },
  }), makeReply());
  assert.deepEqual(calls.getUserFolders, ['WEBSITE']);
  assert.deepEqual(calls.getNotifications, [7, { page: 1, limit: 20, unreadOnly: false, folderId: 12 }]);
});

test('changeFolder: derives the app scope from accessType and ignores body.app', async () => {
  const reply = makeReply();
  await controller.changeFolder(makeRequest({
    params: { id: '9' },
    body: { folderId: 2, action: 'move', app: 'ADMIN', sourceFolderId: 1 },
    user: { id: 7, accessType: 'COMPANY' },
  }), reply);
  assert.deepEqual(calls.changeNotificationFolder, [7, 9, 2, 'move', 'COMPANY', 1]);
  assert.deepEqual(reply._body, { success: true });
});
