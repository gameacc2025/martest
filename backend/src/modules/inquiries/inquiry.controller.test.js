// مسیر فایل: backend/src/modules/inquiries/inquiry.controller.test.js
// =============================================================
// Unit tests — Inquiry controller (HTTP layer over inquiry.service)
//
// Run with:  node --test
//
// This controller is almost entirely thin passthrough, so the tests
// focus on argument wiring (right params in the right order — easy
// to get wrong with this many :id/:itemId/:responseId/:attachmentId
// nested routes) and the couple of response-shape quirks:
//   - list() sends the service result AS-IS (already {data, meta}
//     shaped) instead of double-wrapping with success()
//   - withdrawResponse() defaults a missing body to {} rather than
//     passing undefined through
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

const mockInquiryService = {
  listInquiries: async (...args) => { calls.listInquiries = args; return fx.listResult ?? { data: [], meta: {} }; },
  getInquiry: async (...args) => { calls.getInquiry = args; return fx.inquiry; },
  createInquiry: async (...args) => { calls.createInquiry = args; return fx.created; },
  updateInquiry: async (...args) => { calls.updateInquiry = args; return fx.updated; },
  getInquiryStats: async (...args) => { calls.getInquiryStats = args; return fx.stats; },
  listInquiryItems: async (...args) => { calls.listInquiryItems = args; return fx.items; },
  changeInquiryStatus: async (...args) => { calls.changeInquiryStatus = args; return fx.statusChanged; },
  addInquiryItem: async (...args) => { calls.addInquiryItem = args; return fx.item; },
  updateInquiryItem: async (...args) => { calls.updateInquiryItem = args; return fx.item; },
  deleteInquiryItem: async (...args) => { calls.deleteInquiryItem = args; },
  submitResponse: async (...args) => { calls.submitResponse = args; return fx.response; },
  listResponses: async (...args) => { calls.listResponses = args; return fx.responses; },
  updateResponse: async (...args) => { calls.updateResponse = args; return fx.response; },
  withdrawResponse: async (...args) => { calls.withdrawResponse = args; return fx.response; },
  uploadResponseAttachment: async (...args) => { calls.uploadResponseAttachment = args; return fx.attachment; },
  deleteResponseAttachment: async (...args) => { calls.deleteResponseAttachment = args; },
};

injectMock('./inquiry.service', mockInquiryService);
const controller = require('./inquiry.controller');

test.beforeEach(() => resetMocks());

function makeReply() {
  const reply = {
    _statusCode: undefined,
    _body: undefined,
    code(c) { this._statusCode = c; return this; },
    send(b) { this._body = b; return this; },
  };
  return reply;
}

function makeRequest(overrides = {}) {
  return { query: {}, params: {}, body: {}, user: { id: 1 }, ...overrides };
}

// ── list — sends the service result unwrapped ───────────────────

test('list: forwards query + user, and sends the {data, meta} result AS-IS (no double success() wrapping)', async () => {
  fx.listResult = { data: [{ id: 1 }], meta: { total: 1 } };
  const reply = makeReply();
  const user = { id: 1 };
  await controller.list(makeRequest({ query: { page: '2' }, user }), reply);

  assert.deepEqual(calls.listInquiries, [{ page: '2' }, user]);
  assert.deepEqual(reply._body, fx.listResult);
});

// ── getById / create / update ────────────────────────────────

test('getById: forwards params.id and user, wraps in success()', async () => {
  fx.inquiry = { id: 1 };
  const reply = makeReply();
  const user = { id: 1 };
  await controller.getById(makeRequest({ params: { id: '5' }, user }), reply);
  assert.deepEqual(calls.getInquiry, ['5', user]);
  assert.deepEqual(reply._body, { data: fx.inquiry });
});

test('create: replies 201', async () => {
  fx.created = { id: 1 };
  const reply = makeReply();
  await controller.create(makeRequest({ body: { title: 'X' } }), reply);
  assert.equal(reply._statusCode, 201);
  assert.deepEqual(reply._body, { data: fx.created });
});

test('update: forwards id, body, user', async () => {
  fx.updated = { id: 1 };
  const reply = makeReply();
  const user = { id: 2 };
  await controller.update(makeRequest({ params: { id: '1' }, body: { title: 'Y' }, user }), reply);
  assert.deepEqual(calls.updateInquiry, ['1', { title: 'Y' }, user]);
});

// ── stats / listItems ────────────────────────────────────────

test('stats: forwards only the caller (user), no params/body', async () => {
  fx.stats = { total: 5 };
  const reply = makeReply();
  const user = { id: 3 };
  await controller.stats(makeRequest({ user }), reply);
  assert.deepEqual(calls.getInquiryStats, [user]);
  assert.deepEqual(reply._body, { data: fx.stats });
});

test('listItems: forwards params.id and user', async () => {
  fx.items = [{ id: 1 }];
  const reply = makeReply();
  const user = { id: 1 };
  await controller.listItems(makeRequest({ params: { id: '7' }, user }), reply);
  assert.deepEqual(calls.listInquiryItems, ['7', user]);
});

