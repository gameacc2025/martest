const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');

let databaseRows = [];
class MockClient {
  async connect() {}
  async query() { return { rows: databaseRows }; }
  async end() {}
}
const pgPath = require.resolve('pg');
const originalPg = require.cache[pgPath];
require.cache[pgPath] = new Module(pgPath);
require.cache[pgPath].exports = { Client: MockClient };
require.cache[pgPath].loaded = true;

const { extractExpectedTables, verifySchemaParity } = require('./verify-schema-parity');
const schemaText = fs.readFileSync(path.resolve(__dirname, '../prisma/schema.prisma'), 'utf8');
const expectedTables = extractExpectedTables(schemaText);

test.after(() => {
  if (originalPg) require.cache[pgPath] = originalPg;
  else delete require.cache[pgPath];
});

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


test('verifySchemaParity passes when all model tables are present', async () => {
  const previousUrl = process.env.DATABASE_URL;
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test?schema=public';
  databaseRows = expectedTables.map((item) => ({ schemaname: item.schema, tablename: item.table }));
  try {
    const result = await verifySchemaParity();
    assert.equal(result.expected, expectedTables.length);
    assert.equal(result.missing.length, 0);
  } finally {
    if (previousUrl === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = previousUrl;
  }
});

test('verifySchemaParity rejects when a Prisma model table is missing', async () => {
  const previousUrl = process.env.DATABASE_URL;
  const previousError = console.error;
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test?schema=public';
  databaseRows = expectedTables.slice(1).map((item) => ({ schemaname: item.schema, tablename: item.table }));
  console.error = () => {};
  try {
    await assert.rejects(
      () => verifySchemaParity(),
      (error) => /Prisma model table\(s\) are missing/.test(error.message),
    );
  } finally {
    console.error = previousError;
    if (previousUrl === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = previousUrl;
  }
});
