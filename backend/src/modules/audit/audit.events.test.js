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

test('inquiry and support lifecycle actions remain centrally registered', () => {
  for (const action of [
    'INQUIRY_CREATED',
    'INQUIRY_UPDATED',
    'INQUIRY_STATUS_CHANGED',
    'INQUIRY_RESPONSES_REVEALED',
    'SUPPORT_TICKET_CREATED',
    'SUPPORT_MESSAGE_CREATED',
    'SUPPORT_TICKET_STATUS_CHANGED',
    'SUPPORT_TICKET_ASSIGNED',
  ]) {
    assert.equal(AUDIT_ACTIONS[action], action);
  }
});