// ── changeStatus ──────────────────────────────────────────────

test('changeStatus: extracts status + comment from the body, forwards id and user', async () => {
  fx.statusChanged = { id: 1, status: 'SUBMITTED' };
  const reply = makeReply();
  const user = { id: 1 };
  await controller.changeStatus(makeRequest({ params: { id: '1' }, body: { status: 'SUBMITTED', comment: 'go' }, user }), reply);
  assert.deepEqual(calls.changeInquiryStatus, ['1', 'SUBMITTED', user, 'go']);
});

// ── items — addItem / updateItem / deleteItem ────────────────

test('addItem: replies 201, forwards id + body + user', async () => {
  fx.item = { id: 1 };
  const reply = makeReply();
  const user = { id: 1 };
  await controller.addItem(makeRequest({ params: { id: '1' }, body: { productId: 5 }, user }), reply);
  assert.deepEqual(calls.addInquiryItem, ['1', { productId: 5 }, user]);
  assert.equal(reply._statusCode, 201);
});

test('updateItem: forwards inquiryId, itemId, body, user in that order', async () => {
  fx.item = { id: 1 };
  const reply = makeReply();
  const user = { id: 1 };
  await controller.updateItem(makeRequest({ params: { id: '1', itemId: '2' }, body: { qty: 3 }, user }), reply);
  assert.deepEqual(calls.updateInquiryItem, ['1', '2', { qty: 3 }, user]);
});

test('deleteItem: forwards inquiryId, itemId, user; replies 204', async () => {
  const reply = makeReply();
  const user = { id: 1 };
  await controller.deleteItem(makeRequest({ params: { id: '1', itemId: '2' }, user }), reply);
  assert.deepEqual(calls.deleteInquiryItem, ['1', '2', user]);
  assert.equal(reply._statusCode, 204);
});

// ── responses — submit / list / update / withdraw ────────────

test('submitResponse: forwards inquiryId + body + user; replies 201', async () => {
  fx.response = { id: 1 };
  const reply = makeReply();
  const user = { id: 1, companyId: 5 };
  await controller.submitResponse(makeRequest({ params: { id: '1' }, body: { price: 100 }, user }), reply);
  assert.deepEqual(calls.submitResponse, ['1', { price: 100 }, user]);
  assert.equal(reply._statusCode, 201);
});

test('listResponses: forwards inquiryId + user', async () => {
  fx.responses = [{ id: 1 }];
  const reply = makeReply();
  const user = { id: 1 };
  await controller.listResponses(makeRequest({ params: { id: '1' }, user }), reply);
  assert.deepEqual(calls.listResponses, ['1', user]);
});

test('updateResponse: forwards inquiryId, responseId, body, user in that order', async () => {
  fx.response = { id: 1 };
  const reply = makeReply();
  const user = { id: 1 };
  await controller.updateResponse(makeRequest({ params: { id: '1', responseId: '9' }, body: { price: 50 }, user }), reply);
  assert.deepEqual(calls.updateResponse, ['1', '9', { price: 50 }, user]);
});

test('withdrawResponse: forwards inquiryId, responseId, user, body', async () => {
  fx.response = { id: 1 };
  const reply = makeReply();
  const user = { id: 1 };
  await controller.withdrawResponse(makeRequest({ params: { id: '1', responseId: '9' }, body: { reason: 'x' }, user }), reply);
  assert.deepEqual(calls.withdrawResponse, ['1', '9', user, { reason: 'x' }]);
});

test('withdrawResponse: a missing body defaults to {} rather than being passed through as undefined', async () => {
  fx.response = { id: 1 };
  const reply = makeReply();
  const user = { id: 1 };
  await controller.withdrawResponse(makeRequest({ params: { id: '1', responseId: '9' }, body: undefined, user }), reply);
  assert.deepEqual(calls.withdrawResponse[3], {});
});

// ── response attachments ─────────────────────────────────────

test('uploadResponseAttachment: calls request.file() (no size-limit options) and forwards inquiryId, responseId, file, user', async () => {
  fx.attachment = { id: 1 };
  const reply = makeReply();
  const user = { id: 1 };
  const fakeFile = { filename: 'doc.pdf' };
  let fileCalledWith = 'not-called';
  const request = makeRequest({
    params: { id: '1', responseId: '9' },
    user,
    file: async (opts) => { fileCalledWith = opts; return fakeFile; },
  });

  await controller.uploadResponseAttachment(request, reply);

  assert.equal(fileCalledWith, undefined);
  assert.deepEqual(calls.uploadResponseAttachment, ['1', '9', fakeFile, user]);
  assert.equal(reply._statusCode, 201);
});

test('deleteResponseAttachment: forwards inquiryId, responseId, attachmentId, user; replies 204', async () => {
  const reply = makeReply();
  const user = { id: 1 };
  await controller.deleteResponseAttachment(makeRequest({ params: { id: '1', responseId: '9', attachmentId: '3' }, user }), reply);
  assert.deepEqual(calls.deleteResponseAttachment, ['1', '9', '3', user]);
  assert.equal(reply._statusCode, 204);
});
