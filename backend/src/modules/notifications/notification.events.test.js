// مسیر فایل: backend/src/modules/notifications/notification.events.test.js
// =============================================================
// Unit tests — the notification event catalog (the integration contract).
//
// These tests protect the CONTRACT other modules build against:
//   - every event promised by flow/06-plan-notifications.md §5 exists
//   - keys are stable and unique (they appear in Notification.type,
//     NotificationPreference.eventType, and the public API)
//   - channel defaults follow flow/06 §4 (IN_APP + EMAIL on, SMS off)
//   - templates return { title, message, data } and the PRODUCT_* templates
//     reproduce the exact strings product.service.js used pre-dispatch
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

injectMock('../../config/db', { mock: true }); // catalog itself must not touch prisma

const {
  EVENT_CATALOG,
  DEFAULT_CHANNELS,
  getEvent,
  isKnownEvent,
  listEventKeys,
  listEvents,
} = require('./notification.events');

// Stable event catalog contract, including the completed inquiry decision lifecycle.
const EXPECTED_EVENT_KEYS = [
  // account/registration (flow/01)
  'COMPANY_REGISTERED',
  'COMPANY_STATUS_CHANGED',
  // product lifecycle (flow/02)
  'PRODUCT_SUBMITTED_FOR_REVIEW',
  'PRODUCT_STATUS_CHANGED',
  'PRODUCT_RE_REVIEW',
  // inquiry/RFQ (flow/03)
  'INQUIRY_PUBLISHED',
  'INQUIRY_RESPONSE_RECEIVED',
  'INQUIRY_MESSAGE_RECEIVED',
  'INQUIRY_STATUS_CHANGED',
  'INQUIRY_RESPONSE_SELECTED',
  'INQUIRY_RESPONSE_REJECTED',
  'INQUIRY_RESPONSE_WITHDRAWN',
  'INQUIRY_RESPONSE_AUTO_REJECTED',
  // order/cart (flow/04) — reserved contract, no Order model yet
  'ORDER_PLACED',
  'ORDER_PAYMENT_FAILED',
  'ORDER_ITEM_STATUS_CHANGED',
  'ORDER_UNANSWERED_REMINDER',
  'ADMIN_ANNOUNCEMENT',
];

test('catalog: every event promised by flow/06 §5 exists', () => {
  for (const key of EXPECTED_EVENT_KEYS) {
    assert.ok(EVENT_CATALOG[key], `missing event key: ${key}`);
  }
  assert.deepEqual(listEventKeys().sort(), EXPECTED_EVENT_KEYS.slice().sort());
});

test('catalog: keys are unique and match their entries', () => {
  const keys = listEventKeys();
  assert.equal(new Set(keys).size, keys.length);
  for (const event of listEvents()) {
    assert.equal(EVENT_CATALOG[event.key], event);
    assert.equal(typeof event.label, 'string');
    assert.equal(typeof event.recipients, 'string'); // integration documentation
    assert.equal(typeof event.template, 'function');
  }
});

test('catalog: every event declares all three channels with boolean defaults', () => {
  for (const event of listEvents()) {
    assert.equal(typeof event.channels.IN_APP, 'boolean', `${event.key}.IN_APP`);
    assert.equal(typeof event.channels.EMAIL, 'boolean', `${event.key}.EMAIL`);
    assert.equal(typeof event.channels.SMS, 'boolean', `${event.key}.SMS`);
    // flow/06 §3: no channel is mandatory — but the sensible defaults are
    // in-app + email on. SMS is opt-in by default.
    assert.equal(event.channels.IN_APP, true, `${event.key} defaults IN_APP on`);
    assert.equal(event.channels.EMAIL, true, `${event.key} defaults EMAIL on`);
    assert.equal(event.channels.SMS, false, `${event.key} defaults SMS off`);
  }
});

test('catalog: global channel defaults are IN_APP+EMAIL on, SMS off', () => {
  assert.deepEqual(DEFAULT_CHANNELS, { IN_APP: true, EMAIL: true, SMS: false });
});

