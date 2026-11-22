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
  getSettings: async (...args) => { calls.getSettings = args; return fx.settings; },
  updateReviewEditThreshold: async (...args) => { calls.updateReviewEditThreshold = args; return fx.settingsUpdated; },
  createInquiryPlan: async (...args) => { calls.createInquiryPlan = args; return fx.planCreated; },
  updateInquiryPlan: async (...args) => { calls.updateInquiryPlan = args; return fx.planUpdated; },
  createNotificationFolder: async (...args) => { calls.createNotificationFolder = args; return fx.folderCreated; },
  updateNotificationFolder: async (...args) => { calls.updateNotificationFolder = args; return fx.folderUpdated; },
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

test('getSettings: calls the service and wraps the result', async () => {
  fx.settings = { productReviewEditThreshold: 5 };
  const reply = makeReply();
  await controller.getSettings({}, reply);
  assert.deepEqual(reply._body, { data: fx.settings });
});

test('createInquiryPlanCtrl: forwards authenticated actor', async () => {
  fx.planCreated = { id: 3 };
  const actor = { id: 9, accessType: 'STAFF' };
  const reply = makeReply();
  await controller.createInquiryPlanCtrl({ body: { code: 'starter' }, user: actor }, reply);
  assert.deepEqual(calls.createInquiryPlan, [{ code: 'starter' }, actor]);
  assert.equal(reply._statusCode, 201);
});

test('updateInquiryPlanCtrl: forwards authenticated actor', async () => {
  fx.planUpdated = { id: 3 };
  const actor = { id: 9, accessType: 'STAFF' };
  const reply = makeReply();
  await controller.updateInquiryPlanCtrl({ params: { id: '3' }, body: { name: 'Starter Plus' }, user: actor }, reply);
  assert.deepEqual(calls.updateInquiryPlan, [3, { name: 'Starter Plus' }, actor]);
});

test('createNotificationFolderCtrl: forwards authenticated actor', async () => {
  fx.folderCreated = { id: 4 };
  const actor = { id: 9, accessType: 'STAFF' };
  const reply = makeReply();
  await controller.createNotificationFolderCtrl({ body: { name: 'Folder' }, user: actor }, reply);
  assert.deepEqual(calls.createNotificationFolder, [{ name: 'Folder' }, actor]);
  assert.equal(reply._statusCode, 201);
});

test('updateNotificationFolderCtrl: forwards authenticated actor', async () => {
  fx.folderUpdated = { id: 4 };
  const actor = { id: 9, accessType: 'STAFF' };
  const reply = makeReply();
  await controller.updateNotificationFolderCtrl({ params: { id: '4' }, body: { name: 'Folder 2' }, user: actor }, reply);
  assert.deepEqual(calls.updateNotificationFolder, [4, { name: 'Folder 2' }, actor]);
});

test('updateReviewEditThreshold: forwards value + user id and wraps the result', async () => {
  fx.settingsUpdated = { productReviewEditThreshold: 3 };
  const reply = makeReply();
  await controller.updateReviewEditThreshold({ body: { value: 3 }, user: { id: '9' } }, reply);
  assert.deepEqual(calls.updateReviewEditThreshold, [3, 9]);
  assert.deepEqual(reply._body, { data: fx.settingsUpdated });
});
