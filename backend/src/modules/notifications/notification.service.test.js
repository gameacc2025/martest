// مسیر فایل: backend/src/modules/notifications/notification.service.test.js
// =============================================================
// Unit tests — Notification service (getNotifications / getUnreadCount /
// markAsRead / markAllAsRead / deleteNotification / createNotification)
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

const calls = {
  findMany: [],
  count: [],
  findFirst: [],
  update: [],
  updateMany: [],
  delete: [],
  deleteMany: [],
  create: [],
  folderFindUnique: [],
  membershipFindUnique: [],
  membershipUpsert: [],
  membershipDelete: [],
  transactions: [],
};
let fx;
function resetMocks() {
  Object.keys(calls).forEach((k) => (calls[k] = []));
  fx = {
    data: [],
    total: 0,
    found: null, // what findFirst returns
    created: { id: 1 },
    folders: {},
    memberships: {},
  };
}
resetMocks();

const mockPrisma = {
  notification: {
    findMany: async (args) => {
      calls.findMany.push(args);
      return fx.data;
    },
    count: async (args) => {
      calls.count.push(args);
      return fx.total;
    },
    findFirst: async (args) => {
      calls.findFirst.push(args);
      return fx.found;
    },
    update: async (args) => {
      calls.update.push(args);
      return {};
    },
    updateMany: async (args) => {
      calls.updateMany.push(args);
      return { count: 0 };
    },
    delete: async (args) => {
      calls.delete.push(args);
      return {};
    },
    deleteMany: async (args) => {
      calls.deleteMany.push(args);
      return { count: 2 };
    },
    create: async (args) => {
      calls.create.push(args);
      return fx.created;
    },
  },
  notificationFolder: {
    findMany: async () => [],
    findUnique: async ({ where }) => {
      calls.folderFindUnique.push(where);
      if (where.id !== undefined) return fx.folders[where.id] || null;
      return fx.foldersByKey?.[where.key] || null;
    },
  },
  notificationFolderMembership: {
    findUnique: async ({ where }) => {
      calls.membershipFindUnique.push(where);
      const folderId = where.notificationId_folderId.folderId;
      return fx.memberships[folderId] || null;
    },
    upsert: async (args) => { calls.membershipUpsert.push(args); return {}; },
    delete: async (args) => { calls.membershipDelete.push(args); return {}; },
  },
  $transaction: async (operations) => {
    calls.transactions.push(operations);
    if (Array.isArray(operations)) return Promise.all(operations);
    return operations(mockPrisma);
  },
};

injectMock('../../config/db', mockPrisma);

const {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  setNotificationReadState,
  setNotificationsReadState,
  deleteNotification,
  deleteNotifications,
  createNotification,
  changeNotificationFolder,
} = require('./notification.service');

// ── getNotifications ─────────────────────────────────────────

test('getNotifications: scopes the query to the given userId', async () => {
  resetMocks();
  await getNotifications(7);
  assert.deepEqual(calls.findMany[0].where, { userId: 7 });
  assert.deepEqual(calls.count[0].where, { userId: 7 });
});

test('getNotifications: unreadOnly=true adds an isRead:false filter', async () => {
  resetMocks();
  await getNotifications(7, { unreadOnly: true });
  assert.deepEqual(calls.findMany[0].where, { userId: 7, isRead: false });
});

test('getNotifications: readOnly=true filters to read notifications', async () => {
  resetMocks();
  await getNotifications(7, { readOnly: true });
  assert.deepEqual(calls.findMany[0].where, { userId: 7, isRead: true });
  assert.deepEqual(calls.count[0].where, { userId: 7, isRead: true });
});

test('getNotifications: defaults to page=1, limit=20', async () => {
  resetMocks();
  await getNotifications(7);
  assert.equal(calls.findMany[0].skip, 0);
  assert.equal(calls.findMany[0].take, 20);
});

test('getNotifications: computes skip from page/limit', async () => {
  resetMocks();
  await getNotifications(7, { page: 3, limit: 10 });
  assert.equal(calls.findMany[0].skip, 20);
  assert.equal(calls.findMany[0].take, 10);
});

test('getNotifications: orders newest first', async () => {
  resetMocks();
  await getNotifications(7);
  assert.deepEqual(calls.findMany[0].orderBy, { createdAt: 'desc' });
});

test('getNotifications: returns the standard { data, meta } paginated shape', async () => {
  resetMocks();
  fx.data = [{ id: 1 }, { id: 2 }];
  fx.total = 45;

  const result = await getNotifications(7, { page: 2, limit: 20 });

  assert.deepEqual(result.data, fx.data);
  assert.deepEqual(result.meta, { page: 2, limit: 20, total: 45, totalPages: 3 });
});

// ── getUnreadCount ───────────────────────────────────────────

test('getUnreadCount: counts only unread notifications for the given user', async () => {
  resetMocks();
  fx.total = 4;

  const result = await getUnreadCount(7);

  assert.deepEqual(calls.count[0].where, { userId: 7, isRead: false });
  assert.equal(result, 4);
});

// ── markAsRead ───────────────────────────────────────────────

test('markAsRead: throws NOT_FOUND when the notification does not exist', async () => {
  resetMocks();
  fx.found = null;

  await assert.rejects(() => markAsRead(1, 7), (err) => {
    assert.equal(err.statusCode, 404);
    assert.equal(err.code, 'NOT_FOUND');
    return true;
  });
});

