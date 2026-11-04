// Unit tests — notification folder ownership, scope, and copy/move semantics.
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
}

const calls = {
  notificationFindFirst: [],
  folderFindMany: [],
  folderFindUnique: [],
  membershipUpsert: [],
  membershipFindUnique: [],
  membershipDelete: [],
  transactions: [],
};
let fixture;

function resetMocks() {
  for (const key of Object.keys(calls)) calls[key] = [];
  fixture = {
    notification: { id: 10, userId: 7 },
    folders: {
      1: { id: 1, key: 'INBOX', scope: 'ALL', isActive: true },
      2: { id: 2, key: 'CUSTOM', scope: 'ALL', isActive: true },
      3: { id: 3, key: 'ADMIN_ONLY', scope: 'ADMIN', isActive: true },
      4: { id: 4, key: 'INACTIVE', scope: 'ALL', isActive: false },
    },
    foldersByKey: {
      INBOX: { id: 1, key: 'INBOX', scope: 'ALL', isActive: true },
    },
    folderList: [{ id: 1, key: 'INBOX' }, { id: 2, key: 'CUSTOM' }],
    sourceMembership: { id: 20, notificationId: 10, folderId: 1 },
  };
}

const mockPrisma = {
  notification: {
    findFirst: async (args) => {
      calls.notificationFindFirst.push(args);
      return fixture.notification;
    },
  },
  notificationFolder: {
    findMany: async (args) => {
      calls.folderFindMany.push(args);
      return fixture.folderList;
    },
    findUnique: async (args) => {
      calls.folderFindUnique.push(args);
      if (args.where.id !== undefined) return fixture.folders[args.where.id] ?? null;
      if (args.where.key !== undefined) return fixture.foldersByKey[args.where.key] ?? null;
      return null;
    },
  },
  notificationFolderMembership: {
    upsert: async (args) => {
      calls.membershipUpsert.push(args);
      return args.create;
    },
    findUnique: async (args) => {
      calls.membershipFindUnique.push(args);
      return fixture.sourceMembership;
    },
    delete: async (args) => {
      calls.membershipDelete.push(args);
      return {};
    },
  },
  $transaction: async (operations) => {
    calls.transactions.push(operations.length);
    return Promise.all(operations);
  },
};

injectMock('../../config/db', mockPrisma);
const { getUserFolders, changeNotificationFolder } = require('./notification.service');

test.beforeEach(resetMocks);

test('getUserFolders: returns active folders visible to the selected app', async () => {
  const result = await getUserFolders('WEBSITE');
  assert.deepEqual(result, fixture.folderList);
  assert.deepEqual(calls.folderFindMany[0].where, {
    isActive: true,
    OR: [{ scope: 'ALL' }, { scope: 'WEBSITE' }],
  });
});

test('getUserFolders: rejects unsupported app scope', async () => {
  await assert.rejects(() => getUserFolders('UNKNOWN'), (error) => error.statusCode === 400);
  assert.equal(calls.folderFindMany.length, 0);
});

test('changeNotificationFolder: copy checks notification ownership and upserts destination membership', async () => {
  const result = await changeNotificationFolder(7, 10, 2, 'copy', 'WEBSITE');
  assert.deepEqual(calls.notificationFindFirst[0].where, { id: 10, userId: 7 });
  assert.deepEqual(calls.membershipUpsert[0], {
    where: { notificationId_folderId: { notificationId: 10, folderId: 2 } },
    create: { notificationId: 10, folderId: 2 },
    update: {},
  });
  assert.deepEqual(result, { success: true, action: 'copy', notificationId: 10, folderId: 2 });
  assert.equal(calls.membershipDelete.length, 0);
});

test('changeNotificationFolder: cannot change folders for another user notification', async () => {
  fixture.notification = null;
  await assert.rejects(
    () => changeNotificationFolder(999, 10, 2, 'copy', 'WEBSITE'),
    (error) => error.statusCode === 404 && error.code === 'NOT_FOUND',
  );
  assert.equal(calls.membershipUpsert.length, 0);
});

test('changeNotificationFolder: rejects inactive or out-of-scope destination folders', async () => {
  await assert.rejects(
    () => changeNotificationFolder(7, 10, 3, 'copy', 'WEBSITE'),
    (error) => error.statusCode === 404 && error.code === 'FOLDER_NOT_FOUND',
  );
  await assert.rejects(
    () => changeNotificationFolder(7, 10, 4, 'copy', 'WEBSITE'),
    (error) => error.statusCode === 404 && error.code === 'FOLDER_NOT_FOUND',
  );
  assert.equal(calls.membershipUpsert.length, 0);
});

test('changeNotificationFolder: move atomically adds destination and removes source membership', async () => {
  const result = await changeNotificationFolder(7, 10, 2, 'move', 'WEBSITE', 1);
  assert.deepEqual(calls.membershipFindUnique[0].where, {
    notificationId_folderId: { notificationId: 10, folderId: 1 },
  });
  assert.deepEqual(calls.membershipUpsert[0].create, { notificationId: 10, folderId: 2 });
  assert.deepEqual(calls.membershipDelete[0].where, {
    notificationId_folderId: { notificationId: 10, folderId: 1 },
  });
  assert.deepEqual(calls.transactions, [2]);
  assert.deepEqual(result, { success: true, action: 'move', notificationId: 10, folderId: 2 });
});

test('changeNotificationFolder: move rejects a notification not associated with the source folder', async () => {
  fixture.sourceMembership = null;
  await assert.rejects(
    () => changeNotificationFolder(7, 10, 2, 'move', 'WEBSITE', 1),
    (error) => error.statusCode === 400 && error.code === 'SOURCE_MEMBERSHIP_MISSING',
  );
  assert.equal(calls.transactions.length, 0);
  assert.equal(calls.membershipDelete.length, 0);
});

test('changeNotificationFolder: rejects unsupported app and action values', async () => {
  await assert.rejects(
    () => changeNotificationFolder(7, 10, 2, 'copy', 'UNKNOWN'),
    (error) => error.statusCode === 400 && error.code === 'INVALID_APP_SCOPE',
  );
  await assert.rejects(
    () => changeNotificationFolder(7, 10, 2, 'delete', 'WEBSITE'),
    (error) => error.statusCode === 400 && error.code === 'INVALID_FOLDER_ACTION',
  );
});
