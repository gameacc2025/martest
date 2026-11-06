const test = require('node:test');
const assert = require('node:assert/strict');
const { DEMO_COMPANIES, DEMO_CUSTOMERS, CATALOG } = require('./demo-marketplace');

test('demo fixture contains ten companies across all supported company types', () => {
  assert.equal(DEMO_COMPANIES.length, 10);
  assert.deepEqual(new Set(DEMO_COMPANIES.map((company) => company.type)),
    new Set(['MANUFACTURER', 'IMPORTER', 'TELECOM_OPERATOR']));
});

test('demo fixture contains five customer accounts', () => {
  assert.equal(DEMO_CUSTOMERS.length, 5);
});

test('every top-level marketplace category has five product references', () => {
  assert.equal(CATALOG.length, 15);
  assert.equal(new Set(CATALOG.map((family) => family.category)).size, 15);
  for (const family of CATALOG) {
    assert.equal(family.items.length, 5, family.category);
    for (const item of family.items) {
      assert.ok(item[0] && item[1] && item[2], family.category + ' product identity');
      assert.ok(item[7] > 0, family.category + ' indicative demo price');
    }
  }
});
