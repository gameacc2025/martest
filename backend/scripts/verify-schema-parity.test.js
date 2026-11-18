const test = require('node:test');
const assert = require('node:assert/strict');
const { extractExpectedTables } = require('./verify-schema-parity');

test('extractExpectedTables resolves model maps and schema maps', () => {
  const schema = `
model User {
  id Int @id
}

model LegacyAccount {
  id Int @id
  @@map("legacy_accounts")
  @@schema("archive")
}

model IgnoredModel {
  id Int @id
  @@ignore
}
`;
  assert.deepEqual(extractExpectedTables(schema), [
    { model: 'User', table: 'User', schema: 'public' },
    { model: 'LegacyAccount', table: 'legacy_accounts', schema: 'archive' },
  ]);
});

test('extractExpectedTables ignores non-model blocks and handles nested attributes', () => {
  const schema = `
generator client {
  provider = "prisma-client-js"
}

model Sample {
  id Int @id
  metadata Json @default("{}")
  @@index([id])
}
`;
  assert.deepEqual(extractExpectedTables(schema), [
    { model: 'Sample', table: 'Sample', schema: 'public' },
  ]);
});
