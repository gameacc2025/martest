// مسیر فایل: backend/src/config/db.test.js
// =============================================================
// Unit tests — Prisma Client singleton (config/db.js)
//
// Run with:  node --test
//
// Validates that db.js:
//   1. Exports a single PrismaClient instance (singleton).
//   2. Registers a process 'beforeExit' handler for graceful disconnect.
//   3. Configures log levels differently for development vs production.
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

// ── Helpers ───────────────────────────────────────────────────

function makeMockPrisma() {
  const disconnectCalls = [];
  return {
    instance: {
      $disconnect: async () => { disconnectCalls.push(Date.now()); },
    },
    disconnectCalls,
  };
}

function loadDbModule(envOverride) {
  // Inject a mock env module before loading db.js
  const envPath = require.resolve('./env');
  const originalEnv = require.cache[envPath];
  require.cache[envPath] = new Module(envPath);
  require.cache[envPath].exports = {
    nodeEnv: envOverride || 'development',
  };
  require.cache[envPath].loaded = true;
  test.after(() => {
    if (originalEnv) require.cache[envPath] = originalEnv;
    else delete require.cache[envPath];
  });

  // Clear the db module from cache so it re-executes
  const dbPath = require.resolve('./db');
  const originalDb = require.cache[dbPath];
  delete require.cache[dbPath];

  return { dbPath, originalDb };
}

// ── Tests ─────────────────────────────────────────────────────

test('db.js: exports a PrismaClient instance with $disconnect method', () => {
  // Mock @prisma/client to avoid needing a real database connection
  const prismaPath = require.resolve('@prisma/client');
  const originalPrisma = require.cache[prismaPath];
  const mockDisconnect = async () => {};
  require.cache[prismaPath] = new Module(prismaPath);
  require.cache[prismaPath].exports = {
    PrismaClient: class MockPrismaClient {
      constructor() {
        this.$disconnect = mockDisconnect;
      }
    },
  };
  require.cache[prismaPath].loaded = true;
  test.after(() => {
    if (originalPrisma) require.cache[prismaPath] = originalPrisma;
    else delete require.cache[prismaPath];
  });

  const { dbPath, originalDb } = loadDbModule('development');

  try {
    const prisma = require(dbPath);
    assert.ok(prisma, 'db.js should export a truthy value');
    assert.equal(typeof prisma.$disconnect, 'function', 'exported value should have $disconnect');
  } finally {
    // Restore
    if (originalDb) require.cache[dbPath] = originalDb;
    else delete require.cache[dbPath];
  }
});

test('db.js: registers a process beforeExit handler', () => {
  const prismaPath = require.resolve('@prisma/client');
  const originalPrisma = require.cache[prismaPath];
  require.cache[prismaPath] = new Module(prismaPath);
  require.cache[prismaPath].exports = {
    PrismaClient: class MockPrismaClient {
      constructor() { this.$disconnect = async () => {}; }
    },
  };
  require.cache[prismaPath].loaded = true;
  test.after(() => {
    if (originalPrisma) require.cache[prismaPath] = originalPrisma;
    else delete require.cache[prismaPath];
  });

  const listenersBefore = process.listenerCount('beforeExit');
  const { dbPath, originalDb } = loadDbModule('development');
  let prisma;
  try {
    prisma = require(dbPath);
  } finally {
    if (originalDb) require.cache[dbPath] = originalDb;
    else delete require.cache[dbPath];
  }

  const listenersAfter = process.listenerCount('beforeExit');
  assert.ok(
    listenersAfter > listenersBefore,
    'db.js should add at least one beforeExit listener (for graceful $disconnect)',
  );
});

test('db.js: configures log levels based on nodeEnv', () => {
  const prismaPath = require.resolve('@prisma/client');
  const originalPrisma = require.cache[prismaPath];

  let capturedConfig;
  require.cache[prismaPath] = new Module(prismaPath);
  require.cache[prismaPath].exports = {
    PrismaClient: class MockPrismaClient {
      constructor(config) { capturedConfig = config; this.$disconnect = async () => {}; }
    },
  };
  require.cache[prismaPath].loaded = true;
  test.after(() => {
    if (originalPrisma) require.cache[prismaPath] = originalPrisma;
    else delete require.cache[prismaPath];
  });

  // Test development config
  const { dbPath: devPath, originalDb: devOriginal } = loadDbModule('development');
  try {
    capturedConfig = null;
    require(devPath);
    assert.ok(capturedConfig, 'config should be passed to PrismaClient');
    assert.ok(
      capturedConfig.log.some((l) => l.level === 'warn'),
      'development should log warnings',
    );
  } finally {
    if (devOriginal) require.cache[devPath] = devOriginal;
    else delete require.cache[devPath];
  }

  // Test production config
  const { dbPath: prodPath, originalDb: prodOriginal } = loadDbModule('production');
  try {
    capturedConfig = null;
    require(prodPath);
    assert.ok(capturedConfig, 'config should be passed to PrismaClient');
    const levels = capturedConfig.log.map((l) => l.level);
    assert.ok(
      levels.includes('error'),
      'production should log errors',
    );
    assert.ok(
      !levels.includes('warn'),
      'production should NOT log warnings',
    );
  } finally {
    if (prodOriginal) require.cache[prodPath] = prodOriginal;
    else delete require.cache[prodPath];
  }
});

test('db.js: exports the same instance on repeated requires (singleton)', () => {
  const prismaPath = require.resolve('@prisma/client');
  const originalPrisma = require.cache[prismaPath];
  require.cache[prismaPath] = new Module(prismaPath);
  require.cache[prismaPath].exports = {
    PrismaClient: class MockPrismaClient {
      constructor() { this.$disconnect = async () => {}; }
    },
  };
  require.cache[prismaPath].loaded = true;
  test.after(() => {
    if (originalPrisma) require.cache[prismaPath] = originalPrisma;
    else delete require.cache[prismaPath];
  });

  const { dbPath, originalDb } = loadDbModule('development');
  try {
    const first = require(dbPath);
    const second = require(dbPath);
    assert.equal(first, second, 'consecutive requires should return the same object reference');
  } finally {
    if (originalDb) require.cache[dbPath] = originalDb;
    else delete require.cache[dbPath];
  }
});