test('catalog: templates produce { title, message, data } from context', () => {
  const samples = {
    COMPANY_REGISTERED: { company: { id: 1, name: 'شرکت الف' } },
    COMPANY_STATUS_CHANGED: { company: { id: 1, name: 'شرکت الف' }, status: 'ACTIVE' },
    PRODUCT_SUBMITTED_FOR_REVIEW: { product: { id: 1, title: 'P' } },
    PRODUCT_STATUS_CHANGED: { product: { id: 1, title: 'X' }, status: 'APPROVED' },
    PRODUCT_RE_REVIEW: { product: { id: 3, title: 'Y' }, threshold: 5 },
    INQUIRY_PUBLISHED: { inquiry: { id: 1, title: 'استعلام' } },
    INQUIRY_RESPONSE_RECEIVED: { inquiry: { id: 2 }, response: { id: 3 } },
    INQUIRY_MESSAGE_RECEIVED: { inquiry: { id: 2, title: 'استعلام' } },
    INQUIRY_STATUS_CHANGED: { inquiry: { id: 2 }, status: 'CLOSED' },
    INQUIRY_RESPONSE_SELECTED: { inquiry: { id: 2 }, response: { id: 3 } },
    INQUIRY_RESPONSE_REJECTED: { inquiry: { id: 2 }, response: { id: 3 } },
    INQUIRY_RESPONSE_AUTO_REJECTED: { inquiry: { id: 2 }, company: { id: 3 } },
    ORDER_PLACED: { order: { id: 4 } },
    ORDER_PAYMENT_FAILED: { order: { id: 5 }, reason: 'card declined' },
    ORDER_ITEM_STATUS_CHANGED: { order: { id: 2 }, item: { id: 3, name: 'item' }, status: 'SHIPPED' },
    ORDER_UNANSWERED_REMINDER: { order: { id: 9 }, company: { id: 1 } },
    ADMIN_ANNOUNCEMENT: { title: 'اطلاعیه آزمایشی', message: 'متن اطلاعیه' },
  };

  for (const event of listEvents()) {
    const content = event.template(samples[event.key] || {});
    assert.equal(typeof content.title, 'string', `${event.key}.template().title`);
    assert.equal(content.title.length > 0, true, `${event.key}.template().title not empty`);
    assert.equal(typeof content.message, 'string', `${event.key}.template().message`);
    assert.equal(content.message.length > 0, true, `${event.key}.template().message`);
    assert.equal('data' in content, true, `${event.key}.template().data`);
  }
});

test('catalog: product templates preserve the legacy product.service strings byte-for-byte', () => {
  const product = { id: 3, title: 'Router R1' };

  const submitted = EVENT_CATALOG.PRODUCT_SUBMITTED_FOR_REVIEW.template({ product });
  assert.equal(submitted.title, 'Product pending review');
  assert.equal(submitted.message, 'Product "Router R1" status changed to PENDING_REVIEW.');

  const approved = EVENT_CATALOG.PRODUCT_STATUS_CHANGED.template({ product, status: 'APPROVED' });
  assert.equal(approved.title, 'Product approved');
  assert.equal(approved.message, 'Product "Router R1" status changed to APPROVED.');

  const rejected = EVENT_CATALOG.PRODUCT_STATUS_CHANGED.template({ product, status: 'REJECTED', comment: 'بی‌دلیل' });
  assert.equal(rejected.message, 'Product "Router R1" status changed to REJECTED. Reason: بی‌دلیل');
});

test('catalog: threshold (re-review) template keeps the legacy Persian wording', () => {
  const content = EVENT_CATALOG.PRODUCT_RE_REVIEW.template({ product: { id: 1, title: 'محصول الف' }, threshold: 3 });
  assert.equal(content.title, 'بازبینی مجدد محصول');
  assert.equal(content.message, 'محصول «محصول الف» پس از 3 ویرایش پس از تأیید به وضعیت در انتظار بررسی برگشت.');
});

test('catalog: ORDER_* events exist as a reserved contract (no Order model yet)', () => {
  for (const key of ['ORDER_PLACED', 'ORDER_PAYMENT_FAILED', 'ORDER_ITEM_STATUS_CHANGED', 'ORDER_UNANSWERED_REMINDER']) {
    assert.ok(EVENT_CATALOG[key], `${key} must stay in the catalog as the reserved contract`);
  }
});


test('INQUIRY_RESPONSE_WITHDRAWN template is anonymous-safe and deep-links to the inquiry/response', () => {
  const event = getEvent('INQUIRY_RESPONSE_WITHDRAWN');
  assert.ok(event);
  assert.deepEqual(event.channels, { IN_APP: true, EMAIL: true, SMS: false });
  const content = event.template({
    inquiry: { id: 7, title: 'RFQ confidential' },
    response: { id: 9 },
    company: { id: 123, name: 'Supplier secret' },
  });
  assert.equal(content.title, 'انصراف از پاسخ استعلام');
  assert.match(content.message, /یکی از شرکت‌ها/);
  assert.match(content.message, /RFQ confidential/);
  assert.equal(content.message.includes('Supplier secret'), false);
  assert.deepEqual(content.data, { inquiryId: 7, responseId: 9 });
});

test('catalog: lookups behave (getEvent/isKnownEvent)', () => {
  assert.equal(isKnownEvent('ORDER_PLACED'), true);
  assert.equal(isKnownEvent('NOT_A_THING'), false);
  assert.equal(getEvent('NOT_A_THING'), null);
  assert.equal(getEvent('COMPANY_REGISTERED').key, 'COMPANY_REGISTERED');
});