test('markAsRead: throws NOT_FOUND (not 403) for a notification belonging to another user', async () => {
  resetMocks();
  // findFirst is scoped by { id, userId } — a mismatched userId means the
  // mock (and the real DB) simply won't find a row, so this looks
  // identical to a nonexistent notification, which is the correct
  // "don't leak existence" behavior.
  fx.found = null;

  await assert.rejects(() => markAsRead(1, 999), (err) => {
    assert.equal(err.code, 'NOT_FOUND');
    return true;
  });
  assert.deepEqual(calls.findFirst[0].where, { id: 1, userId: 999 });
});

test('markAsRead: sets isRead=true for an owned notification', async () => {
  resetMocks();
  fx.found = { id: 1, userId: 7 };

  await markAsRead(1, 7);

  assert.deepEqual(calls.update[0].where, { id: 1 });
  assert.deepEqual(calls.update[0].data, { isRead: true });
});

// ── markAllAsRead ────────────────────────────────────────────

test('markAllAsRead: only touches the given user\'s unread notifications', async () => {
  resetMocks();
  await markAllAsRead(7);

  assert.deepEqual(calls.updateMany[0].where, { userId: 7, isRead: false });
  assert.deepEqual(calls.updateMany[0].data, { isRead: true });
});

// ── explicit read-state and bulk operations ─────────────────────────────

test('setNotificationReadState: updates only a notification owned by the user', async () => {
  resetMocks();
  fx.found = { id: 4, userId: 7 };
  await setNotificationReadState(4, 7, false);
  assert.deepEqual(calls.findFirst[0].where, { id: 4, userId: 7 });
  assert.deepEqual(calls.update[0], { where: { id: 4 }, data: { isRead: false } });
});

test('setNotificationsReadState: scopes bulk updates by user and selected ids', async () => {
  resetMocks();
  const result = await setNotificationsReadState([4, 5], 7, true);
  assert.deepEqual(calls.updateMany[0], { where: { userId: 7, id: { in: [4, 5] } }, data: { isRead: true } });
  assert.equal(result.count, 0);
});

test('deleteNotifications: bulk delete is scoped by user and selected ids', async () => {
  resetMocks();
  const result = await deleteNotifications([4, 5], 7);
  assert.deepEqual(calls.deleteMany[0], { where: { userId: 7, id: { in: [4, 5] } } });
  assert.equal(result.count, 2);
});

test('bulk notification operations reject invalid ids and read state', async () => {
  resetMocks();
  await assert.rejects(() => deleteNotifications([], 7), error => error.code === 'INVALID_NOTIFICATION_IDS');
  await assert.rejects(() => setNotificationsReadState([1], 7, 'true'), error => error.code === 'INVALID_READ_STATE');
});

// ── deleteNotification ───────────────────────────────────────

test('deleteNotification: throws NOT_FOUND when the notification does not exist or belongs to someone else', async () => {
  resetMocks();
  fx.found = null;

  await assert.rejects(() => deleteNotification(1, 7), (err) => {
    assert.equal(err.code, 'NOT_FOUND');
    return true;
  });
  assert.equal(calls.delete.length, 0, 'delete must not run without confirming ownership first');
});

test('deleteNotification: deletes an owned notification', async () => {
  resetMocks();
  fx.found = { id: 1, userId: 7 };

  await deleteNotification(1, 7);

  assert.deepEqual(calls.delete[0].where, { id: 1 });
});

// ── createNotification ───────────────────────────────────────

test('createNotification: persists userId/title/message', async () => {
  resetMocks();
  fx.created = { id: 9, userId: 7, title: 't', message: 'm' };

  const result = await createNotification(7, 't', 'm');

  assert.deepEqual(calls.create[0].data, { userId: 7, title: 't', message: 'm' });
  assert.deepEqual(result, fx.created);
});

test('changeNotificationFolder: refuses moving from an inactive source folder', async () => {
  resetMocks();
  fx.found = { id: 50 };
  fx.folders[2] = { id: 2, isActive: true, scope: 'COMPANY' };
  fx.folders[1] = { id: 1, isActive: false, scope: 'COMPANY' };
  fx.memberships[1] = { notificationId: 50, folderId: 1 };

  await assert.rejects(
    () => changeNotificationFolder(7, 50, 2, 'move', 'COMPANY', 1),
    (error) => error.code === 'SOURCE_FOLDER_NOT_FOUND' && error.statusCode === 404,
  );
  assert.deepEqual(calls.findFirst[0].where, { id: 50, userId: 7 });
  assert.deepEqual(calls.folderFindUnique, [{ id: 2 }, { id: 1 }]);
  assert.equal(calls.transactions.length, 0);
});

test('changeNotificationFolder: refuses a destination folder from another app scope', async () => {
  resetMocks();
  fx.found = { id: 50 };
  fx.folders[9] = { id: 9, isActive: true, scope: 'ADMIN' };

  await assert.rejects(
    () => changeNotificationFolder(7, 50, 9, 'copy', 'COMPANY'),
    (error) => error.code === 'FOLDER_NOT_FOUND' && error.statusCode === 404,
  );
  assert.equal(calls.membershipUpsert.length, 0);
});
