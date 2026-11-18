#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { Client } = require('pg');

function extractExpectedTables(schemaText) {
  const lines = schemaText.split(/\r?\n/);
  const models = [];

  for (let index = 0; index < lines.length; index += 1) {
    const header = lines[index].match(/^\s*model\s+(\w+)\s*\{/);
    if (!header) continue;

    const modelName = header[1];
    const block = [lines[index]];
    let depth = (lines[index].match(/\{/g) || []).length - (lines[index].match(/\}/g) || []).length;
    while (depth > 0 && index + 1 < lines.length) {
      const line = lines[++index];
      block.push(line);
      depth += (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length;
    }

    const body = block.join('\n');
    if (/^\s*@@ignore\s*$/m.test(body)) continue;
    const mappedTable = body.match(/^\s*@@map\(\s*"([^"]+)"\s*\)\s*$/m)?.[1];
    const mappedSchema = body.match(/^\s*@@schema\(\s*"([^"]+)"\s*\)\s*$/m)?.[1];
    models.push({
      model: modelName,
      table: mappedTable || modelName,
      schema: mappedSchema || 'public',
    });
  }

  return models;
}

async function verifySchemaParity() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error('DATABASE_URL is required.');

  const schemaPath = path.resolve(__dirname, '../prisma/schema.prisma');
  const schemaText = fs.readFileSync(schemaPath, 'utf8');
  const expected = extractExpectedTables(schemaText);
  const connectionUrl = new URL(databaseUrl);
  connectionUrl.searchParams.delete('schema');
  const client = new Client({ connectionString: connectionUrl.toString() });

  await client.connect();
  try {
    const result = await client.query(
      "SELECT schemaname, tablename FROM pg_catalog.pg_tables WHERE schemaname NOT IN ('pg_catalog', 'information_schema')",
    );
    const existing = new Set(result.rows.map((row) => `${row.schemaname}.${row.tablename}`));
    const missing = expected.filter((item) => !existing.has(`${item.schema}.${item.table}`));

    console.log(`Prisma models checked: ${expected.length}`);
    console.log(`Database tables found: ${existing.size}`);
    if (missing.length) {
      console.error('Missing Prisma model tables:');
      for (const item of missing) console.error(`- ${item.model} -> ${item.schema}.${item.table}`);
      throw new Error(`${missing.length} Prisma model table(s) are missing from the migrated database.`);
    }

    console.log('Schema parity PASS: every non-ignored Prisma model has a database table.');
    return { expected: expected.length, existing: existing.size, missing: [] };
  } finally {
    await client.end();
  }
}

if (require.main === module) {
  verifySchemaParity().catch((error) => {
    console.error('[schema-parity] FAILED:', error.message || error);
    process.exitCode = 1;
  });
}

module.exports = { extractExpectedTables, verifySchemaParity };
