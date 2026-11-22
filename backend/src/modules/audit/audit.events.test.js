const test = require('node:test');
const assert = require('node:assert/strict');
const { AUDIT_ACTIONS } = require('./audit.events');

test('central audit action registry is immutable, unique, and uses stable event identifiers', () => {
  assert.equal(Object.isFrozen(AUDIT_ACTIONS), true);
  const entries = Object.entries(AUDIT_ACTIONS);
  const values = entries.map(([, value]) => value);

  assert.ok(entries.length >= 20);
  assert.equal(new Set(values).size, values.length, 'audit action values must be unique');

  for (const [key, value] of entries) {
    assert.match(key, /^[A-Z][A-Z0-9_]+$/);
    assert.equal(value, key, 'registry keys and stored action identifiers must remain aligned');
  }
});

test('inquiry, support, and CMS FAQ lifecycle actions remain centrally registered', () => {
  for (const action of [
    'INQUIRY_CREATED',
    'NOTIFICATION_BULK_READ',
    'NOTIFICATION_BULK_UNREAD',
    'INQUIRY_UPDATED',
    'INQUIRY_STATUS_CHANGED',
    'INQUIRY_RESPONSES_REVEALED',
    'SUPPORT_TICKET_CREATED',
    'SUPPORT_MESSAGE_CREATED',
    'SUPPORT_TICKET_STATUS_CHANGED',
    'SUPPORT_TICKET_ASSIGNED',
    'CMS_FAQ_CREATED',
    'CMS_FAQ_UPDATED',
    'CMS_FAQ_DELETED',
    'CMS_PAGE_CREATED',
    'CMS_PAGE_UPDATED',
    'CMS_PAGE_DELETED',
    'CMS_CATEGORY_CREATED',
    'CMS_CATEGORY_UPDATED',
    'CMS_CATEGORY_DELETED',
    'CMS_TAG_CREATED',
    'CMS_TAG_UPDATED',
    'CMS_TAG_DELETED',
    'CMS_PREVIEW_TOKEN_CREATED',
    'CMS_PREVIEW_TOKEN_CONSUMED',
    'PRODUCT_CREATED',
    'PRODUCT_UPDATED',
    'PRODUCT_PRICE_TIER_CREATED',
    'PRODUCT_PRICE_TIER_UPDATED',
    'PRODUCT_PRICE_TIER_DELETED',
    'PRODUCT_IMAGE_CREATED',
    'PRODUCT_IMAGE_DELETED',
    'PRODUCT_IMAGE_PRIMARY_CHANGED',
    'PRODUCT_IMAGES_REORDERED',
    'PRODUCT_DOCUMENT_CREATED',
    'PRODUCT_DOCUMENT_DELETED',
  ]) {
    assert.equal(AUDIT_ACTIONS[action], action);
  }
});
